import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StockMovement } from '../../types';
import {
  CalendarIcon,
  UserIcon,
  TagIcon,
  FileTextIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  SlidersHorizontalIcon,
  ReceiptIcon,
  BoxesIcon,
  PrinterIcon
} from 'lucide-react';
import { printReceipt } from '../../lib/printer';

interface StockMovementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StockMovement | null;
  onEditClick?: (movement: StockMovement) => void;
}

export function StockMovementDetailModal({
  isOpen,
  onClose,
  movement,
  onEditClick
}: StockMovementDetailModalProps) {
  if (!movement) return null;

  const isSaleLinked = Boolean(movement.sale);

  const getBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return {
          label: movement.movement_type_display || 'Stock In (Purchase)',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ArrowDownLeftIcon,
          sign: '+'
        };
      case 'OUT':
        return {
          label: movement.movement_type_display || 'Stock Out',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: ArrowUpRightIcon,
          sign: '-'
        };
      case 'ADJUSTMENT':
        return {
          label: movement.movement_type_display || 'Inventory Adjustment',
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: SlidersHorizontalIcon,
          sign: '±'
        };
      default:
        return {
          label: movement.movement_type,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: BoxesIcon,
          sign: ''
        };
    }
  };

  const badge = getBadge(movement.movement_type);
  const BadgeIcon = badge.icon;
  const qty = parseFloat(movement.quantity) || 0;
  const cost = movement.unit_cost ? parseFloat(movement.unit_cost) : null;
  const totalValuation = cost !== null ? qty * cost : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stock Movement Details #${movement.id}`}
      size="lg">
      <div className="space-y-4">
        {/* Header summary banner */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Product Movement #{movement.id}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">{movement.product_name}</h3>
            <p className="text-xs font-mono text-slate-300 mt-0.5">
              Barcode: {movement.product_barcode || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.classes}`}>
              <BadgeIcon className="h-3.5 w-3.5" />
              {movement.movement_type}
            </span>
            <div className="text-emerald-400 font-bold text-lg mt-1">
              {badge.sign}
              {qty.toFixed(2)} {movement.product_unit || ''}
            </div>
          </div>
        </div>

        {/* Sale linkage alert if linked */}
        {isSaleLinked && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2.5 text-xs text-blue-900">
            <ReceiptIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-semibold">Linked to Sale: </span>
              <span>
                Bill {movement.sale_number ? `#${movement.sale_number}` : `(Sale ID: ${movement.sale})`}.
                This movement was automatically generated during checkout.
              </span>
            </div>
          </div>
        )}

        {/* Detailed Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <BoxesIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">Quantity Moved</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {qty.toFixed(3)} {movement.product_unit}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <TagIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">Unit Cost</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {cost !== null ? `LKR ${cost.toFixed(2)}` : <span className="text-slate-400 font-normal">None (Optional)</span>}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <FileTextIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">Total Valuation</span>
            </div>
            <div className="text-sm font-semibold text-emerald-700">
              {totalValuation !== null ? `LKR ${totalValuation.toFixed(2)}` : <span className="text-slate-400 font-normal">-</span>}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <FileTextIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">Reference #</span>
            </div>
            <div className="text-sm font-mono font-medium text-slate-900 truncate">
              {movement.reference_number || <span className="text-slate-400 font-normal font-sans">-</span>}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <UserIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">Recorded By</span>
            </div>
            <div className="text-sm font-medium text-slate-900">
              {movement.created_by_name || 'System'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">Timestamp</span>
            </div>
            <div className="text-sm text-slate-900">
              {new Date(movement.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <span className="text-slate-500 font-medium block mb-1">Notes & Description:</span>
          <p className="text-slate-800 whitespace-pre-wrap">
            {movement.notes || <span className="text-slate-400 italic">No notes provided for this movement.</span>}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {!isSaleLinked && onEditClick && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEditClick(movement);
                }}
                className="text-slate-700">
                Edit Movement
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const html = `
                  <div class="center bold" style="font-size:15px; margin-bottom:4px;">MEDIFLEX PHARMACY</div>
                  <div class="center" style="font-size:11px; margin-bottom:8px;">STOCK MOVEMENT VOUCHER</div>
                  <div class="separator"></div>
                  <div class="row"><span>Voucher #:</span><span>#${movement.id}</span></div>
                  <div class="row"><span>Date:</span><span>${new Date(movement.created_at).toLocaleString()}</span></div>
                  <div class="row"><span>Recorded By:</span><span>${movement.created_by_name || 'System'}</span></div>
                  <div class="separator"></div>
                  <div class="row bold"><span>Product:</span><span>${movement.product_name}</span></div>
                  <div class="row"><span>Barcode:</span><span>${movement.product_barcode || 'N/A'}</span></div>
                  <div class="row"><span>Movement Type:</span><span>${movement.movement_type_display || movement.movement_type}</span></div>
                  <div class="row"><span>Quantity:</span><span>${parseFloat(movement.quantity).toFixed(2)} ${movement.product_unit || ''}</span></div>
                  ${movement.unit_cost ? `<div class="row"><span>Unit Cost:</span><span>LKR ${parseFloat(movement.unit_cost).toFixed(2)}</span></div>` : ''}
                  ${totalValuation !== null ? `<div class="row bold"><span>Total Valuation:</span><span>LKR ${totalValuation.toFixed(2)}</span></div>` : ''}
                  ${movement.reference_number ? `<div class="row"><span>Ref #:</span><span>${movement.reference_number}</span></div>` : ''}
                  ${movement.sale ? `<div class="row"><span>Linked Sale:</span><span>Sale #${movement.sale_number || movement.sale}</span></div>` : ''}
                  ${movement.notes ? `<div class="row"><span>Notes:</span><span>${movement.notes}</span></div>` : ''}
                  <div class="separator"></div>
                  <div style="margin-top:20px; font-size:10px;">
                    <div style="display:flex; justify-content:space-between; margin-top:25px;">
                      <div>Verified By: ________________</div>
                      <div>Authorized By: ________________</div>
                    </div>
                  </div>
                `;

                await printReceipt({
                  html,
                  title: `Stock Voucher #${movement.id}`,
                  silent: true
                });
              }}
              className="text-xs text-slate-700 border-slate-300">
              <PrinterIcon className="h-4 w-4 mr-1 text-emerald-600" />
              Print Voucher
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
