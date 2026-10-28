import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { NotificationsResponse, SupplierNotification } from '../../types';
import { api } from '../../lib/api';
import {
  BellIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  CreditCardIcon,
  RotateCcwIcon,
  TruckIcon,
  PackageIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  CalendarIcon,
  ExternalLinkIcon
} from 'lucide-react';

interface SupplierAlertsTabProps {
  onPaySupplier?: (supplierId: number, supplierName: string, amount?: string) => void;
  onReceiveRefund?: (supplierId: number, supplierName: string, amount?: string) => void;
  onScheduleDelivery?: (supplierId: number, supplierName: string) => void;
}

export function SupplierAlertsTab({
  onPaySupplier,
  onReceiveRefund,
  onScheduleDelivery
}: SupplierAlertsTabProps) {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await api.getNotifications();
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch supplier alerts.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const notifications = data?.notifications || [];
  const summary = data?.summary || {
    total_notifications: 0,
    critical_count: 0,
    warning_count: 0,
    info_count: 0,
    supplier_payables_alert_count: 0,
    supplier_refunds_alert_count: 0,
    upcoming_supplies_alert_count: 0,
    low_stock_alert_count: 0
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (selectedSeverity !== 'ALL' && notif.severity !== selectedSeverity) {
      return false;
    }
    if (selectedCategory !== 'ALL' && notif.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SUPPLIER_PAYMENT_DUE':
        return <CreditCardIcon className="h-4 w-4 text-red-600" />;
      case 'SUPPLIER_REFUND_DUE':
        return <RotateCcwIcon className="h-4 w-4 text-emerald-600" />;
      case 'UPCOMING_SUPPLY':
        return <TruckIcon className="h-4 w-4 text-sky-600" />;
      case 'LOW_STOCK':
        return <PackageIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <BellIcon className="h-4 w-4 text-slate-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="error">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="warning">WARNING</Badge>;
      case 'INFO':
        return <Badge variant="info">INFO</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Alerts</span>
            <BellIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {summary.total_notifications}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active automated signals</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-red-50/60 border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800">Critical Alerts</span>
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">
            {summary.critical_count}
          </div>
          <p className="text-[11px] text-red-600/80 mt-0.5">Overdue debts & zero stock</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-amber-50/60 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Warnings</span>
            <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {summary.warning_count}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Due today / low stock</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-sky-50/60 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">Informational</span>
            <InfoIcon className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700 mt-2">
            {summary.info_count}
          </div>
          <p className="text-[11px] text-sky-600/80 mt-0.5">Upcoming within 7 days</p>
        </Card>
      </div>

      {/* Filter Chips Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Filters */}
            <span className="text-xs font-semibold text-slate-500 mr-1">Severity:</span>
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                type="button"
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setSelectedSeverity(sev)}>
                {sev}
              </button>
            ))}

            <span className="text-xs font-semibold text-slate-500 ml-3 mr-1">Category:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'SUPPLIER_PAYMENT_DUE', label: `Payables (${summary.supplier_payables_alert_count})` },
              { id: 'SUPPLIER_REFUND_DUE', label: `Refunds (${summary.supplier_refunds_alert_count})` },
              { id: 'UPCOMING_SUPPLY', label: `Supply (${summary.upcoming_supplies_alert_count})` },
              { id: 'LOW_STOCK', label: `Low Stock (${summary.low_stock_alert_count})` }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setSelectedCategory(cat.id)}>
                {cat.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchNotifications(true)}
            isLoading={isRefreshing}>
            <RefreshCwIcon className="h-4 w-4 mr-1.5" />
            Refresh Feed
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500">Scanning real-time notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center border-slate-200">
          <CheckCircle2Icon className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">All clear! No alerts found</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are currently no overdue payments, urgent refunds, delivery shortfalls, or critical stock shortages.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isCritical = notif.severity === 'CRITICAL';
            const isWarning = notif.severity === 'WARNING';

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical
                    ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                    : isWarning
                    ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                } shadow-sm`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCritical
                          ? 'bg-red-100 text-red-600'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}>
                      {getCategoryIcon(notif.category)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{notif.title}</span>
                        {getSeverityBadge(notif.severity)}
                        {notif.category && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {notif.category.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 mt-1">{notif.message}</p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                        {notif.due_date && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Date: {notif.due_date}
                          </span>
                        )}
                        {notif.days_remaining !== undefined && notif.days_remaining !== null && (
                          <span
                            className={`font-semibold ${
                              notif.days_remaining < 0
                                ? 'text-red-600'
                                : notif.days_remaining === 0
                                ? 'text-amber-600'
                                : 'text-slate-600'
                            }`}>
                            {notif.days_remaining < 0
                              ? `${Math.abs(notif.days_remaining)} days overdue`
                              : notif.days_remaining === 0
                              ? 'Due today'
                              : `${notif.days_remaining} days remaining`}
                          </span>
                        )}
                        {notif.amount && (
                          <span className="font-bold text-slate-800">
                            Amount: Rs. {parseFloat(notif.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contextual Action Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {notif.category === 'SUPPLIER_PAYMENT_DUE' && notif.supplier_id && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-red-600 hover:bg-red-700 text-xs whitespace-nowrap"
                        onClick={() =>
                          onPaySupplier?.(
                            notif.supplier_id!,
                            notif.supplier_name || 'Supplier',
                            notif.amount
                          )
                        }>
                        <CreditCardIcon className="h-3.5 w-3.5 mr-1" />
                        Pay Supplier
                      </Button>
                    )}

                    {notif.category === 'SUPPLIER_REFUND_DUE' && notif.supplier_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs whitespace-nowrap"
                        onClick={() =>
                          onReceiveRefund?.(
                            notif.supplier_id!,
                            notif.supplier_name || 'Supplier',
                            notif.amount
                          )
                        }>
                        <RotateCcwIcon className="h-3.5 w-3.5 mr-1" />
                        Receive Refund
                      </Button>
                    )}

                    {notif.category === 'UPCOMING_SUPPLY' && notif.supplier_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sky-700 border-sky-300 hover:bg-sky-50 text-xs whitespace-nowrap"
                        onClick={() =>
                          onScheduleDelivery?.(
                            notif.supplier_id!,
                            notif.supplier_name || 'Supplier'
                          )
                        }>
                        <TruckIcon className="h-3.5 w-3.5 mr-1" />
                        Update Schedule
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
