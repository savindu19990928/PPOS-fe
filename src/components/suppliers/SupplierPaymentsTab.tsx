import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import {
  SupplierPaymentsSummaryResponse,
  SupplierPayableItem,
  SupplierRefundItem,
  Supplier
} from '../../types';
import { api } from '../../lib/api';
import {
  DollarSignIcon,
  AlertTriangleIcon,
  CalendarIcon,
  RefreshCwIcon,
  CreditCardIcon,
  RotateCcwIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon
} from 'lucide-react';

interface SupplierPaymentsTabProps {
  onRecordPayment: (supplierId: number, name: string, amount: string, dueDate?: string) => void;
  onRecordRefund: (supplierId: number, name: string, amount: string, dueDate?: string) => void;
}

export function SupplierPaymentsTab({
  onRecordPayment,
  onRecordRefund
}: SupplierPaymentsTabProps) {
  const [data, setData] = useState<SupplierPaymentsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'payables' | 'refunds'>('all');
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);
  const [dueWithin7Days, setDueWithin7Days] = useState(false);

  const fetchPayments = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await api.getSupplierPayments({
          type: filterType,
          is_overdue: isOverdueOnly ? true : undefined,
          due_within_days: dueWithin7Days ? 7 : undefined
        });
        setData(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch supplier payments.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filterType, isOverdueOnly, dueWithin7Days]
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const summary = data?.summary || {
    total_amount_we_owe: '0.00',
    total_refunds_owed_to_us: '0.00',
    net_balance: '0.00',
    overdue_payables_count: 0,
    upcoming_payables_count: 0,
    overdue_refunds_count: 0,
    upcoming_refunds_count: 0
  };

  const payments = data?.payments_to_pay || [];
  const refunds = data?.refunds_to_receive || [];

  const totalOwedNum = parseFloat(summary.total_amount_we_owe || '0');
  const totalRefundNum = parseFloat(summary.total_refunds_owed_to_us || '0');
  const netBalanceNum = parseFloat(summary.net_balance || '0');

  return (
    <div className="space-y-6">
      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Amount We Owe */}
        <Card className="p-5 bg-gradient-to-br from-red-50 to-white border-red-200">
          <div className="flex items-center justify-between text-xs font-semibold text-red-800">
            <span className="flex items-center gap-1.5">
              <ArrowUpRightIcon className="h-4 w-4 text-red-600" />
              Total Payables (We Owe)
            </span>
            {summary.overdue_payables_count > 0 && (
              <Badge variant="error" className="text-[10px]">
                {summary.overdue_payables_count} Overdue
              </Badge>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-3">
            Rs. {totalOwedNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-red-100">
            <span>Upcoming: {summary.upcoming_payables_count}</span>
            <span>Overdue: {summary.overdue_payables_count}</span>
          </div>
        </Card>

        {/* Total Refunds Owed To Us */}
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeftIcon className="h-4 w-4 text-emerald-600" />
              Total Refunds (Owed to Us)
            </span>
            {summary.overdue_refunds_count > 0 && (
              <Badge variant="error" className="text-[10px]">
                {summary.overdue_refunds_count} Overdue
              </Badge>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-3">
            Rs. {totalRefundNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-emerald-100">
            <span>Upcoming: {summary.upcoming_refunds_count}</span>
            <span>Overdue: {summary.overdue_refunds_count}</span>
          </div>
        </Card>

        {/* Net Balance */}
        <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <DollarSignIcon className="h-4 w-4 text-slate-600" />
              Net Settlement Position
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Summary
            </Badge>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold mt-3 ${
              netBalanceNum > 0
                ? 'text-red-700'
                : netBalanceNum < 0
                ? 'text-emerald-700'
                : 'text-slate-800'
            }`}>
            Rs. {Math.abs(netBalanceNum).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            {netBalanceNum > 0
              ? 'Net Payables: We owe suppliers more than refunds owed to us.'
              : netBalanceNum < 0
              ? 'Net Receivables: Suppliers owe us more refunds than payables.'
              : 'All payables and refunds are completely balanced.'}
          </p>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setFilterType('all')}>
                All Balances
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'payables'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setFilterType('payables')}>
                Payables Only
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'refunds'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setFilterType('refunds')}>
                Refunds Only
              </button>
            </div>

            {/* Overdue Only Filter */}
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                isOverdueOnly
                  ? 'bg-red-600 text-white border-red-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => setIsOverdueOnly(!isOverdueOnly)}>
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              Overdue Only
            </button>

            {/* Due Within 7 Days */}
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                dueWithin7Days
                  ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => setDueWithin7Days(!dueWithin7Days)}>
              <ClockIcon className="h-3.5 w-3.5" />
              Due within 7 Days
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPayments(true)}
            isLoading={isRefreshing}>
            <RefreshCwIcon className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payments to Pay Table */}
      {(filterType === 'all' || filterType === 'payables') && (
        <Card className="overflow-hidden border-slate-200">
          <div className="p-4 bg-red-50/40 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Payables to Settle (We Owe Suppliers) — {payments.length} items
              </h3>
            </div>
            <span className="text-xs font-semibold text-red-700">
              Total: Rs. {totalOwedNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading payables...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <CheckCircle2Icon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              No pending payables matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Amount Owed</th>
                    <th className="py-3 px-4">Payment Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payments.map((p) => (
                    <tr key={p.supplier_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.supplier_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {p.contact_person && <span>{p.contact_person}</span>}
                          {p.phone && (
                            <a href={`tel:${p.phone}`} className="text-emerald-600 hover:underline">
                              {p.phone}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-red-600">
                        Rs. {parseFloat(p.amount_owed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{p.payment_due_date}</div>
                        <div className="text-xs mt-0.5">
                          {p.days_until_due === 0 ? (
                            <span className="text-amber-600 font-semibold">Due Today</span>
                          ) : p.days_until_due < 0 ? (
                            <span className="text-red-600 font-semibold">
                              {Math.abs(p.days_until_due)} days overdue
                            </span>
                          ) : (
                            <span className="text-slate-500">In {p.days_until_due} days</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={p.is_overdue ? 'error' : 'info'}>
                          {p.status || (p.is_overdue ? 'OVERDUE' : 'UPCOMING')}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 max-w-xs text-xs text-slate-600 truncate">
                        {p.notes || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-red-600 hover:bg-red-700 text-xs"
                          onClick={() =>
                            onRecordPayment(p.supplier_id, p.supplier_name, p.amount_owed, p.payment_due_date)
                          }>
                          <CreditCardIcon className="h-3.5 w-3.5 mr-1" />
                          Pay
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Refunds to Receive Table */}
      {(filterType === 'all' || filterType === 'refunds') && (
        <Card className="overflow-hidden border-slate-200">
          <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcwIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Refunds to Collect (Suppliers Owe Us) — {refunds.length} items
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              Total: Rs. {totalRefundNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading refunds...
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <CheckCircle2Icon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              No pending refunds matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Refund Owed</th>
                    <th className="py-3 px-4">Refund Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {refunds.map((r) => (
                    <tr key={r.supplier_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{r.supplier_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {r.contact_person && <span>{r.contact_person}</span>}
                          {r.phone && (
                            <a href={`tel:${r.phone}`} className="text-emerald-600 hover:underline">
                              {r.phone}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-600">
                        Rs. {parseFloat(r.refund_owed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{r.refund_due_date}</div>
                        <div className="text-xs mt-0.5">
                          {r.days_until_due === 0 ? (
                            <span className="text-amber-600 font-semibold">Due Today</span>
                          ) : r.days_until_due < 0 ? (
                            <span className="text-red-600 font-semibold">
                              {Math.abs(r.days_until_due)} days overdue
                            </span>
                          ) : (
                            <span className="text-slate-500">In {r.days_until_due} days</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={r.is_overdue ? 'error' : 'info'}>
                          {r.status || (r.is_overdue ? 'OVERDUE' : 'UPCOMING')}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 max-w-xs text-xs text-slate-600 truncate">
                        {r.notes || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs"
                          onClick={() =>
                            onRecordRefund(r.supplier_id, r.supplier_name, r.refund_owed, r.refund_due_date)
                          }>
                          <RotateCcwIcon className="h-3.5 w-3.5 mr-1" />
                          Receive
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
