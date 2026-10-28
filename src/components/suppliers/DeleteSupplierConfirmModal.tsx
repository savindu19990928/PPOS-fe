import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Supplier } from '../../types';
import { api } from '../../lib/api';
import { AlertTriangleIcon, Trash2Icon, AlertCircleIcon } from 'lucide-react';

interface DeleteSupplierConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSuccess: (deletedId: number) => void;
}

export function DeleteSupplierConfirmModal({
  isOpen,
  onClose,
  supplier,
  onSuccess
}: DeleteSupplierConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supplier) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteSupplier(supplier.id);
      onSuccess(supplier.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete supplier.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Supplier Confirmation"
      size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-900">
            <p className="font-bold">Are you sure you want to delete this supplier?</p>
            <p className="mt-1 text-xs text-red-700">
              Supplier: <strong className="font-semibold text-slate-900">{supplier.name}</strong> (ID #{supplier.id})
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Catalog Safety Guarantee:</p>
          <p>
            Deleting this supplier will NOT delete your inventory products. Any products linked to this supplier will have their supplier reference safely unlinked.
          </p>
          {(parseFloat(supplier.amount_owed || '0') > 0 || parseFloat(supplier.refund_owed || '0') > 0) && (
            <p className="text-amber-700 font-medium pt-1">
              Warning: This supplier currently has an open payable balance of Rs. {supplier.amount_owed} or refund owed of Rs. {supplier.refund_owed}.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}>
            <Trash2Icon className="h-4 w-4 mr-1.5" />
            Delete Supplier
          </Button>
        </div>
      </div>
    </Modal>
  );
}
