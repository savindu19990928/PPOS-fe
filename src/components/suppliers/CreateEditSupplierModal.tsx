import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Supplier, CreateSupplierPayload } from '../../types';
import { api } from '../../lib/api';
import {
  Building2Icon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  DollarSignIcon,
  CalendarIcon,
  FileTextIcon,
  AlertCircleIcon
} from 'lucide-react';

interface CreateEditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
  onSuccess: (supplier: Supplier, isEdit: boolean) => void;
}

export function CreateEditSupplierModal({
  isOpen,
  onClose,
  supplierToEdit,
  onSuccess
}: CreateEditSupplierModalProps) {
  const isEdit = Boolean(supplierToEdit);

  const [formData, setFormData] = useState<CreateSupplierPayload>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    amount_owed: '0.00',
    payment_due_date: '',
    refund_owed: '0.00',
    refund_due_date: '',
    next_supply_date: '',
    next_supply_notes: '',
    notes: '',
    is_active: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name || '',
        contact_person: supplierToEdit.contact_person || '',
        phone: supplierToEdit.phone || '',
        email: supplierToEdit.email || '',
        address: supplierToEdit.address || '',
        amount_owed: supplierToEdit.amount_owed || '0.00',
        payment_due_date: supplierToEdit.payment_due_date || '',
        refund_owed: supplierToEdit.refund_owed || '0.00',
        refund_due_date: supplierToEdit.refund_due_date || '',
        next_supply_date: supplierToEdit.next_supply_date || '',
        next_supply_notes: supplierToEdit.next_supply_notes || '',
        notes: supplierToEdit.notes || '',
        is_active: supplierToEdit.is_active ?? true
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        amount_owed: '0.00',
        payment_due_date: '',
        refund_owed: '0.00',
        refund_due_date: '',
        next_supply_date: '',
        next_supply_notes: '',
        notes: '',
        is_active: true
      });
    }
    setError(null);
  }, [supplierToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Supplier name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateSupplierPayload = {
        name: formData.name.trim(),
        contact_person: formData.contact_person?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        amount_owed: formData.amount_owed || '0.00',
        payment_due_date: formData.payment_due_date || null,
        refund_owed: formData.refund_owed || '0.00',
        refund_due_date: formData.refund_due_date || null,
        next_supply_date: formData.next_supply_date || null,
        next_supply_notes: formData.next_supply_notes?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        is_active: formData.is_active
      };

      let result: Supplier;
      if (isEdit && supplierToEdit) {
        result = await api.updateSupplier(supplierToEdit.id, payload);
      } else {
        result = await api.createSupplier(payload);
      }

      onSuccess(result, isEdit);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save supplier. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Supplier: ${supplierToEdit?.name}` : 'Register New Supplier'}
      size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error saving supplier</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Section 1: Company & Contact Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Building2Icon className="h-4 w-4 text-emerald-600" />
            <span>Company & Contact Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Supplier Business Name *"
                placeholder="e.g. PharmaCorp Global"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Input
                label="Primary Contact Person"
                placeholder="e.g. Kamal Perera"
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Phone Number"
                placeholder="e.g. 0771234567"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Input
                type="email"
                label="Email Address"
                placeholder="e.g. orders@pharmacorp.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                Active Supplier
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Warehouse / Office Address
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 123 High Street, Colombo 03"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Financial Terms (Payables & Refunds) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <DollarSignIcon className="h-4 w-4 text-emerald-600" />
            <span>Payables & Refund Balances</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                step="0.01"
                min="0"
                label="Amount We Owe (Payable Rs.)"
                value={formData.amount_owed || '0.00'}
                onChange={(e) => setFormData({ ...formData, amount_owed: e.target.value })}
              />
            </div>

            <div>
              <Input
                type="date"
                label="Payment Due Date"
                value={formData.payment_due_date || ''}
                onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
              />
            </div>

            <div>
              <Input
                type="number"
                step="0.01"
                min="0"
                label="Refund Owed to Us (Receivable Rs.)"
                value={formData.refund_owed || '0.00'}
                onChange={(e) => setFormData({ ...formData, refund_owed: e.target.value })}
              />
            </div>

            <div>
              <Input
                type="date"
                label="Refund Due Date"
                value={formData.refund_due_date || ''}
                onChange={(e) => setFormData({ ...formData, refund_due_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Delivery Schedule & Internal Notes */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <CalendarIcon className="h-4 w-4 text-emerald-600" />
            <span>Scheduled Delivery & Contract Notes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                type="date"
                label="Next Supply Date"
                value={formData.next_supply_date || ''}
                onChange={(e) => setFormData({ ...formData, next_supply_date: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Expected Supply Items / Order Note"
                placeholder="e.g. Antibiotics restock batch #8"
                value={formData.next_supply_notes || ''}
                onChange={(e) => setFormData({ ...formData, next_supply_notes: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Internal Remarks / Contract Terms
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Net 30 payment terms, 5% cash discount if paid within 10 days"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
