import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BanknoteIcon, CreditCardIcon, CheckCircleIcon } from 'lucide-react';
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onProcessPayment: (
  method: string,
  amountPaid: number,
  customerName: string,
  mobile: string)
  => Promise<void>;
}
export function PaymentModal({
  isOpen,
  onClose,
  total,
  onProcessPayment
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (isOpen) {
      setAmountPaid('');
      setCustomerName('');
      setMobile('');
      setPaymentMethod('CASH');
      setIsProcessing(false);
    }
  }, [isOpen]);
  // For CARD: always use exact total. For CASH: user enters amount.
  const effectiveAmountPaid =
  paymentMethod === 'CARD' ? total : parseFloat(amountPaid || '0');
  const change = effectiveAmountPaid - total;
  const isValid =
  paymentMethod === 'CARD' ? true : parseFloat(amountPaid || '0') >= total;
  // Keyboard shortcuts for payment modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // PageUp → Cash
      if (e.key === 'PageUp') {
        e.preventDefault();
        setPaymentMethod('CASH');
        return;
      }
      // PageDown → Card
      if (e.key === 'PageDown') {
        e.preventDefault();
        setPaymentMethod('CARD');
        return;
      }
      // Enter → Complete sale (when not in a text input that needs Enter for other purposes)
      // We let the form's native submit handle Enter in input fields,
      // but also handle it globally for when focus is elsewhere
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        // If focus is on a button (like denomination buttons), don't double-fire
        if (tagName === 'button') return;
        // For inputs, the form onSubmit will handle it naturally
        // But if focus is on the modal backdrop or other non-form elements, trigger submit
        if (
        tagName !== 'input' &&
        tagName !== 'textarea' &&
        tagName !== 'select')
        {
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
    setIsProcessing(true);
    try {
      await onProcessPayment(
        paymentMethod,
        effectiveAmountPaid,
        customerName,
        mobile
      );
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };
  const denominations = [100, 500, 1000, 5000];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="lg">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
            <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">
              Total Amount
            </p>
            <p className="text-4xl font-bold text-emerald-600 mt-1">
              {total.toFixed(2)}
            </p>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>

                <div className="flex items-center">
                  <BanknoteIcon className="h-6 w-6 mr-2" />
                  <span className="font-semibold">Cash</span>
                </div>
                <kbd className="mt-1.5 px-1.5 py-0.5 bg-white/80 text-[10px] font-mono text-slate-400 rounded border border-slate-200">
                  PgUp
                </kbd>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === 'CARD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>

                <div className="flex items-center">
                  <CreditCardIcon className="h-6 w-6 mr-2" />
                  <span className="font-semibold">Card</span>
                </div>
                <kbd className="mt-1.5 px-1.5 py-0.5 bg-white/80 text-[10px] font-mono text-slate-400 rounded border border-slate-200">
                  PgDn
                </kbd>
              </button>
            </div>
          </div>

          {paymentMethod === 'CASH' ?
          <>
              <div className="col-span-2">
                <Input
                label="Amount Paid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className="text-lg font-bold"
                autoFocus
                required />

                <div className="flex flex-wrap gap-2 mt-2">
                  {denominations.map((denom) =>
                <button
                  key={denom}
                  type="button"
                  onClick={() => setAmountPaid(denom.toString())}
                  className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 transition-colors">

                      {denom}
                    </button>
                )}
                  <button
                  type="button"
                  onClick={() => setAmountPaid(total.toString())}
                  className="px-3 py-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full border border-emerald-200 transition-colors">

                    Exact
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <div
                className={`p-4 rounded-lg border ${change >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">
                      Change Due:
                    </span>
                    <span
                    className={`text-2xl font-bold ${change >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>

                      {change >= 0 ? change.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </> :

          <div className="col-span-2">
              <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50 flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Card payment — exact amount will be charged
                  </p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">
                    {total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          }

          <div className="col-span-1">
            <Input
              label="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe" />

          </div>
          <div className="col-span-1">
            <Input
              label="Mobile Number (Optional)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="077..." />

          </div>
        </div>

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
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500">
                Enter
              </kbd>{' '}
              Complete
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
              disabled={!isValid || isProcessing}
              isLoading={isProcessing}
              className="w-32">

              Complete
            </Button>
          </div>
        </div>
      </form>
    </Modal>);

}