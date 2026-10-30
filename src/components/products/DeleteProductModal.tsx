import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Product } from '../../types';
import { AlertTriangleIcon, AlertCircleIcon, ShieldAlertIcon } from 'lucide-react';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: (result: { deactivated: boolean; message: string; productId: number }) => void;
}

export function DeleteProductModal({
  isOpen,
  onClose,
  product,
  onSuccess
}: DeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const response = await api.deleteProduct(product.id);
      // Response may be 204 (empty object) or 200 with detail if deactivated
      const isDeactivated = Boolean(response && (response as any).is_active === false);
      const message =
        (response as any)?.detail ||
        (isDeactivated
          ? `Product '${product.name}' has history and was deactivated.`
          : `Product '${product.name}' was permanently deleted.`);

      onSuccess({
        deactivated: isDeactivated,
        message,
        productId: product.id
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product Confirmation"
      size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
          <AlertTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold mb-1">Product Deletion Protection Policy</p>
            <p className="text-amber-800 leading-relaxed">
              If this product has existing sales or stock movement history, it will be{' '}
              <strong>automatically deactivated</strong> to preserve audit trails and accounting records.
              If fresh with no history, it will be permanently deleted.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 mb-0.5">Selected Product</p>
          <p className="text-sm font-bold text-slate-900">{product.name}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
            <span>Barcode: {product.barcode}</span>
            <span>•</span>
            <span>Price: Rs. {parseFloat(product.selling_price).toFixed(2)}</span>
            <span>•</span>
            <span>Stock: {parseFloat(product.current_stock).toFixed(0)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Are you sure you want to proceed with deleting or deactivating this product?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}>
            Confirm Delete / Deactivate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
