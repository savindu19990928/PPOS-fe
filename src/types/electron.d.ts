export interface ElectronPrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
}

export interface ElectronAPI {
  ping: () => string;
  isElectron: boolean;
  printReceipt: (options: {
    html: string;
    silent?: boolean;
    deviceName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  getPrinters: () => Promise<ElectronPrinterInfo[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
