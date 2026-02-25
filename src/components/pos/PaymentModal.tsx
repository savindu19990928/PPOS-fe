import React, { useEffect, useState } from 'react';
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
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
      <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>

                <BanknoteIcon className="h-6 w-6 mr-2" />
                <span className="font-semibold">Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === 'CARD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>

                <CreditCardIcon className="h-6 w-6 mr-2" />
                <span className="font-semibold">Card</span>
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

                <div className="flex gap-2 mt-2">
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

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
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
      </form>
    </Modal>);

}