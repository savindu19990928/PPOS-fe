import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  BanknoteIcon,
  CreditCardIcon,
  CheckCircleIcon,
  UserCheckIcon,
  AlertCircleIcon,
  ShieldAlertIcon,
  Loader2
} from 'lucide-react';
import { api } from '../../lib/api';
import { CustomerCreditProfile } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onProcessPayment: (
    method: string,
    amountPaid: number,
    customerName: string,
    mobile: string
  ) => Promise<void>;
}

export function PaymentModal({
  isOpen,
  onClose,
  total,
  onProcessPayment
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Credit profile check state
  const [creditProfile, setCreditProfile] = useState<CustomerCreditProfile | null>(null);
  const [isCheckingCredit, setIsCheckingCredit] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountPaid('');
      setCustomerName('');
      setMobile('');
      setPaymentMethod('CASH');
      setIsProcessing(false);
      setErrorMessage(null);
      setCreditProfile(null);
    }
  }, [isOpen]);

  // Real-time lookup of existing credit profile by mobile number
  useEffect(() => {
    if (paymentMethod !== 'CREDIT') {
      setCreditProfile(null);
      return;
    }

    const cleanMobile = mobile.trim();
    if (cleanMobile.length < 9) {
      setCreditProfile(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingCredit(true);
      try {
        const res = await api.getCreditProfiles({ mobile_number: cleanMobile });
        const list = Array.isArray(res) ? res : res.results || [];
        if (list.length > 0) {
          const profile = list[0];
          setCreditProfile(profile);
          if (!customerName && profile.customer_name) {
            setCustomerName(profile.customer_name);
          }
        } else {
          setCreditProfile(null);
        }
      } catch (err) {
        console.debug('Failed to look up credit profile:', err);
      } finally {
        setIsCheckingCredit(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [mobile, paymentMethod]);

  const isCustomerBanned = Boolean(creditProfile?.is_banned);

  // For CARD: exact total. For CASH: amount paid. For CREDIT: optional upfront amount (0 if none)
  const effectiveAmountPaid =
    paymentMethod === 'CARD'
      ? total
      : paymentMethod === 'CREDIT'
        ? parseFloat(amountPaid || '0')
        : parseFloat(amountPaid || '0');

  const cashChange = effectiveAmountPaid - total;
  const creditUpfront = parseFloat(amountPaid || '0');
  const creditDebtAdded = Math.max(0, total - creditUpfront);

  // Validity check
  let isValid = false;
  if (paymentMethod === 'CARD') {
    isValid = true;
  } else if (paymentMethod === 'CASH') {
    isValid = parseFloat(amountPaid || '0') >= total;
  } else if (paymentMethod === 'CREDIT') {
    isValid =
      customerName.trim().length > 0 &&
      mobile.trim().length >= 9 &&
      !isCustomerBanned &&
      creditUpfront >= 0 &&
      creditUpfront <= total;
  }

  // Keyboard shortcuts for payment modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PageUp') {
        e.preventDefault();
        setPaymentMethod('CASH');
        return;
      }
      if (e.key === 'PageDown') {
        e.preventDefault();
        setPaymentMethod('CARD');
        return;
      }
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'button') return;
        if (tagName !== 'input' && tagName !== 'textarea' && tagName !== 'select') {
          e.preventDefault();
          if (isValid && !isProcessing) {
            formRef.current?.requestSubmit();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isValid, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isProcessing) return;

    if (paymentMethod === 'CREDIT' && isCustomerBanned) {
      setErrorMessage(
        `Credit sale rejected: Customer is banned from credit purchases (${creditProfile?.ban_reason || 'Policy violation'}).`
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onProcessPayment(
        paymentMethod,
        effectiveAmountPaid,
        customerName.trim(),
        mobile.trim()
      );
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || 'Failed to complete sale. Please check details.');
      setIsProcessing(false);
    }
  };

  const cashDenominations = [100, 500, 1000, 5000];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="lg">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Total Amount Display */}
          <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Total Bill Amount
            </p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 mt-1 font-mono">
              LKR {total.toFixed(2)}
            </p>
          </div>

          {/* Payment Method Selector */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Cash Button */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CASH');
                  setAmountPaid('');
                  setErrorMessage(null);
                }}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}>
                <div className="flex items-center gap-1.5">
                  <BanknoteIcon className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm">Cash</span>
                </div>
                <kbd className="mt-1 px-1.5 py-0.5 bg-white/90 text-[10px] font-mono text-slate-400 rounded border border-slate-200">
                  PgUp
                </kbd>
              </button>

              {/* Card Button */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CARD');
                  setAmountPaid('');
                  setErrorMessage(null);
                }}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === 'CARD'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}>
                <div className="flex items-center gap-1.5">
                  <CreditCardIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Card</span>
                </div>
                <kbd className="mt-1 px-1.5 py-0.5 bg-white/90 text-[10px] font-mono text-slate-400 rounded border border-slate-200">
                  PgDn
                </kbd>
              </button>

              {/* Credit / Pay Later Button */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CREDIT');
                  setAmountPaid('0.00');
                  setErrorMessage(null);
                }}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === 'CREDIT'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}>
                <div className="flex items-center gap-1.5 text-center">
                  <UserCheckIcon className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm">Credit</span>
                </div>
                <span className="mt-1 text-[10px] text-indigo-600 font-medium">
                  Pay Later
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Method Content: CASH */}
          {paymentMethod === 'CASH' && (
            <>
              <div className="col-span-2">
                <Input
                  label="Amount Received (Cash)"
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-bold"
                  autoFocus
                  required
                />

                <div className="flex flex-wrap gap-2 mt-2">
                  {cashDenominations.map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => setAmountPaid(denom.toString())}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 transition-colors">
                      {denom}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountPaid(total.toFixed(2))}
                    className="px-3 py-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded-full border border-emerald-300 transition-colors">
                    Exact ({total.toFixed(2)})
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <div
                  className={`p-3.5 rounded-xl border ${cashChange >= 0
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                    }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600 uppercase">
                      Change Due to Customer:
                    </span>
                    <span
                      className={`text-xl font-bold font-mono ${cashChange >= 0 ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                      LKR {cashChange >= 0 ? cashChange.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Conditional Method Content: CARD */}
          {paymentMethod === 'CARD' && (
            <div className="col-span-2">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    POS Terminal Card Payment
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Exact amount will be charged to the customer's card: <strong>LKR {total.toFixed(2)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Method Content: CREDIT (PAY LATER) */}
          {paymentMethod === 'CREDIT' && (
            <div className="col-span-2 space-y-3">
              {/* Notice Banner */}
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-900 text-xs flex items-start gap-2.5">
                <UserCheckIcon className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-950">
                    Credit / Pay Later Sale (Customer Debt)
                  </p>
                  <p className="text-indigo-700 mt-0.5">
                    Customer is purchasing items on credit to pay later. Customer name and mobile number are mandatory and will automatically update their credit profile.
                  </p>
                </div>
              </div>

              {/* Upfront Cash Payment (Optional partial payment) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Upfront Cash Paid (Optional)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Leave 0.00 if fully on credit
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={total}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="text-base font-semibold font-mono"
                />

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Upfront Paid</span>
                    <p className="font-bold font-mono text-emerald-700 text-sm">
                      LKR {creditUpfront.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-200">
                    <span className="text-indigo-500 text-[10px] uppercase font-bold">New Debt Added</span>
                    <p className="font-bold font-mono text-indigo-700 text-sm">
                      LKR {creditDebtAdded.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Banned Alert */}
              {isCustomerBanned && (
                <div className="p-3.5 rounded-xl border border-red-300 bg-red-50 text-red-900 text-xs flex items-start gap-2.5 animate-pulse">
                  <ShieldAlertIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-950 text-sm">
                      ⛔ CREDIT REJECTED: Customer is Banned
                    </p>
                    <p className="text-red-800 mt-1">
                      Customer '{creditProfile?.customer_name}' ({creditProfile?.mobile_number}) is currently banned from credit purchases.
                    </p>
                    {creditProfile?.ban_reason && (
                      <p className="text-red-700 font-medium mt-0.5 italic">
                        Reason: "{creditProfile.ban_reason}"
                      </p>
                    )}
                    <p className="text-red-600 text-[11px] mt-1 font-semibold">
                      Please switch to Cash or Card to proceed with this sale.
                    </p>
                  </div>
                </div>
              )}

              {/* Real-time Existing Customer Credit Profile Status */}
              {!isCustomerBanned && creditProfile && (
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900">
                        {creditProfile.customer_name} (Existing Account)
                      </span>
                      <p className="text-[11px] text-emerald-700">
                        Current Outstanding Debt: <strong>LKR {parseFloat(creditProfile.current_balance).toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Projected Balance</span>
                    <p className="font-mono font-bold text-indigo-800 text-sm">
                      LKR {(parseFloat(creditProfile.current_balance) + creditDebtAdded).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* New Customer Indicator */}
              {!isCustomerBanned && !creditProfile && mobile.trim().length >= 9 && !isCheckingCredit && (
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center gap-2">
                  <UserCheckIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    New customer: A new credit profile will be automatically registered upon completion.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Customer Name */}
          <div className="col-span-1">
            <Input
              label={paymentMethod === 'CREDIT' ? 'Customer Name *' : 'Customer Name (Optional)'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Saman Kumara"
              required={paymentMethod === 'CREDIT'}
              className={paymentMethod === 'CREDIT' ? 'border-indigo-300 focus:border-indigo-500' : ''}
            />
          </div>

          {/* Mobile Number */}
          <div className="col-span-1">
            <div className="relative">
              <Input
                label={paymentMethod === 'CREDIT' ? 'Mobile Number * (07XXXXXXXX)' : 'Mobile Number (Optional)'}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 0771234567"
                required={paymentMethod === 'CREDIT'}
                className={paymentMethod === 'CREDIT' ? 'border-indigo-300 focus:border-indigo-500' : ''}
              />
              {isCheckingCredit && (
                <div className="absolute right-3 top-8">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500">
                PgUp
              </kbd>{' '}
              Cash
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500">
                PgDn
              </kbd>{' '}
              Card
            </span>
          </div>

          <div className="flex space-x-3 ml-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isProcessing || isCustomerBanned}
              isLoading={isProcessing}
              className={`w-36 font-semibold shadow-xs ${paymentMethod === 'CREDIT'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}>
              {isCustomerBanned
                ? 'Banned'
                : paymentMethod === 'CREDIT'
                  ? 'Complete Credit'
                  : 'Complete Sale'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}