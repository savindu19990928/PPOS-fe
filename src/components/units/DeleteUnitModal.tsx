import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { UnitOfMeasure, Product } from '../../types';
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  ShieldAlertIcon,
  PackageIcon,
  ExternalLinkIcon,
  InfoIcon,
  CheckCircle2Icon
} from 'lucide-react';

interface DeleteUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitOfMeasure | null;
  onSuccess: (unitId: number, unitName: string) => void;
  onViewProducts?: (unit: UnitOfMeasure) => void;
}

export function DeleteUnitModal({
  isOpen,
  onClose,
  unit,
  onSuccess,
  onViewProducts
}: DeleteUnitModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockedData, setBlockedData] = useState<{
    detail: string;
    product_count: number;
  } | null>(null);

  if (!unit) return null;

  const productCount =
    blockedData?.product_count !== undefined
      ? blockedData.product_count
      : typeof unit.product_count === 'number'
      ? unit.product_count
      : 0;

  const isBlocked = productCount > 0 || Boolean(blockedData);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteUnit(unit.id);
      onSuccess(unit.id, unit.name);
      onClose();
    } catch (err: any) {
      const errorData = err.data;
      if (err.status === 400 || errorData?.product_count) {
        const detail =
          errorData?.detail ||
          err.message ||
          `Cannot delete unit of measure '${unit.name}' because products are currently assigned to it.`;
        setBlockedData({
          detail,
          product_count: errorData?.product_count || unit.product_count || 1
        });
        setErrorMessage(detail);
      } else {
        setErrorMessage(err.message || 'Failed to delete unit of measure.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setBlockedData(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isBlocked ? 'Cannot Delete Unit of Measure' : 'Delete Unit Confirmation'}
      size="md">
      <div className="space-y-4">
        {isBlocked ? (
          /* High-visibility Deletion Blocked State */
          <>
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <ShieldAlertIcon className="h-5 w-5 text-amber-700" />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="text-sm font-bold text-amber-950 mb-1">
                  Integrity Protection: Unit is in Active Use
                </p>
                <p className="text-amber-900 leading-relaxed">
                  {blockedData?.detail ||
                    `Cannot delete unit of measure '${unit.name}' because it is currently assigned to ${productCount} existing product(s).`}
                </p>
                <p className="text-amber-800 font-medium mt-2">
                  Please reassign or delete those products before removing this packaging unit from the system.
                </p>
              </div>
            </div>

            {/* Unit Details Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-mono text-[11px]">Target Unit</span>
                  <p className="text-sm font-bold text-slate-900">
                    {unit.name}{' '}
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 ml-1">
                      {unit.abbreviation}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-mono text-[11px]">Assigned Products</span>
                  <p className="text-sm font-bold text-red-600 font-mono">
                    {productCount} item{productCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions for blocked state */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
              {onViewProducts ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleClose();
                    onViewProducts(unit);
                  }}
                  className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100/50">
                  <PackageIcon className="h-3.5 w-3.5 mr-1.5 text-amber-700" />
                  View Assigned Products ({productCount})
                </Button>
              ) : (
                <div />
              )}

              <Button
                type="button"
                variant="primary"
                onClick={handleClose}
                className="text-xs">
                Understood / Close
              </Button>
            </div>
          </>
        ) : (
          /* Normal Deletion Confirmation for Fresh / Unused Unit */
          <>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
              <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Permanent Removal</p>
                <p className="text-red-800 leading-relaxed">
                  Are you sure you want to permanently delete the unit of measure{' '}
                  <strong>"{unit.name}" ({unit.abbreviation})</strong>?
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Name:</span>
                <span className="font-semibold text-slate-900">{unit.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Abbreviation:</span>
                <span className="font-mono font-semibold text-slate-900">{unit.abbreviation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Products:</span>
                <span className="font-mono font-semibold text-emerald-700">0 (Safe to delete)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                isLoading={isDeleting}>
                Permanently Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
