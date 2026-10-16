import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PrinterIcon, XIcon, AlertTriangleIcon, AwardIcon, CheckCircle2Icon, LockIcon } from 'lucide-react';
import { BillItem, OriginalBillData, ReprintingData } from '../../types';
import {
  printReceipt,
  isElectronEnvironment,
  getSystemPrinters,
  getSelectedPrinterPreference,
  setSelectedPrinterPreference,
  recordSalePrint
} from '../../lib/printer';
import { ElectronPrinterInfo } from '../../types/electron';

interface BillPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  saleId?: number | string;
  saleNumber: string;
  createdAt: string;
  createdBy: string;
  customerName?: string;
  mobileNumber?: string;
  paymentMethod: string;
  items: BillItem[];
  total: number;
  amountPaid: number;
  change: number;
  status?: string;

  // Single-print enforcement flag: only allows 1 print per authorization
  canPrint?: boolean;

  // Cancellation info
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;

  // Original bill info (from reprint endpoint or sale details)
  originalBillData?: OriginalBillData | null;

  // Reprint audit info
  reprintedBy?: string | null;
  reprintedAt?: string | null;
  reprintCount?: number;
  reprintingData?: ReprintingData | null;

  onPrinted?: () => void;
}

export function BillPreview({
  isOpen,
  onClose,
  saleId,
  saleNumber,
  createdAt,
  createdBy,
  customerName,
  mobileNumber,
  paymentMethod,
  items,
  total,
  amountPaid,
  change,
  status = 'COMPLETED',
  canPrint = true,
  cancelledBy,
  cancelledAt,
  cancellationReason,
  originalBillData,
  reprintedBy,
  reprintedAt,
  reprintCount = 0,
  reprintingData,
  onPrinted
}: BillPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<ElectronPrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState(() => getSelectedPrinterPreference());

  // Reset printed state when a new bill modal is opened or sale changes
  useEffect(() => {
    if (isOpen) {
      setHasPrinted(false);
      setPrintError(null);
      if (isElectronEnvironment()) {
        getSystemPrinters().then((printers) => {
          setAvailablePrinters(printers);
          if (!selectedPrinter && printers.length > 0) {
            const def = printers.find((p) => p.isDefault) || printers[0];
            if (def) setSelectedPrinter(def.name);
          }
        });
      }
    }
  }, [isOpen, saleNumber]);

  const isReprint =
    status === 'REPRINTED' ||
    (reprintCount != null && reprintCount > 0) ||
    Boolean(reprintingData) ||
    Boolean(reprintedAt);

  const isCancelled = status === 'CANCELLED';

  const origCashier =
    originalBillData?.printed_by_name ||
    originalBillData?.printed_by_username ||
    createdBy;

  const origPrintedAt = originalBillData?.printed_at
    ? new Date(originalBillData.printed_at)
    : new Date(createdAt);

  const repCashier =
    reprintingData?.reprinted_by_name ||
    reprintingData?.reprinted_by_username ||
    reprintedBy ||
    '';

  const repAt = reprintingData?.reprinted_at
    ? new Date(reprintingData.reprinted_at)
    : reprintedAt
    ? new Date(reprintedAt)
    : null;

  const currentReprintCount =
    reprintingData?.reprint_count || reprintCount || 1;

  // Single-use print handler: directly prints without any dialog
  const handlePrint = async () => {
    if (hasPrinted || !canPrint || isCancelled || isPrinting) return;

    const printContent = receiptRef.current;
    if (!printContent) return;

    setIsPrinting(true);
    setPrintError(null);

    try {
      const res = await printReceipt({
        html: printContent.innerHTML,
        title: `Receipt - ${saleNumber}`,
        silent: true,
        deviceName: selectedPrinter || undefined
      });

      if (res.success) {
        setHasPrinted(true);
        if (saleId || saleNumber) {
          recordSalePrint(saleId, saleNumber);
        }
        if (onPrinted) {
          onPrinted();
        }
      } else if (res.error) {
        if (!res.error.toLowerCase().includes('cancel')) {
          setPrintError(res.error);
        }
      }
    } catch (err: any) {
      setPrintError(err?.message || 'Failed to print receipt.');
    } finally {
      setIsPrinting(false);
    }
  };

  const dateObj = new Date(createdAt);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bill Preview — ${saleNumber}`}
      size="lg">
      <div className="flex flex-col gap-6">
        {/* Status Callout Banner on Screen */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2.5">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">This bill has been CANCELLED.</p>
              <p className="text-xs text-red-700 mt-0.5">
                Cancelled by {cancelledBy || 'Admin'}{' '}
                {cancelledAt && `on ${new Date(cancelledAt).toLocaleString()}`}
                {cancellationReason && ` — Reason: "${cancellationReason}"`}
              </p>
            </div>
          </div>
        )}

        {isReprint && !isCancelled && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-900 flex items-start gap-2.5">
            <AwardIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold flex items-center gap-1.5">
                <span>Official Reprinted Bill Seal Applied</span>
                <span className="bg-indigo-200 text-indigo-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                  REPRINT #{currentReprintCount}
                </span>
              </p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Original Cashier: {origCashier} | Original Date:{' '}
                {origPrintedAt.toLocaleDateString()}{' '}
                {origPrintedAt.toLocaleTimeString()}
              </p>
              <p className="text-xs text-indigo-700">
                Reprinted by: {repCashier || 'Admin'}
                {repAt && ` on ${repAt.toLocaleString()}`}
              </p>
            </div>
          </div>
        )}

        {/* Receipt Container */}
        <div className="bg-white border border-slate-300 rounded-lg p-6 max-w-sm mx-auto w-full shadow-inner font-mono text-xs text-black">
          <div ref={receiptRef}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                Mediflex Pharmacy
              </div>
              <div style={{ fontSize: '11px' }}>181 Old Kottawa Rd, Maharagama</div>
              <div style={{ fontSize: '11px' }}>Tel: +94 76 909 8091</div>
            </div>

            {/* Cancelled Banner */}
            {isCancelled && (
              <div
                style={{
                  border: '1px dashed #dc2626',
                  color: '#dc2626',
                  padding: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  margin: '6px 0'
                }}>
                *** CANCELLED BILL ***
              </div>
            )}

            {/* OFFICIAL REPRINTED SEAL (BOXED AUDIT STAMP) */}
            {isReprint && !isCancelled && (
              <div
                className="reprint-seal-box"
                style={{
                  border: '2px solid #000',
                  margin: '8px 0',
                  padding: '3px',
                  textAlign: 'center',
                  backgroundColor: '#fff'
                }}>
                <div
                  className="reprint-seal-inner"
                  style={{
                    border: '1px dashed #000',
                    padding: '5px 4px'
                  }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}>
                    ★ ★ ★ OFFICIAL SEAL ★ ★ ★
                  </div>

                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: '900',
                      letterSpacing: '3px',
                      margin: '4px 0',
                      textTransform: 'uppercase',
                      borderTop: '2px solid #000',
                      borderBottom: '2px solid #000',
                      padding: '2px 0'
                    }}>
                    REPRINTED
                  </div>

                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                    DUPLICATE BILL COPY
                  </div>

                  {/* Seal Detailed Metadata */}
                  <div
                    style={{
                      fontSize: '9px',
                      textAlign: 'left',
                      marginTop: '6px',
                      borderTop: '1px dotted #000',
                      paddingTop: '4px',
                      lineHeight: '1.45'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• REPRINTED BY:</span>
                      <strong>{repCashier || 'Admin'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• REPRINT TIME:</span>
                      <strong>
                        {repAt
                          ? `${repAt.toLocaleDateString()} ${repAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'N/A'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• REPRINT NO:</span>
                      <strong>#{currentReprintCount}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• ORIG CASHIER:</span>
                      <span>{origCashier}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• ORIG PRINTED:</span>
                      <span>{origPrintedAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '8px',
                      fontWeight: 'bold',
                      marginTop: '4px',
                      letterSpacing: '1px'
                    }}>
                    ★ MEDIFLEX PHARMACY AUDIT VERIFIED ★
                  </div>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

            {/* Sale Info */}
            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Bill No: {saleNumber}</span>
                <span>Status: {status}</span>
              </div>

              {/* In Reprint mode: show original details and reprint details */}
              {isReprint ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Orig Cashier: {origCashier}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Orig Date: {origPrintedAt.toLocaleDateString()}</span>
                    <span>{origPrintedAt.toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Reprinted By: {repCashier || 'Admin'}</span>
                    <span>Reprint #{currentReprintCount}</span>
                  </div>
                  {repAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Reprint Date: {repAt.toLocaleDateString()}</span>
                      <span>{repAt.toLocaleTimeString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date: {dateObj.toLocaleDateString()}</span>
                    <span>Time: {dateObj.toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cashier: {createdBy}</span>
                  </div>
                </>
              )}

              {customerName && (
                <div style={{ marginTop: '2px' }}>
                  <span>Customer: {customerName}</span>
                </div>
              )}
              {mobileNumber && (
                <div>
                  <span>Mobile: {mobileNumber}</span>
                </div>
              )}

              {isCancelled && (
                <div style={{ marginTop: '4px', color: '#b91c1c' }}>
                  <div>Cancelled By: {cancelledBy || 'Admin'}</div>
                  {cancelledAt && (
                    <div>Cancelled At: {new Date(cancelledAt).toLocaleString()}</div>
                  )}
                  {cancellationReason && <div>Reason: {cancellationReason}</div>}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

            {/* Items */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px'
              }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
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
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>
                      {typeof item.quantity === 'number'
                        ? item.quantity
                        : parseFloat(item.quantity)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>
                      {item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

            {/* Totals */}
            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment ({paymentMethod === 'CREDIT' ? 'CREDIT / PAY LATER' : paymentMethod})</span>
                <span>{amountPaid.toFixed(2)}</span>
              </div>
              {paymentMethod === 'CREDIT' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>BALANCE DUE (CREDIT)</span>
                  <span>{Math.max(0, total - amountPaid).toFixed(2)}</span>
                </div>
              )}
              {change > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Change</span>
                  <span>{change.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* RUBBER STAMP REPRINTED SEAL (BOTTOM VERIFICATION SEAL) */}
            {isReprint && !isCancelled && (
              <div style={{ textAlign: 'center', margin: '12px 0 6px 0' }}>
                <div
                  className="reprint-rubber-stamp"
                  style={{
                    display: 'inline-block',
                    border: '2px solid #b91c1c',
                    outline: '2px dashed #b91c1c',
                    outlineOffset: '-3px',
                    color: '#b91c1c',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    transform: 'rotate(-2deg)'
                  }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px' }}>
                    ★ AUDIT SEAL ★
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '900',
                      letterSpacing: '2px',
                      margin: '1px 0'
                    }}>
                    REPRINTED
                  </div>
                  <div style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    COPY #{currentReprintCount} • {repCashier || 'Admin'}
                  </div>
                  <div style={{ fontSize: '8px', marginTop: '1px' }}>
                    {repAt ? repAt.toLocaleDateString() : dateObj.toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

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

            {/* Thermal Printer Paper Feed for Auto-Cutter Clearance */}
            <div style={{ height: '12mm' }}></div>
          </div>
        </div>

        {/* Error Callout if print failed */}
        {printError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{printError}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col gap-3 pt-3 border-t border-slate-200">
          {/* Top row: Status & Printer Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              {!canPrint ? (
                <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1.5">
                  <LockIcon className="h-3.5 w-3.5 text-amber-600" />
                  <span>Original print used. Further prints require an authorized <strong>Reprint</strong>.</span>
                </span>
              ) : hasPrinted ? (
                <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Printed (1-time copy printed). Additional copies must use <strong>Reprint</strong>.</span>
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Limit: 1 physical copy per authorization.
                </span>
              )}
            </div>

            {/* Printer Selector */}
            {canPrint && !hasPrinted && !isCancelled && availablePrinters.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-[11px] text-slate-500 font-medium">Printer:</span>
                <select
                  value={selectedPrinter}
                  onChange={(e) => {
                    setSelectedPrinter(e.target.value);
                    setSelectedPrinterPreference(e.target.value);
                  }}
                  className="text-[11px] py-1 px-2 border border-slate-300 rounded bg-white text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 max-w-[160px] truncate"
                  title="Select destination printer">
                  {availablePrinters.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.displayName || p.name} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bottom row: Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPrinting}>
              <XIcon className="h-4 w-4 mr-1.5" />
              Close
            </Button>

            {canPrint && !hasPrinted && !isCancelled && (
              <Button
                onClick={handlePrint}
                disabled={isPrinting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs">
                <PrinterIcon className="h-4 w-4 mr-2" />
                {isPrinting
                  ? 'Printing...'
                  : isReprint
                  ? 'Print Duplicate'
                  : 'Print Receipt'}
              </Button>
            )}

            {hasPrinted && (
              <Button disabled className="opacity-60 cursor-not-allowed bg-slate-100 text-slate-600 border border-slate-200">
                <CheckCircle2Icon className="h-4 w-4 mr-2 text-emerald-600" />
                Printed (1/1)
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}