import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomerCreditProfile } from '../../types';
import { api } from '../../lib/api';
import { AlertCircleIcon } from 'lucide-react';

interface CreditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerCreditProfile | null;
  onSuccess: () => void;
}

export function CreditCustomerModal({
  isOpen,
  onClose,
  customer,
  onSuccess
}: CreditCustomerModalProps) {
  const isEditing = Boolean(customer);
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setCustomerName(customer.customer_name || '');
        setMobileNumber(customer.mobile_number || '');
        setCreditLimit(customer.credit_limit ? parseFloat(customer.credit_limit).toFixed(2) : '');
        setNotes(customer.notes || '');
      } else {
        setCustomerName('');
        setMobileNumber('');
        setCreditLimit('');
        setNotes('');
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !mobileNumber.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        customer_name: customerName.trim(),
        mobile_number: mobileNumber.trim(),
        credit_limit: creditLimit ? parseFloat(creditLimit) : null,
        notes: notes.trim()
      };

      if (isEditing && customer) {
        await api.updateCreditProfile(customer.id, payload);
      } else {
        await api.createCreditProfile(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save credit customer:', err);
      setError(err?.message || 'Failed to save customer profile. Please check mobile format (07XXXXXXXX).');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer Credit Profile' : 'New Customer Credit Account'}
      size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Input
            label="Customer Full Name *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Saman Kumara"
            required
            autoFocus
          />
        </div>

        <div>
          <Input
            label="Mobile Number * (07XXXXXXXX / +947XXXXXXXX)"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="e.g. 0771234567"
            required
          />
        </div>

        <div>
          <Input
            label="Credit Limit (Optional, LKR)"
            type="number"
            step="0.01"
            min="0"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            placeholder="e.g. 5000.00 (leave empty for unlimited)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Notes / Address / Reference (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Regular neighborhood customer, pays monthly"
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
            variant="primary"
            disabled={!customerName.trim() || !mobileNumber.trim() || isSubmitting}
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
            {isEditing ? 'Save Changes' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
