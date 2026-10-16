import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchableProductSelect } from '../ui/SearchableProductSelect';
import { api } from '../../lib/api';
import { StockMovement, StockMovementType, Product } from '../../types';
import { ArrowDownLeftIcon, ArrowUpRightIcon, SlidersHorizontalIcon, AlertCircleIcon } from 'lucide-react';

interface CreateStockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (movement: StockMovement) => void;
  products?: Product[];
}

export function CreateStockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  products
}: CreateStockMovementModalProps) {
  const [productId, setProductId] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [movementType, setMovementType] = useState<StockMovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setProductId(0);
    setSelectedProduct(undefined);
    setMovementType('IN');
    setQuantity('');
    setUnitCost('');
    setReferenceNumber('');
    setNotes('');
    setError('');
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!productId || productId <= 0) {
      setError('Please select a product from the dropdown.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        product: productId,
        movement_type: movementType,
        quantity: qtyNum.toFixed(3),
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined
      };

      // Unit cost is always optional
      if (unitCost.trim() && !isNaN(parseFloat(unitCost))) {
        payload.unit_cost = parseFloat(unitCost).toFixed(2);
      }

      const created = await api.createStockMovement(payload);
      onSuccess(created);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record stock movement.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Record Stock Movement"
      size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Selection with Search Bar */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <SearchableProductSelect
            value={productId}
            products={products}
            onChange={(id, p) => {
              setProductId(id);
              setSelectedProduct(p);
            }}
            placeholder="Search and select product..."
            required
          />
          {selectedProduct && (
            <p className="text-[11px] text-slate-500 mt-1">
              Current stock: <strong>{selectedProduct.current_stock} {selectedProduct.unit_abbreviation}</strong>
            </p>
          )}
        </div>

        {/* Movement Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Movement Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMovementType('IN')}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                movementType === 'IN'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              <ArrowDownLeftIcon className="h-4 w-4 text-emerald-600" />
              <span>Stock In</span>
            </button>

            <button
              type="button"
              onClick={() => setMovementType('OUT')}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                movementType === 'OUT'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              <ArrowUpRightIcon className="h-4 w-4 text-blue-600" />
              <span>Stock Out</span>
            </button>

            <button
              type="button"
              onClick={() => setMovementType('ADJUSTMENT')}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                movementType === 'ADJUSTMENT'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              <SlidersHorizontalIcon className="h-4 w-4 text-amber-600" />
              <span>Adjustment</span>
            </button>
          </div>
        </div>

        {/* Quantity & Unit Cost (Always Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Cost <span className="text-slate-400 font-normal">(Always Optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="e.g. 10.50 (Optional)"
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reference Number <span className="text-slate-400 font-normal">(Optional invoice / PO #)</span>
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. INV-7890 or PO-2026-001"
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Supplier replenishment, damaged stock write-off..."
            className="w-full p-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            Record Movement
          </Button>
        </div>
      </form>
    </Modal>
  );
}
