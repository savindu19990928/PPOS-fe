import React, { useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PrinterIcon, XIcon } from 'lucide-react';
import { BillItem } from '../../types';
interface BillPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  saleNumber: string;
  createdAt: string;
  createdBy: string;
  customerName?: string;
  paymentMethod: string;
  items: BillItem[];
  total: number;
  amountPaid: number;
  change: number;
}
export function BillPreview({
  isOpen,
  onClose,
  saleNumber,
  createdAt,
  createdBy,
  customerName,
  paymentMethod,
  items,
  total,
  amountPaid,
  change
}: BillPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=302,height=600');
    if (!printWindow) return;
    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { margin: 0; size: 80mm auto; }
      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        color: #000;
        background: #fff;
        width: 80mm;
        padding: 4mm;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .separator { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 2px 0; font-size: 11px; }
      th { text-align: left; border-bottom: 1px dashed #000; }
      .text-right { text-align: right; }
      .total-row { font-size: 14px; font-weight: bold; }
      .footer { font-size: 10px; margin-top: 8px; }
    `;
    printWindow.document.write(
      '<html><head><title>Receipt - ' +
      saleNumber +
      '</title><style>{`' +
      styles +
      '`}</style></head><body>' +
      printContent.innerHTML +
      '</body></html>'
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  const dateObj = new Date(createdAt);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={'Bill Preview — ' + saleNumber}
      size="lg">

      <div className="flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-sm mx-auto w-full shadow-inner font-mono text-xs text-black">
          <div ref={receiptRef}>
            {/* Header */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px'
              }}>

              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>

                Mediflex Pharmacy
              </div>
              <div
                style={{
                  fontSize: '11px'
                }}>

                181 Old Kottawa Rd, Maharagama
              </div>
              <div
                style={{
                  fontSize: '11px'
                }}>

                Tel: +94 76 909 8091
              </div>
            </div>

            <div
              style={{
                borderTop: '1px dashed #000',
                margin: '8px 0'
              }}>
            </div>

            {/* Sale Info */}
            <div
              style={{
                fontSize: '11px',
                lineHeight: '1.6'
              }}>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>

                <span>Sale No: {saleNumber}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>

                <span>Date: {dateObj.toLocaleDateString()}</span>
                <span>Time: {dateObj.toLocaleTimeString()}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>

                <span>By: {createdBy}</span>
              </div>
              {customerName && <div>Customer: {customerName}</div>}
            </div>

            <div
              style={{
                borderTop: '1px dashed #000',
                margin: '8px 0'
              }}>
            </div>

            {/* Items */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px'
              }}>

              <thead>
                <tr
                  style={{
                    borderBottom: '1px dashed #000'
                  }}>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '2px 0'
                    }}>

                    Item
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '2px 0'
                    }}>

                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '2px 0'
                    }}>

                    Price
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '2px 0'
                    }}>

                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) =>
                <tr key={item.id}>
                    <td
                    style={{
                      padding: '3px 4px 3px 0',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>

                      {item.name}
                    </td>
                    <td
                    style={{
                      textAlign: 'right',
                      padding: '3px 0'
                    }}>

                      {item.quantity}
                    </td>
                    <td
                    style={{
                      textAlign: 'right',
                      padding: '3px 0'
                    }}>

                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td
                    style={{
                      textAlign: 'right',
                      padding: '3px 0'
                    }}>

                      {item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div
              style={{
                borderTop: '1px dashed #000',
                margin: '8px 0'
              }}>
            </div>

            {/* Totals */}
            <div
              style={{
                fontSize: '11px',
                lineHeight: '1.6'
              }}>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>

                <span>TOTAL</span>
                <span>{total.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>

                <span>Payment ({paymentMethod})</span>
                <span>{amountPaid.toFixed(2)}</span>
              </div>
              {change > 0 &&
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>

                  <span>Change</span>
                  <span>{change.toFixed(2)}</span>
                </div>
              }
            </div>

            <div
              style={{
                borderTop: '1px dashed #000',
                margin: '8px 0'
              }}>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '10px',
                lineHeight: '1.5'
              }}>

              <div>Thank you and we wish you good health!</div>
              <div>Please retain this receipt for any returns.</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={onClose}>
            <XIcon className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>);

}