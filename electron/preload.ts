import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => "pong",
  isElectron: true,

  // Native POS Printing
  printReceipt: (options: { html: string; silent?: boolean; deviceName?: string }) =>
    ipcRenderer.invoke("print-receipt", options),
  getPrinters: () => ipcRenderer.invoke("get-printers"),

  // Auto-Updater Features
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateStatus: (callback: (data: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on("update-status", subscription);
    return () => {
      ipcRenderer.removeListener("update-status", subscription);
    };
  }
});
