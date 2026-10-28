import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Supplier, SupplierProduct } from '../../types';
import { api } from '../../lib/api';
import {
  Building2Icon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  DollarSignIcon,
  CalendarIcon,
  PackageIcon,
  AlertTriangleIcon,
  CreditCardIcon,
  RotateCcwIcon,
  TruckIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2
} from 'lucide-react';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onRecordPayment: (supplier: Supplier) => void;
  onRecordRefund: (supplier: Supplier) => void;
  onMarkNextSupply: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
}

export function SupplierDetailModal({
  isOpen,
  onClose,
  supplier,
  onRecordPayment,
  onRecordRefund,
  onMarkNextSupply,
  onEdit
}: SupplierDetailModalProps) {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    if (isOpen && supplier) {
      if (supplier.products && supplier.products.length > 0) {
        setProducts(supplier.products);
      } else {
        setIsLoadingProducts(true);
        api
          .getSupplierProducts(supplier.id)
          .then((items) => {
            setProducts(items);
          })
          .catch((err) => {
            console.error('Error fetching supplier products:', err);
            setProducts([]);
          })
          .finally(() => {
            setIsLoadingProducts(false);
          });
      }
    } else {
      setProducts([]);
    }
  }, [isOpen, supplier]);

  if (!supplier) return null;

  const amountOwed = parseFloat(supplier.amount_owed || '0');
  const refundOwed = parseFloat(supplier.refund_owed || '0');
  const netBalance = amountOwed - refundOwed;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Supplier: ${supplier.name}`}
      size="4xl">
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{supplier.name}</h3>
                <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                  {supplier.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ID #{supplier.id} • Registered{' '}
                {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-white border-slate-700 hover:bg-slate-800"
              onClick={() => onEdit(supplier)}>
              Edit Info
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => onMarkNextSupply(supplier)}>
              <TruckIcon className="h-3.5 w-3.5 mr-1.5" />
              Schedule Delivery
            </Button>
          </div>
        </div>

        {/* 2-Column Info Grid: Contact & Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2Icon className="h-4 w-4 text-emerald-600" />
              Contact & Location
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Contact Person</span>
                <span className="font-medium text-slate-900">
                  {supplier.contact_person || 'Not specified'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1">
                  <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                  Phone
                </span>
                {supplier.phone ? (
                  <a
                    href={`tel:${supplier.phone}`}
                    className="font-medium text-emerald-600 hover:underline">
                    {supplier.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1">
                  <MailIcon className="h-3.5 w-3.5 text-slate-400" />
                  Email
                </span>
                {supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="font-medium text-emerald-600 hover:underline truncate max-w-[200px]">
                    {supplier.email}
                  </a>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </div>

              <div className="pt-1">
                <span className="text-slate-500 flex items-center gap-1 text-xs mb-1">
                  <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                  Physical Address:
                </span>
                <p className="text-slate-800 text-xs bg-white p-2 rounded border border-slate-200">
                  {supplier.address || 'No address specified.'}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Overview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <DollarSignIcon className="h-4 w-4 text-emerald-600" />
              Payables & Receivables
            </h4>

            {/* We Owe Money (Payables) */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Amount We Owe (Payable)</span>
                  <div className="text-lg font-bold text-red-600">
                    Rs. {amountOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  disabled={amountOwed <= 0}
                  onClick={() => onRecordPayment(supplier)}>
                  <CreditCardIcon className="h-3.5 w-3.5 mr-1" />
                  Pay Now
                </Button>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Due Date: {supplier.payment_due_date || 'None set'}</span>
                {supplier.is_payment_overdue ? (
                  <Badge variant="error">
                    Overdue ({Math.abs(supplier.days_until_payment_due || 0)}d)
                  </Badge>
                ) : supplier.payment_due_date ? (
                  <Badge variant="info">{supplier.days_until_payment_due}d left</Badge>
                ) : null}
              </div>
            </div>

            {/* Supplier Owes Us (Refund) */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Refund Owed to Us</span>
                  <div className="text-lg font-bold text-emerald-600">
                    Rs. {refundOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  disabled={refundOwed <= 0}
                  onClick={() => onRecordRefund(supplier)}>
                  <RotateCcwIcon className="h-3.5 w-3.5 mr-1" />
                  Receive Refund
                </Button>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Due Date: {supplier.refund_due_date || 'None set'}</span>
                {supplier.is_refund_overdue ? (
                  <Badge variant="error">
                    Overdue ({Math.abs(supplier.days_until_refund_due || 0)}d)
                  </Badge>
                ) : supplier.refund_due_date ? (
                  <Badge variant="info">{supplier.days_until_refund_due}d left</Badge>
                ) : null}
              </div>
            </div>

            {/* Net Position */}
            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Net Position:</span>
              <span
                className={`font-bold ${
                  netBalance > 0
                    ? 'text-red-600'
                    : netBalance < 0
                    ? 'text-emerald-600'
                    : 'text-slate-600'
                }`}>
                {netBalance > 0
                  ? `Net Payable: Rs. ${netBalance.toFixed(2)}`
                  : netBalance < 0
                  ? `Net Receivable: Rs. ${Math.abs(netBalance).toFixed(2)}`
                  : 'Balanced (Rs. 0.00)'}
              </span>
            </div>
          </div>
        </div>

        {/* Scheduled Delivery & Order Notes */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TruckIcon className="h-4 w-4 text-emerald-600" />
              Next Scheduled Delivery
            </h4>
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-slate-600 border-slate-300 hover:bg-white"
              onClick={() => onMarkNextSupply(supplier)}>
              Update Schedule
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-xs text-slate-400">Delivery Date</span>
              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                {supplier.next_supply_date || 'No delivery scheduled'}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400">Countdown</span>
              <div className="mt-0.5">
                {supplier.days_until_next_supply !== undefined &&
                supplier.days_until_next_supply !== null ? (
                  supplier.days_until_next_supply === 0 ? (
                    <Badge variant="success">Scheduled Today</Badge>
                  ) : supplier.days_until_next_supply < 0 ? (
                    <Badge variant="error">
                      {Math.abs(supplier.days_until_next_supply)}d Overdue
                    </Badge>
                  ) : (
                    <Badge variant="info">In {supplier.days_until_next_supply} days</Badge>
                  )
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>

            <div className="sm:col-span-1">
              <span className="text-xs text-slate-400">Order Notes</span>
              <div className="text-xs text-slate-700 mt-0.5 truncate">
                {supplier.next_supply_notes || 'No notes provided'}
              </div>
            </div>
          </div>
        </div>

        {/* Supplied Products Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Catalog Products Supplied ({products.length})
              </h4>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs text-slate-500 mt-2">Loading supplier catalog products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <PackageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No products linked to this supplier</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign this supplier to inventory products in the Products management section.
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Barcode</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Stock Level</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {products.map((item) => {
                    const stock = parseFloat(item.current_stock || '0');
                    const minStock = parseFloat(item.minimum_stock_level || '0');
                    const isLow = stock <= minStock;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-500">
                          {item.barcode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          Rs. {parseFloat(item.selling_price || '0').toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold ${
                              isLow ? 'text-red-600' : 'text-slate-700'
                            }`}>
                            {stock.toFixed(2)} {item.unit_abbreviation || ''}
                          </span>
                          {minStock > 0 && (
                            <span className="text-xs text-slate-400 ml-1">
                              (min: {minStock.toFixed(2)})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isLow ? (
                            <Badge variant="error" className="text-[10px]">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              Adequate
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Remarks / Internal Notes */}
        {supplier.notes && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <span className="font-bold block mb-1">Contract / Internal Notes:</span>
            <p>{supplier.notes}</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
