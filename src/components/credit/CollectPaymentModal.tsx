import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  CustomerCreditProfile,
  CollectPaymentResponse
} from '../../types';
import { api } from '../../lib/api';
import { printReceipt } from '../../lib/printer';
import {
  BanknoteIcon,
  CreditCardIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  PrinterIcon,
  WalletIcon
} from 'lucide-react';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerCreditProfile | null;
  onPaymentSuccess?: (response: CollectPaymentResponse) => void;
}

export function CollectPaymentModal({
  isOpen,
  onClose,
  customer,
  onPaymentSuccess
}: CollectPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<CollectPaymentResponse | null>(null);

  const currentDebt = customer ? parseFloat(customer.current_balance || '0') : 0;
  const payAmount = parseFloat(amount || '0');
  const remainingBalance = Math.max(0, currentDebt - payAmount);

  useEffect(() => {
    if (isOpen && customer) {
      setAmount(currentDebt > 0 ? currentDebt.toFixed(2) : '');
      setPaymentMethod('CASH');
      setNotes('');
      setError(null);
      setSuccessResult(null);
      setIsSubmitting(false);
    }
  }, [isOpen, customer]);

  if (!customer) return null;

  const isValidAmount = payAmount > 0 && payAmount <= currentDebt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.collectCreditPayment(customer.id, {
        amount: payAmount.toFixed(2),
        payment_method: paymentMethod,
        cash_register: 1,
        notes: notes.trim()
      });

      setSuccessResult(response);
      if (onPaymentSuccess) {
        onPaymentSuccess(response);
      }
    } catch (err: any) {
      console.error('Failed to collect repayment:', err);
      setError(err?.message || 'Failed to collect payment. Please verify input.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!successResult) return;

    const p = successResult.payment;
    const dateStr = p.created_at ? new Date(p.created_at).toLocaleString() : new Date().toLocaleString();

    const receiptHtml = `
      <div class="center" style="margin-bottom: 8px;">
        <h1 style="font-size: 15px; font-weight: bold; text-transform: uppercase;">Mediflex Pharmacy</h1>
        <p style="font-size: 10px;">181 Old Kottawa Rd, Maharagama</p>
        <p style="font-size: 10px;">Tel: +94 76 909 8091</p>
      </div>

      <div class="center" style="border: 2px solid #000; padding: 4px; margin: 6px 0;">
        <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px;">DEBT REPAYMENT RECEIPT</div>
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

      <div style="font-size: 12px; line-height: 1.5;">
        <div class="row" style="font-weight: bold;">
          <span>REMAINING DEBT:</span>
          <span style="font-family: monospace;">LKR ${parseFloat(successResult.remaining_balance).toFixed(2)}</span>
        </div>
      </div>

      <div class="separator"></div>

      <div class="footer">
        <p>Thank you for settling your credit account!</p>
        <p style="margin-top: 2px;">Official Pharmacy Repayment Voucher</p>
      </div>
      <div class="paper-feed"></div>
    `;

    await printReceipt({
      html: receiptHtml,
      title: `Repayment-${p.receipt_number}`
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collect Customer Debt Repayment"
      size="md">
      {successResult ? (
        <div className="space-y-5 py-2 animate-in fade-in">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2Icon className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-lg text-emerald-950">
              Payment Collected Successfully!
            </h3>
            <p className="text-xs text-emerald-800">
              Receipt <span className="font-mono font-bold">{successResult.receipt_number}</span> recorded into active cash drawer.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-bold text-slate-900">{customer.customer_name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Collected:</span>
              <span className="font-bold font-mono text-emerald-700 text-sm">
                LKR {parseFloat(successResult.payment.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Method:</span>
              <span className="font-medium text-slate-800">{successResult.payment.payment_method}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
              <span className="text-slate-800">Remaining Balance Due:</span>
              <span className="font-mono text-indigo-700">
                LKR {parseFloat(successResult.remaining_balance).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 text-slate-700 border-slate-300"
              onClick={handlePrintReceipt}>
              <PrinterIcon className="h-4 w-4 mr-2 text-slate-600" />
              Print Receipt
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">{customer.customer_name}</p>
                <p className="text-xs text-slate-500 font-mono">{customer.mobile_number}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Debt
                </span>
                <span className="text-lg font-black font-mono text-red-600">
                  LKR {currentDebt.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-xs font-semibold cursor-pointer transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}>
                <BanknoteIcon className="h-4 w-4 text-emerald-600" />
                <span>Cash Drawer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-xs font-semibold cursor-pointer transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}>
                <CreditCardIcon className="h-4 w-4 text-blue-600" />
                <span>Card Terminal</span>
              </button>
            </div>
          </div>

          {/* Repayment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Collection Amount (LKR) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(currentDebt.toFixed(2))}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
                Full Balance ({currentDebt.toFixed(2)})
              </button>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={currentDebt}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-base font-bold font-mono"
              autoFocus
              required
            />
          </div>

          {/* Balance Preview */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Collecting Now
              </span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                LKR {payAmount.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Remaining Debt
              </span>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                LKR {remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Notes / Remarks (Optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Partial repayment paid at register"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValidAmount || isSubmitting}
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]">
              <WalletIcon className="h-4 w-4 mr-1.5" />
              Collect LKR {payAmount.toFixed(2)}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
