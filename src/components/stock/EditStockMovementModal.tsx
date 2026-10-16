import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { StockMovement } from '../../types';
import { AlertCircleIcon, AlertTriangleIcon, CheckIcon } from 'lucide-react';

interface EditStockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: StockMovement) => void;
  movement: StockMovement | null;
}

export function EditStockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  movement
}: EditStockMovementModalProps) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (movement) {
      setReferenceNumber(movement.reference_number || '');
      setNotes(movement.notes || '');
      setError('');
    }
  }, [movement]);

  if (!movement) return null;

  const isLinkedToSale = Boolean(movement.sale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLinkedToSale) {
      setError('Movements linked to sales cannot be modified.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const updated = await api.updateStockMovement(movement.id, {
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update stock movement.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMovementBadgeClass = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OUT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ADJUSTMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Stock Movement #${movement.id}`}
      size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLinkedToSale && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangleIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Sale-Linked Movement</p>
              <p className="mt-0.5 text-amber-700">
                This stock movement was automatically recorded by Sale{' '}
                <span className="font-mono font-medium">
                  {movement.sale_number ? `#${movement.sale_number}` : `ID: ${movement.sale}`}
                </span>{' '}
                and cannot be altered.
              </p>
            </div>
          </div>
        )}

        {/* Read-Only Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-slate-900 text-sm">{movement.product_name}</p>
              <p className="font-mono text-slate-500">Barcode: {movement.product_barcode || '-'}</p>
            </div>
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getMovementBadgeClass(
                movement.movement_type
              )}`}>
              {movement.movement_type_display || movement.movement_type}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-slate-600">
            <div>
              <span className="text-[11px] text-slate-400 block">Quantity</span>
              <span className="font-semibold text-slate-800 text-sm">
                {parseFloat(movement.quantity).toFixed(2)} {movement.product_unit || ''}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Unit Cost</span>
              <span className="font-semibold text-slate-800">
                {movement.unit_cost ? `LKR ${parseFloat(movement.unit_cost).toFixed(2)}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Created At</span>
              <span className="text-slate-800">
                {new Date(movement.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reference Number / Invoice #
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              disabled={isLinkedToSale || isLoading}
              placeholder="e.g., INV-7890-REVISED, PO-2026-001"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes & Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLinkedToSale || isLoading}
              rows={3}
              placeholder="Additional remarks or explanation for this stock entry..."
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {!isLinkedToSale && (
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isLoading ? (
                'Saving...'
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4" /> Save Changes
                </span>
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
