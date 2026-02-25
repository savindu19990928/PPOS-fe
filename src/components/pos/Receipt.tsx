import React, { forwardRef } from 'react';
import { Sale, SaleItem } from '../../types';
interface ReceiptProps {
  sale: Sale;
  items: SaleItem[];
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
}
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  (
  {
    sale,
    items,
    pharmacyName = 'Mediflex Pharmacy',
    pharmacyAddress = '181 Old Kottawa Rd, Maharagama',
    pharmacyPhone = '+94 76 909 8091'
  },
  ref) =>
  {
    return (
      <div
        ref={ref}
        className="hidden print:block print:w-[80mm] print:p-2 font-mono text-xs text-black bg-white">

        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase">{pharmacyName}</h1>
          <p>{pharmacyAddress}</p>
          <p>Tel: {pharmacyPhone}</p>
        </div>

        <div className="mb-2 border-b border-black border-dashed pb-2">
          <div className="flex justify-between">
            <span>Date: {new Date(sale.created_at).toLocaleDateString()}</span>
            <span>Time: {new Date(sale.created_at).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Sale #: {sale.sale_number}</span>
            <span>Cashier: {sale.created_by_name}</span>
          </div>
          {sale.customer_name &&
          <div className="mt-1">Customer: {sale.customer_name}</div>
          }
        </div>

        <table className="w-full mb-2">
          <thead>
            <tr className="border-b border-black border-dashed">
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) =>
            <tr key={idx}>
                <td className="py-1 pr-1 truncate max-w-[30mm]">
                  {item.product_name}
                </td>
                <td className="py-1 text-right">{parseFloat(item.quantity)}</td>
                <td className="py-1 text-right">
                  {parseFloat(item.unit_price).toFixed(2)}
                </td>
                <td className="py-1 text-right">
                  {(
                parseFloat(item.quantity) * parseFloat(item.unit_price)).
                toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="border-t border-black border-dashed pt-2 mb-4">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{parseFloat(sale.total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Payment ({sale.payment_method})</span>
            <span>{parseFloat(sale.total).toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center text-[10px]">
          <p>Thank you and we wish you good health!</p>
          <p>Please retain this receipt for any returns.</p>
        </div>
      </div>);

  }
);
Receipt.displayName = 'Receipt';