import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => "pong",
  isElectron: true,
  printReceipt: (options: { html: string; silent?: boolean; deviceName?: string }) =>
    ipcRenderer.invoke("print-receipt", options),
  getPrinters: () => ipcRenderer.invoke("get-printers")
});
