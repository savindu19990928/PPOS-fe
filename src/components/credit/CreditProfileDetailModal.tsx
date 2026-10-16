import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CustomerCreditProfile,
  CustomerCreditPayment
} from '../../types';
import { api } from '../../lib/api';
import { printReceipt } from '../../lib/printer';
import {
  UserIcon,
  PhoneIcon,
  WalletIcon,
  PrinterIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  EditIcon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react';

interface CreditProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
  isAdmin: boolean;
  onCollectPaymentRequested: (customer: CustomerCreditProfile) => void;
  onBanRequested?: (customer: CustomerCreditProfile) => void;
  onUnbanRequested?: (customer: CustomerCreditProfile) => void;
  onEditRequested?: (customer: CustomerCreditProfile) => void;
  onProfileUpdated?: () => void;
}

export function CreditProfileDetailModal({
  isOpen,
  onClose,
  customerId,
  isAdmin,
  onCollectPaymentRequested,
  onBanRequested,
  onUnbanRequested,
  onEditRequested,
  onProfileUpdated
}: CreditProfileDetailModalProps) {
  const [customer, setCustomer] = useState<CustomerCreditProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'payments'>('sales');

  const fetchProfile = async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCreditProfileDetails(customerId);
      setCustomer(data);
    } catch (err: any) {
      console.error('Failed to load credit profile details:', err);
      setError(err?.message || 'Failed to load customer credit details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      fetchProfile();
      setActiveTab('sales');
    } else {
      setCustomer(null);
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handlePrintPastReceipt = async (p: CustomerCreditPayment) => {
    if (!customer) return;
    const dateStr = p.created_at ? new Date(p.created_at).toLocaleString() : new Date().toLocaleString();

    const receiptHtml = `
      <div class="center" style="margin-bottom: 8px;">
        <h1 style="font-size: 15px; font-weight: bold; text-transform: uppercase;">Mediflex Pharmacy</h1>
        <p style="font-size: 10px;">181 Old Kottawa Rd, Maharagama</p>
        <p style="font-size: 10px;">Tel: +94 76 909 8091</p>
      </div>

      <div class="center" style="border: 2px solid #000; padding: 4px; margin: 6px 0;">
        <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px;">DEBT REPAYMENT RECEIPT (DUPLICATE)</div>
        <div style="font-size: 13px; font-weight: 900; font-family: monospace; margin: 2px 0;">${p.receipt_number}</div>
      </div>

      <div class="separator"></div>

      <div style="font-size: 11px; line-height: 1.5;">
        <div class="row">
          <span>Date & Time:</span>
          <strong>${dateStr}</strong>
        </div>
        <div class="row">
          <span>Collected By:</span>
          <span>${p.collected_by_name || 'Cashier'}</span>
        </div>
        <div class="row">
          <span>Register:</span>
          <span>${p.cash_register_name || 'Main Register'}</span>
        </div>
        <div class="row" style="margin-top: 4px;">
          <span>Customer:</span>
          <strong>${customer.customer_name}</strong>
        </div>
        <div class="row">
          <span>Mobile:</span>
          <span>${customer.mobile_number}</span>
        </div>
      </div>

      <div class="separator"></div>

      <div style="font-size: 11px; line-height: 1.6;">
        <div class="row" style="font-size: 13px; font-weight: bold;">
          <span>AMOUNT REPAID:</span>
          <span>LKR ${parseFloat(p.amount).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Payment Method:</span>
          <span>${p.payment_method}</span>
        </div>
        ${p.notes ? `<div style="font-size: 10px; font-style: italic; margin-top: 2px;">Note: "${p.notes}"</div>` : ''}
      </div>

      <div class="separator"></div>

      <div class="footer">
        <p>Thank you for settling your credit account!</p>
        <p style="margin-top: 2px;">Official Pharmacy Repayment Record</p>
      </div>
      <div class="paper-feed"></div>
    `;

    await printReceipt({
      html: receiptHtml,
      title: `Repayment-${p.receipt_number}`
    });
  };

  const handleUnban = async () => {
    if (!customer) return;
    if (!confirm(`Are you sure you want to unban ${customer.customer_name} to allow credit purchases again?`)) {
      return;
    }
    try {
      await api.unbanCreditCustomer(customer.id);
      await fetchProfile();
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      alert(err?.message || 'Failed to unban customer.');
    }
  };

  const currentDebt = customer ? parseFloat(customer.current_balance || '0') : 0;
  const totalCredit = customer ? parseFloat(customer.total_credit || '0') : 0;
  const totalPaid = customer ? parseFloat(customer.total_paid || '0') : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Credit Profile & Debt History"
      size="xl">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCwIcon className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs">Loading customer profile details...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
          <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : customer ? (
        <div className="space-y-5">
          {/* Top Banner / Customer Info Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {customer.customer_name}
                    </h3>
                    {customer.is_banned ? (
                      <Badge variant="error">Banned from Credit</Badge>
                    ) : (
                      <Badge variant="success">Active Credit</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                    <PhoneIcon className="h-3 w-3 text-slate-400" />
                    {customer.mobile_number}
                    <span className="text-slate-300">•</span>
                    <span>Created: {new Date(customer.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={currentDebt <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                onClick={() => onCollectPaymentRequested(customer)}>
                <WalletIcon className="h-3.5 w-3.5 mr-1.5" />
                Collect Payment
              </Button>

              {isAdmin && (
                <>
                  {customer.is_banned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => (onUnbanRequested ? onUnbanRequested(customer) : handleUnban())}>
                      <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onBanRequested && onBanRequested(customer)}>
                      <ShieldAlertIcon className="h-3.5 w-3.5 mr-1" />
                      Ban
                    </Button>
                  )}

                  {onEditRequested && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-600 border-slate-200 hover:bg-slate-50"
                      onClick={() => onEditRequested(customer)}>
                      <EditIcon className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Banned Alert Banner if Banned */}
          {customer.is_banned && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
              <ShieldAlertIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-950">
                  Customer is Banned from Credit Purchases
                </p>
                {customer.ban_reason && (
                  <p className="text-red-800 mt-0.5 italic">
                    Reason: "{customer.ban_reason}"
                  </p>
                )}
                <p className="text-red-700 text-[11px] mt-1">
                  Cashiers and Admins cannot create new credit sales for this customer until unbanned.
                </p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-red-50/60 border border-red-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
                Current Debt Due
              </span>
              <p className="text-lg sm:text-xl font-black font-mono text-red-700 mt-0.5">
                LKR {currentDebt.toFixed(2)}
              </p>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                Total Credit
              </span>
              <p className="text-lg sm:text-xl font-black font-mono text-indigo-700 mt-0.5">
                LKR {totalCredit.toFixed(2)}
              </p>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Repaid
              </span>
              <p className="text-lg sm:text-xl font-black font-mono text-emerald-700 mt-0.5">
                LKR {totalPaid.toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Credit Limit
              </span>
              <p className="text-lg sm:text-xl font-black font-mono text-slate-800 mt-0.5">
                {customer.credit_limit
                  ? `LKR ${parseFloat(customer.credit_limit).toFixed(2)}`
                  : 'No Limit'}
              </p>
            </div>
          </div>

          {/* Customer Notes if any */}
          {customer.notes && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900">
              <span className="font-semibold">Notes:</span> {customer.notes}
            </div>
          )}

          {/* Tabs for Sales vs Repayments */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-6 text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`pb-3 px-1 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'sales'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                <ShoppingBagIcon className="h-4 w-4" />
                Credit Purchase Bills ({customer.sales?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`pb-3 px-1 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'payments'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                <ReceiptIcon className="h-4 w-4" />
                Debt Repayment History ({customer.payments?.length || 0})
              </button>
            </nav>
          </div>

          {/* Tab 1: Credit Sales */}
          {activeTab === 'sales' && (
            <div className="space-y-2">
              {!customer.sales || customer.sales.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No credit sales recorded yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Bill #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Bill Total</th>
                        <th className="py-2.5 px-3 text-right">Paid Upfront</th>
                        <th className="py-2.5 px-3 text-right">Debt Added</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.sales.map((sale) => {
                        const billTotal = parseFloat(sale.total);
                        const paidUpfront = parseFloat(sale.amount_paid || '0');
                        const debtAdded = Math.max(0, billTotal - paidUpfront);
                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                              {sale.sale_number}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {billTotal.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                              {paidUpfront.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                              {debtAdded.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Badge
                                variant={
                                  sale.status === 'CANCELLED'
                                    ? 'error'
                                    : sale.status === 'REPRINTED'
                                    ? 'info'
                                    : 'success'
                                }>
                                {sale.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Repayments */}
          {activeTab === 'payments' && (
            <div className="space-y-2">
              {!customer.payments || customer.payments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No debt repayments recorded yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Receipt #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Cashier</th>
                        <th className="py-2.5 px-3 text-right">Repaid (LKR)</th>
                        <th className="py-2.5 px-3 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                            {payment.receipt_number}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-700">
                              {payment.payment_method}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {payment.collected_by_name || 'Cashier'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {parseFloat(payment.amount).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => handlePrintPastReceipt(payment)}>
                              <PrinterIcon className="h-3 w-3 mr-1" />
                              Print
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Customer ID #{customer.id}
            </span>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
