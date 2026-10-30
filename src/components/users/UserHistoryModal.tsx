import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { api } from '../../lib/api';
import { User, UserHistoryResponse } from '../../types';
import {
  HistoryIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  ReceiptIcon,
  BoxesIcon,
  PrinterIcon,
  ActivityIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  Loader2Icon,
  AlertCircleIcon,
  UserCheckIcon,
  ServerIcon
} from 'lucide-react';

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function UserHistoryModal({ isOpen, onClose, user }: UserHistoryModalProps) {
  const [data, setData] = useState<UserHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activities' | 'account_audit'>('activities');

  useEffect(() => {
    if (isOpen && user?.id) {
      setIsLoading(true);
      setErrorMessage(null);
      api.getUserHistory(user.id, 100)
        .then((res) => {
          setData(res);
        })
        .catch((err: any) => {
          setErrorMessage(err.message || 'Failed to load user operational history.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setData(null);
    }
  }, [isOpen, user?.id]);

  if (!user) return null;

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoStr;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('create') || act.includes('add')) return 'success';
    if (act.includes('delete') || act.includes('cancel') || act.includes('block')) return 'error';
    if (act.includes('update') || act.includes('change')) return 'warning';
    return 'default';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Operational History: ${user.username}`}
      size="4xl">
      <div className="space-y-5">
        {/* User Profile Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 text-white rounded-xl gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base shadow-inner ${
                user.role === 'ADMIN'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    user.role === 'ADMIN'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                  {user.role}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    user.is_active !== false
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                  {user.is_active !== false ? 'Active' : 'Blocked'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">@{user.username} {user.email ? `• ${user.email}` : ''}</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-0.5 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <div>
              <span className="text-slate-500">Joined:</span> {formatDate(user.date_joined)}
            </div>
            <div>
              <span className="text-slate-500">Last Login:</span> {formatDate(user.last_login)}
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500">
            <Loader2Icon className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm">Fetching user metrics & operational audit logs...</p>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Operational Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Sales Count</span>
                  <ShoppingCartIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  {data.summary?.total_sales_count || 0}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Total Sales</span>
                  <DollarSignIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono truncate" title={data.summary?.total_sales_amount}>
                  Rs. {parseFloat(data.summary?.total_sales_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Cash Drawer</span>
                  <ActivityIcon className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  {data.summary?.total_cash_transactions_count || 0}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Stock Moves</span>
                  <BoxesIcon className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  {data.summary?.total_stock_movements_count || 0}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Credit Collected</span>
                  <ReceiptIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  {data.summary?.total_credit_payments_collected || 0}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Bill Reprints</span>
                  <PrinterIcon className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  {data.summary?.reprints_count || 0}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'activities'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                <ActivityIcon className="h-4 w-4" />
                Recent User Actions ({data.recent_activities?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('account_audit')}
                className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'account_audit'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                <ShieldCheckIcon className="h-4 w-4" />
                Account Modifications Audit ({data.account_audit_trail?.length || 0})
              </button>
            </div>

            {/* Tab 1: Operational Activities */}
            {activeTab === 'activities' && (
              <div className="space-y-2">
                {(!data.recent_activities || data.recent_activities.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <HistoryIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No recorded operational actions yet.</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {data.recent_activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 text-xs hover:border-slate-300 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionBadgeVariant(act.action)}>
                              {act.action}
                            </Badge>
                            <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                              {act.model}
                            </span>
                            <span className="font-mono text-slate-500">#{act.object_id}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                            {act.remote_addr && (
                              <span className="flex items-center gap-1">
                                <ServerIcon className="h-3 w-3" />
                                {act.remote_addr}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {formatDate(act.timestamp)}
                            </span>
                          </div>
                        </div>

                        <p className="font-medium text-slate-900">{act.object_repr}</p>

                        {act.changes && act.changes !== '{}' && (
                          <div className="mt-1.5 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600 break-all overflow-x-auto">
                            {act.changes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Account Audit Trail */}
            {activeTab === 'account_audit' && (
              <div className="space-y-2">
                {(!data.account_audit_trail || data.account_audit_trail.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <ShieldCheckIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No account modifications logged for this employee.</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {data.account_audit_trail.map((audit) => (
                      <div
                        key={audit.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionBadgeVariant(audit.action)}>
                              {audit.action}
                            </Badge>
                            <span className="text-slate-600">
                              By Admin: <strong className="text-slate-900 font-mono">{audit.actor}</strong>
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {formatDate(audit.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-700">{audit.object_repr}</p>
                        {audit.changes && audit.changes !== '{}' && (
                          <div className="mt-1.5 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600 break-all">
                            {audit.changes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
