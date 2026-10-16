import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CustomerCreditProfile } from '../../types';
import { api } from '../../lib/api';
import { ShieldAlertIcon, AlertCircleIcon } from 'lucide-react';

interface BanCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerCreditProfile | null;
  onSuccess: () => void;
}

export function BanCustomerModal({
  isOpen,
  onClose,
  customer,
  onSuccess
}: BanCustomerModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.banCreditCustomer(customer.id, reason.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to ban customer:', err);
      setError(err?.message || 'Failed to ban customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ban Customer from Credit Purchases"
      size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <ShieldAlertIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-950 space-y-1">
            <p className="font-bold text-sm">
              Ban '{customer.customer_name}' ({customer.mobile_number})
            </p>
            <p className="text-red-800">
              This will block this customer from making any credit / pay later purchases at the POS counter. They can still purchase with cash or card.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Ban Reason (Required)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Overdue balance unpaid for 60 days / repeated payment delays"
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            required
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!reason.trim() || isSubmitting}
            isLoading={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]">
            Confirm Ban
          </Button>
        </div>
      </form>
    </Modal>
  );
}
