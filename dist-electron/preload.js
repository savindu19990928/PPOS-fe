"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    ping: () => "pong",
    isElectron: true,
    // Native POS Printing
    printReceipt: (options) => electron_1.ipcRenderer.invoke("print-receipt", options),
    getPrinters: () => electron_1.ipcRenderer.invoke("get-printers"),
    // Auto-Updater Features
    getAppVersion: () => electron_1.ipcRenderer.invoke("get-app-version"),
    checkForUpdates: () => electron_1.ipcRenderer.invoke("check-for-updates"),
    downloadUpdate: () => electron_1.ipcRenderer.invoke("download-update"),
    installUpdate: () => electron_1.ipcRenderer.invoke("install-update"),
    onUpdateStatus: (callback) => {
        const subscription = (_event, data) => callback(data);
        electron_1.ipcRenderer.on("update-status", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("update-status", subscription);
        };
    }
});
