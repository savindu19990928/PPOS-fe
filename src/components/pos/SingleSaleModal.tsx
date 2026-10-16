import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  PrinterIcon,
  XIcon,
  BanIcon,
  Loader2,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  StoreIcon,
  AlertTriangleIcon,
  HistoryIcon,
  RefreshCwIcon
} from 'lucide-react';
import { api } from '../../lib/api';
import { Sale } from '../../types';
import { isFirstPrintRecorded } from '../../lib/printer';

interface SingleSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
  onReprintRequested: (sale: Sale) => void;
  onCancelRequested: (sale: Sale) => void;
  onPrintRequested?: (sale: Sale) => void;
}

export function SingleSaleModal({
  isOpen,
  onClose,
  saleId,
  onReprintRequested,
  onCancelRequested,
  onPrintRequested
}: SingleSaleModalProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && saleId) {
      loadSaleDetails(saleId);
    } else {
      setSale(null);
      setError('');
    }
  }, [isOpen, saleId]);

  const loadSaleDetails = async (id: number) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getSaleDetails(id);
      setSale(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bill details');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isCancelled = sale?.status === 'CANCELLED';
  const isReprinted = sale?.status === 'REPRINTED' || (sale?.reprint_count != null && sale.reprint_count > 0);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CANCELLED':
        return <Badge variant="error">Cancelled</Badge>;
      case 'REPRINTED':
        return <Badge variant="info">Reprinted {sale?.reprint_count ? `(${sale.reprint_count}x)` : ''}</Badge>;
      case 'COMPLETED':
      default:
        return <Badge variant="success">Completed</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sale ? `Sale Details — ${sale.sale_number}` : 'Bill Details'}
      size="xl">
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-400 mt-3">Loading bill details...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <Button variant="secondary" size="sm" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      ) : sale ? (
        <div className="space-y-6">
          {/* Header Summary Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold font-mono text-slate-900">{sale.sale_number}</h3>
                {getStatusBadge(sale.status)}
                {sale.is_corrected && <Badge variant="warning">Corrected</Badge>}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                {new Date(sale.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isCancelled && (
                <>
                  {!isFirstPrintRecorded(sale) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 font-medium"
                      onClick={() => (onPrintRequested ? onPrintRequested(sale) : onReprintRequested(sale))}>
                      <PrinterIcon className="h-4 w-4 mr-1.5" />
                      Print Bill
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-200 font-medium"
                      onClick={() => onReprintRequested(sale)}>
                      <RefreshCwIcon className="h-4 w-4 mr-1.5" />
                      Reprint Bill
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => onCancelRequested(sale)}>
                    <BanIcon className="h-4 w-4 mr-1.5" />
                    Cancel Bill
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Cancellation Notice Banner */}
          {isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-900 space-y-1">
                <p className="font-bold text-sm">Bill Cancelled</p>
                <p>
                  Cancelled by <span className="font-semibold">{sale.cancelled_by_name || 'Admin'}</span>
                  {sale.cancelled_at && ` on ${new Date(sale.cancelled_at).toLocaleString()}`}.
                </p>
                {sale.cancellation_reason && (
                  <p className="mt-1 bg-red-100/60 p-2 rounded border border-red-200 text-red-950 font-mono">
                    Reason: {sale.cancellation_reason}
                  </p>
                )}
                <p className="text-red-700 italic">Inventory and register movements have been reversed.</p>
              </div>
            </div>
          )}

          {/* Reprint Audit Summary Banner */}
          {isReprinted && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <RefreshCwIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-0.5">
                  <p className="font-bold text-sm">Reprint Audit Record</p>
                  <p>
                    Reprinted <span className="font-semibold">{sale.reprint_count || 1} time(s)</span>. Last reprinted by{' '}
                    <span className="font-semibold">{sale.reprinted_by_name || 'Admin'}</span>
                    {sale.reprinted_at && ` on ${new Date(sale.reprinted_at).toLocaleString()}`}.
                  </p>
                </div>
              </div>

              {/* Reprint History Log */}
              {sale.reprint_history && sale.reprint_history.length > 0 && (
                <div className="border-t border-indigo-200/70 pt-2">
                  <p className="text-xs font-semibold text-indigo-950 mb-1.5 flex items-center gap-1.5">
                    <HistoryIcon className="h-3.5 w-3.5" />
                    Reprint History Log
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {sale.reprint_history.map((rh, index) => (
                      <div
                        key={rh.id || index}
                        className="bg-white/80 border border-indigo-100 rounded p-2 text-xs text-slate-700 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-indigo-900">
                            #{index + 1} By {rh.reprinted_by_name || rh.reprinted_by_username || 'Admin'}
                          </span>
                          {rh.customer_name_used && (
                            <span className="text-slate-500 ml-2">
                              (Customer: {rh.customer_name_used})
                            </span>
                          )}
                          {rh.reason && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              "{rh.reason}"
                            </p>
                          )}
                        </div>
                        <span className="text-slate-500 text-[11px] font-mono flex-shrink-0 ml-2">
                          {new Date(rh.reprinted_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="text-slate-400 font-medium">Customer Details</span>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                <UserIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                {sale.customer_name || 'Walk-in Customer'}
              </p>
              {sale.mobile_number && (
                <p className="text-slate-500 flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                  {sale.mobile_number}
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="text-slate-400 font-medium">Original Cashier</span>
              <p className="font-semibold text-slate-900 text-sm">
                {sale.created_by_name || 'Cashier'}
              </p>
              <p className="text-slate-500 flex items-center gap-1.5">
                <StoreIcon className="h-3.5 w-3.5 text-slate-400" />
                {sale.cash_register_name || 'Register #1'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="text-slate-400 font-medium">Payment Information</span>
              <p className="font-semibold text-slate-900 text-sm">
                {sale.payment_method === 'CREDIT' ? 'Credit (Pay Later)' : sale.payment_method}
              </p>
              {sale.payment_method === 'CREDIT' ? (
                <p className="text-slate-500">
                  Paid Upfront: LKR {parseFloat(sale.amount_paid || '0').toFixed(2)} | Debt Added: <strong className="text-red-600 font-mono">LKR {(parseFloat(sale.total) - parseFloat(sale.amount_paid || '0')).toFixed(2)}</strong>
                </p>
              ) : (
                <p className="text-slate-500">
                  Paid: {parseFloat(sale.amount_paid || sale.total).toFixed(2)} | Change: {parseFloat(sale.change || '0').toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sold Items ({sale.items?.length || sale.items_count || 0})
              </h4>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {item.product_name || `Product #${item.product}`}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                        {parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800">
                        {parseFloat(item.quantity)} {item.unit_abbreviation || ''}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        {parseFloat(item.subtotal || String(parseFloat(item.quantity) * parseFloat(item.unit_price))).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                      No items data recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-1.5 text-xs text-slate-700">
              {sale.subtotal && (
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{parseFloat(sale.subtotal).toFixed(2)}</span>
                </div>
              )}
              {sale.discount && parseFloat(sale.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-{parseFloat(sale.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono">{parseFloat(sale.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              ID: {sale.id} • Register: {sale.cash_register_name || `#${sale.cash_register || 1}`}
            </span>
            <Button variant="secondary" onClick={onClose}>
              <XIcon className="h-4 w-4 mr-1.5" />
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
