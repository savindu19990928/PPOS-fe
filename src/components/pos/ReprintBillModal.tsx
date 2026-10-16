import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PrinterIcon, AlertCircleIcon, UserIcon, RefreshCwIcon, XCircleIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { Sale } from '../../types';

interface ReprintBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess: (reprintedSale: Sale) => void;
}

export function ReprintBillModal({
  isOpen,
  onClose,
  sale,
  onSuccess
}: ReprintBillModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isCustomerNameMissing = !sale?.customer_name || sale.customer_name.trim() === '';

  useEffect(() => {
    if (sale) {
      setCustomerName(sale.customer_name || '');
      setReason('');
      setError('');
      setIsLoading(false);
    }
  }, [sale, isOpen]);

  if (!sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Rule check: if customer name was not present originally, customer name MUST be provided
    if (isCustomerNameMissing && !customerName.trim()) {
      setError('Customer name is required before reprinting because no customer name was recorded on the original bill.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: { customer_name?: string; reason?: string } = {
        reason: reason.trim() || 'Receipt reprint requested'
      };

      // Always supply customer_name if provided or if it was missing originally
      if (customerName.trim()) {
        payload.customer_name = customerName.trim();
      }

      const reprintedSale = await api.reprintSale(sale.id, payload);
      onSuccess(reprintedSale);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reprint bill.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reprint Bill — ${sale.sale_number}`}
      size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Name Status Notice */}
        {isCustomerNameMissing ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
            <AlertCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-semibold text-sm text-amber-900">
                Customer Name Required
              </p>
              <p>
                No customer name was recorded when this bill was originally created.
                System policy requires entering a customer name before reprinting for audit purposes.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3.5 flex items-start gap-3">
            <RefreshCwIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-800 space-y-1">
              <p className="font-semibold text-sm text-indigo-900">
                Audit Trail Notice
              </p>
              <p>
                Reprinting this bill will update its status to <strong className="text-indigo-950">REPRINTED</strong>,
                increment the reprint count, and record the reprint timestamp and your username.
              </p>
            </div>
          </div>
        )}

        {/* Bill Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
          <div className="flex justify-between font-mono">
            <span>Bill: {sale.sale_number}</span>
            <span>Orig Date: {new Date(sale.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Orig Cashier: {sale.created_by_name || 'Cashier'}</span>
            <span className="font-bold text-slate-900 font-mono text-sm">
              Total: {parseFloat(sale.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customer Name Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Customer Name {isCustomerNameMissing ? <span className="text-red-500 font-bold">*</span> : <span className="text-slate-400 font-normal">(Recorded on original)</span>}
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required={isCustomerNameMissing}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer full name..."
              className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Reprint Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Reprint <span className="text-slate-400 font-normal">(Optional audit notes)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer lost receipt / Duplicate copy requested"
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Reprint & Print Duplicate
          </Button>
        </div>
      </form>
    </Modal>
  );
}
