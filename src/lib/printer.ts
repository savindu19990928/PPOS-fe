import { ElectronPrinterInfo } from '../types/electron';

export interface PrintReceiptOptions {
  html: string;
  silent?: boolean;
  deviceName?: string;
  title?: string;
}

export const RECEIPT_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    margin: 0;
    size: 80mm auto;
  }
  html, body {
    font-family: 'Courier New', Courier, 'Lucida Console', monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    width: 80mm;
    max-width: 80mm;
    padding: 2mm 3mm 12mm 3mm;
    line-height: 1.35;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  @media print {
    @page {
      margin: 0;
      size: 80mm auto;
    }
    html, body {
      width: 80mm !important;
      max-width: 80mm !important;
      padding: 2mm 3mm 12mm 3mm !important;
    }
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .separator { border-top: 1px dashed #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; line-height: 1.45; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th, td { padding: 2px 0; font-size: 11px; }
  th { text-align: left; border-bottom: 1px dashed #000; }
  .text-right { text-align: right; }
  .total-row { font-size: 13px; font-weight: bold; }
  .footer { font-size: 10px; margin-top: 6px; text-align: center; }
  .paper-feed { height: 12mm; }
  .reprint-seal-box {
    border: 2px solid #000;
    margin: 8px 0;
    padding: 3px;
    text-align: center;
    background: #fff;
  }
  .reprint-seal-inner {
    border: 1px dashed #000;
    padding: 5px 4px;
  }
  .reprint-rubber-stamp {
    display: inline-block;
    border: 2px solid #b91c1c;
    outline: 2px dashed #b91c1c;
    outline-offset: -3px;
    color: #b91c1c;
    padding: 5px 10px;
    border-radius: 4px;
    text-align: center;
    margin: 6px auto;
    transform: rotate(-2deg);
  }
`;

/**
 * Check if the application is running inside Electron desktop shell
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
}

/**
 * Check if the initial printing of a sale has been recorded.
 * If 1st printing has not been recorded, the user can print without reprinting.
 */
export function isFirstPrintRecorded(sale: {
  id?: number | string;
  sale_number?: string;
  printed_at?: string | null;
  status?: string;
  reprint_count?: number;
  reprinted_at?: string | null;
  original_bill_data?: { printed_at?: string | null } | null;
}): boolean {
  if (!sale) return false;

  // 1. Check if backend recorded printed_at or original_bill_data.printed_at
  if (sale.original_bill_data?.printed_at) return true;
  if (sale.printed_at) return true;

  // 2. Check reprint status / count
  if (sale.status === 'REPRINTED') return true;
  if (sale.reprint_count != null && sale.reprint_count > 0) return true;
  if (sale.reprinted_at) return true;

  // 3. Check client-side recording
  if (typeof localStorage !== 'undefined') {
    try {
      const printedMap = JSON.parse(localStorage.getItem('pos_printed_sales') || '{}');
      if (sale.id && printedMap[sale.id]) return true;
      if (sale.sale_number && printedMap[sale.sale_number]) return true;
    } catch (e) {
      console.debug('Error reading printed sales map:', e);
    }
  }

  return false;
}

/**
 * Record that a sale's printing has been performed.
 */
export function recordSalePrint(saleId?: number | string, saleNumber?: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const printedMap = JSON.parse(localStorage.getItem('pos_printed_sales') || '{}');
    const now = new Date().toISOString();
    if (saleId != null) printedMap[saleId] = now;
    if (saleNumber) printedMap[saleNumber] = now;
    localStorage.setItem('pos_printed_sales', JSON.stringify(printedMap));
  } catch (e) {
    console.debug('Error saving printed sales map:', e);
  }
}

/**
 * Retrieve user's printing preference
 */
export function getSilentPrintPreference(): boolean {
  return true;
}

/**
 * Save user's printing preference
 */
export function setSilentPrintPreference(_enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pos_silent_print', 'true');
  }
}

/**
 * Get chosen target printer name (or empty string for default)
 */
export function getSelectedPrinterPreference(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('pos_selected_printer') || '';
}

/**
 * Save chosen target printer name
 */
export function setSelectedPrinterPreference(printerName: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pos_selected_printer', printerName);
  }
}

/**
 * Retrieve list of installed Windows printers (Electron only)
 */
export async function getSystemPrinters(): Promise<ElectronPrinterInfo[]> {
  if (isElectronEnvironment() && window.electronAPI?.getPrinters) {
    try {
      return await window.electronAPI.getPrinters();
    } catch (err) {
      console.error('Failed to get system printers:', err);
      return [];
    }
  }
  return [];
}

/**
 * Print receipt document directly to default printer
 */
export async function printReceipt(
  options: PrintReceiptOptions
): Promise<{ success: boolean; error?: string }> {
  const deviceName = options.deviceName || getSelectedPrinterPreference();
  const title = options.title || 'Receipt';

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${RECEIPT_STYLES}</style>
</head>
<body>
  ${options.html}
</body>
</html>`;

  // 1. Electron Native Printing (direct to printer without dialog)
  if (isElectronEnvironment() && window.electronAPI?.printReceipt) {
    try {
      const result = await window.electronAPI.printReceipt({
        html: fullHtml,
        silent: true,
        deviceName: deviceName || undefined
      });
      return result;
    } catch (err: any) {
      console.error('Electron native print failed, falling back to iframe print:', err);
    }
  }

  // 2. Browser Hidden Iframe Fallback (No intrusive popup windows)
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    try {
      let iframe = document.getElementById('pos-silent-print-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'pos-silent-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '80mm';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        resolve({ success: false, error: 'Could not access printer iframe document.' });
        return;
      }

      doc.open();
      doc.write(fullHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve({ success: true });
        } catch (e: any) {
          resolve({ success: false, error: e?.message || 'Print error in browser iframe.' });
        }
      }, 250);
    } catch (err: any) {
      resolve({ success: false, error: err?.message || 'Print execution failed.' });
    }
  });
}
