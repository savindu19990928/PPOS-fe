import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Supplier, RecordSupplierPaymentResponse } from '../../types';
import { api } from '../../lib/api';
import { DollarSignIcon, CalendarIcon, AlertCircleIcon, CreditCardIcon } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSuccess: (response: RecordSupplierPaymentResponse) => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  supplier,
  onSuccess
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountOwed = supplier ? parseFloat(supplier.amount_owed || '0') : 0;
  const paymentAmount = parseFloat(amount || '0');
  const remainingOwed = Math.max(0, amountOwed - paymentAmount);

  useEffect(() => {
    if (supplier) {
      setAmount('');
      setNewDueDate(supplier.payment_due_date || '');
      setNotes('');
      setError(null);
    }
  }, [supplier, isOpen]);

  const handleQuickAmount = (ratio: number) => {
    const val = (amountOwed * ratio).toFixed(2);
    setAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    if (paymentAmount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (paymentAmount > amountOwed) {
      setError(`Payment amount (Rs. ${paymentAmount.toFixed(2)}) cannot exceed amount owed (Rs. ${amountOwed.toFixed(2)}).`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.recordSupplierPayment(supplier.id, {
        amount: paymentAmount.toFixed(2),
        new_payment_due_date: remainingOwed > 0 && newDueDate ? newDueDate : undefined,
        notes: notes.trim() || undefined
      });

      onSuccess(response);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record supplier payment.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supplier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment to ${supplier.name}`}
      size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Amount Owed Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">Current Amount Owed:</span>
            <span className="text-lg font-bold text-red-600">
              Rs. {amountOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {supplier.payment_due_date && (
            <p className="text-xs text-slate-400 mt-1">
              Payment deadline: {supplier.payment_due_date}
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
            Pay Full (100%)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => handleQuickAmount(0.5)}>
            Pay 50%
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => handleQuickAmount(0.25)}>
            Pay 25%
          </Button>
        </div>

        {/* Amount to pay input */}
        <Input
          type="number"
          step="0.01"
          min="0.01"
          max={amountOwed}
          label="Payment Amount (Rs.) *"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        {/* Balance After Payment Preview */}
        {paymentAmount > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between font-semibold text-emerald-900">
              <span>Remaining Balance:</span>
              <span>Rs. {remainingOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {remainingOwed === 0 && (
              <p className="text-emerald-700">Account will be fully settled! Payment due date will be cleared.</p>
            )}
          </div>
        )}

        {/* New Due Date (if balance remaining) */}
        {remainingOwed > 0 && (
          <Input
            type="date"
            label="New Payment Due Date for Remaining Balance (Optional)"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment Notes / Transaction Ref
          </label>
          <textarea
            rows={2}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Bank transfer ref #TXN88921 or Cheque #4928"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <CreditCardIcon className="h-4 w-4 mr-1.5" />
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
