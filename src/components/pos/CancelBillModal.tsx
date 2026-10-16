import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangleIcon, XCircleIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { Sale } from '../../types';

interface CancelBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess: (updatedSale: Sale) => void;
}

export function CancelBillModal({
  isOpen,
  onClose,
  sale,
  onSuccess
}: CancelBillModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!sale) return null;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.cancelSale(sale.id, {
        cancellation_reason: reason.trim() || undefined
      });
      onSuccess(response.sale || { ...sale, status: 'CANCELLED', cancellation_reason: reason });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel the bill.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Bill — ${sale.sale_number}`}
      size="md">
      <form onSubmit={handleCancelSubmit} className="space-y-4">
        {/* Warning Callout */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3">
          <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 space-y-1">
            <p className="font-semibold text-sm text-red-900">
              Irreversible Bill Cancellation
            </p>
            <p>
              Cancelling bill <strong className="font-mono">{sale.sale_number}</strong> will:
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Mark bill status as <strong className="text-red-900">CANCELLED</strong>.</li>
              <li>Automatically reverse inventory stock movements.</li>
              <li>Reverse cash register balance if paid with cash.</li>
              <li>Permanently prevent any future reprints or cancellations of this bill.</li>
            </ul>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex justify-between items-center">
          <div>
            <p className="font-semibold text-slate-900">{sale.customer_name || 'Walk-in Customer'}</p>
            <p className="text-slate-500 font-mono text-[11px]">{sale.sale_number}</p>
          </div>
          <div className="text-right">
            <p className="font-bold font-mono text-sm text-slate-900">
              {parseFloat(sale.total).toFixed(2)}
            </p>
            <span className="text-[11px] text-slate-500">{sale.payment_method}</span>
          </div>
        </div>

        {/* Reason Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cancellation Reason <span className="text-slate-400 font-normal">(Required / Audit Record)</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer returned medication / Entry mistake / Incorrect dosage"
            className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-xs flex items-center gap-2">
            <XCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Nevermind
          </Button>
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
            isLoading={isLoading}>
            Confirm Bill Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
