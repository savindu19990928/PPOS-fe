"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    ping: () => "pong",
    isElectron: true,
    printReceipt: (options) => electron_1.ipcRenderer.invoke("print-receipt", options),
    getPrinters: () => electron_1.ipcRenderer.invoke("get-printers")
});
