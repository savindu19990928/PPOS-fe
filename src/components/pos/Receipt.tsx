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
    ref
  ) => {
    const isReprint =
      sale.status === 'REPRINTED' ||
      (sale.reprint_count != null && sale.reprint_count > 0) ||
      Boolean(sale.reprinted_at);

    const isCancelled = sale.status === 'CANCELLED';

    return (
      <div
        ref={ref}
        className="hidden print:block print:w-[80mm] print:p-2 font-mono text-xs text-black bg-white">
        <div className="text-center mb-3">
          <h1 className="text-lg font-bold uppercase">{pharmacyName}</h1>
          <p>{pharmacyAddress}</p>
          <p>Tel: {pharmacyPhone}</p>
        </div>

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="border border-dashed border-black p-1 text-center font-bold text-sm my-1">
            *** CANCELLED BILL ***
          </div>
        )}

        {/* OFFICIAL REPRINTED SEAL */}
        {isReprint && !isCancelled && (
          <div className="border-2 border-black p-1 my-2 text-center bg-white">
            <div className="border border-dashed border-black p-1.5">
              <div className="text-[10px] font-bold tracking-widest uppercase">
                ★ ★ ★ OFFICIAL SEAL ★ ★ ★
              </div>
              <div className="text-base font-black tracking-widest uppercase my-1 border-y-2 border-black py-0.5">
                REPRINTED
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider">
                DUPLICATE BILL COPY
              </div>
              <div className="text-[9px] text-left mt-1 border-t border-dotted border-black pt-1 leading-tight">
                <div>• REPRINTED BY: <strong>{sale.reprinted_by_name || 'Admin'}</strong></div>
                <div>• REPRINT TIME: <strong>{sale.reprinted_at ? new Date(sale.reprinted_at).toLocaleString() : 'N/A'}</strong></div>
                <div>• REPRINT COUNT: <strong>#{sale.reprint_count || 1}</strong></div>
                <div>• ORIG CASHIER: <strong>{sale.created_by_name || 'Cashier'}</strong></div>
                <div>• ORIG PRINTED: <strong>{new Date(sale.created_at).toLocaleString()}</strong></div>
              </div>
              <div className="text-[8px] font-bold mt-1 tracking-wider">
                ★ MEDIFLEX PHARMACY AUDIT VERIFIED ★
              </div>
            </div>
          </div>
        )}

        <div className="mb-2 border-b border-black border-dashed pb-2">
          <div className="flex justify-between">
            <span>Date: {new Date(sale.created_at).toLocaleDateString()}</span>
            <span>Time: {new Date(sale.created_at).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Sale #: {sale.sale_number}</span>
            <span>Cashier: {sale.created_by_name}</span>
          </div>
          {sale.customer_name && (
            <div className="mt-1">Customer: {sale.customer_name}</div>
          )}
          {sale.mobile_number && (
            <div>Mobile: {sale.mobile_number}</div>
          )}
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
            {items.map((item, idx) => (
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
                    parseFloat(item.quantity) * parseFloat(item.unit_price)
                  ).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black border-dashed pt-2 mb-2">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{parseFloat(sale.total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Payment ({sale.payment_method === 'CREDIT' ? 'CREDIT / PAY LATER' : sale.payment_method})</span>
            <span>{parseFloat(sale.amount_paid || '0').toFixed(2)}</span>
          </div>
          {sale.payment_method === 'CREDIT' && (
            <div className="flex justify-between text-xs font-bold">
              <span>BALANCE DUE (CREDIT)</span>
              <span>{(parseFloat(sale.total) - parseFloat(sale.amount_paid || '0')).toFixed(2)}</span>
            </div>
          )}
          {parseFloat(sale.change || '0') > 0 && (
            <div className="flex justify-between text-xs">
              <span>Change</span>
              <span>{parseFloat(sale.change || '0').toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* BOTTOM REPRINT RUBBER STAMP */}
        {isReprint && !isCancelled && (
          <div className="text-center my-2">
            <div className="inline-block border-2 border-black border-dashed p-1.5 px-3 text-center -rotate-2">
              <div className="text-[8px] font-bold tracking-wider">★ AUDIT SEAL ★</div>
              <div className="text-sm font-black tracking-widest">REPRINTED</div>
              <div className="text-[8px]">COPY #{sale.reprint_count || 1} • {sale.reprinted_by_name || 'Admin'}</div>
            </div>
          </div>
        )}

        <div className="text-center text-[10px] mt-2">
          <p>Thank you and we wish you good health!</p>
          <p>Please retain this receipt for any returns.</p>
        </div>

        {/* Paper feed spacer for thermal auto-cutter */}
        <div style={{ height: '12mm' }}></div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';