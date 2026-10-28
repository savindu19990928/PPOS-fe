import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Supplier, RecordSupplierRefundResponse } from '../../types';
import { api } from '../../lib/api';
import { RotateCcwIcon, AlertCircleIcon, DollarSignIcon } from 'lucide-react';

interface RecordRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSuccess: (response: RecordSupplierRefundResponse) => void;
}

export function RecordRefundModal({
  isOpen,
  onClose,
  supplier,
  onSuccess
}: RecordRefundModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refundOwed = supplier ? parseFloat(supplier.refund_owed || '0') : 0;
  const refundAmount = parseFloat(amount || '0');
  const remainingRefund = Math.max(0, refundOwed - refundAmount);

  useEffect(() => {
    if (supplier) {
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [supplier, isOpen]);

  const handleQuickAmount = (ratio: number) => {
    const val = (refundOwed * ratio).toFixed(2);
    setAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    if (refundAmount <= 0) {
      setError('Refund amount must be greater than zero.');
      return;
    }

    if (refundAmount > refundOwed) {
      setError(`Refund amount (Rs. ${refundAmount.toFixed(2)}) cannot exceed refund owed (Rs. ${refundOwed.toFixed(2)}).`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.recordSupplierRefund(supplier.id, {
        amount: refundAmount.toFixed(2),
        notes: notes.trim() || undefined
      });

      onSuccess(response);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record supplier refund.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supplier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Refund Received from ${supplier.name}`}
      size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Current Refund Owed Card */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-emerald-800">Refund Owed to Us:</span>
            <span className="text-lg font-bold text-emerald-700">
              Rs. {refundOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {supplier.refund_due_date && (
            <p className="text-xs text-emerald-600/80 mt-1">
              Expected refund deadline: {supplier.refund_due_date}
            </p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => handleQuickAmount(1)}>
            Full Refund (100%)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => handleQuickAmount(0.5)}>
            50%
          </Button>
        </div>

        {/* Amount to receive input */}
        <Input
          type="number"
          step="0.01"
          min="0.01"
          max={refundOwed}
          label="Refund Amount Received (Rs.) *"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        {/* Balance Preview */}
        {refundAmount > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Remaining Refund Balance:</span>
              <span>Rs. {remainingRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {remainingRefund === 0 && (
              <p className="text-emerald-600">Supplier refund will be completely cleared!</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Refund Notes / Receipt Ref
          </label>
          <textarea
            rows={2}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Cheque received for returned damaged syrup bottles or Credit Note #CN-102"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <RotateCcwIcon className="h-4 w-4 mr-1.5" />
            Record Refund
          </Button>
        </div>
      </form>
    </Modal>
  );
}
