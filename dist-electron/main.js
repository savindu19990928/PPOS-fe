"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
// Windows 7/8/8.1 compatibility flags:
// 1. Disable window occlusion calculation (prevents blank/freezing screens on Windows 7 & 8.1)
electron_1.app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
// 2. Disable GPU sandbox for legacy Windows graphics drivers
electron_1.app.commandLine.appendSwitch("disable-gpu-sandbox");
// 3. Fallback: Allow disabling hardware acceleration completely on low-spec/broken legacy drivers
if (process.argv.includes("--no-gpu") || process.argv.includes("--disable-gpu")) {
    electron_1.app.disableHardwareAcceleration();
}
// POS Printing Optimization:
// Direct printing to default printer without dialog or preview
electron_1.app.commandLine.appendSwitch("kiosk-printing");
const isDev = !electron_1.app.isPackaged;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: "#ffffff",
        show: false,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
    }
    else {
        const indexPath = path_1.default.join(__dirname, "../dist/index.html");
        mainWindow.loadFile(indexPath);
    }
}
// IPC Handlers for Native POS Printing
electron_1.ipcMain.handle("print-receipt", async (_event, options) => {
    const { html, deviceName } = options;
    try {
        const printWin = new electron_1.BrowserWindow({
            show: false,
            width: 320,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });
        // Resolve default printer device name if not explicitly specified
        let targetDevice = deviceName;
        if (!targetDevice) {
            try {
                const printers = await printWin.webContents.getPrintersAsync();
                const defaultPrinter = printers.find((p) => p.isDefault) || printers[0];
                if (defaultPrinter) {
                    targetDevice = defaultPrinter.name;
                }
            }
            catch (e) {
                console.warn("Could not query default printer:", e);
            }
        }
        printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        return await new Promise((resolve) => {
            printWin.webContents.on("did-finish-load", () => {
                setTimeout(() => {
                    printWin.webContents.print({
                        silent: true,
                        printBackground: true,
                        deviceName: targetDevice || "",
                        color: false,
                        margins: {
                            marginType: "none"
                        }
                    }, (success, failureReason) => {
                        try {
                            printWin.destroy();
                        }
                        catch (destroyErr) {
                            console.error(destroyErr);
                        }
                        if (!success) {
                            resolve({ success: false, error: failureReason || "Printing failed." });
                        }
                        else {
                            resolve({ success: true });
                        }
                    });
                }, 150);
            });
            printWin.webContents.on("did-fail-load", (_e, _code, desc) => {
                try {
                    printWin.destroy();
                }
                catch (destroyErr) {
                    console.error(destroyErr);
                }
                resolve({ success: false, error: desc || "Failed to render receipt content." });
            });
        });
    }
    catch (err) {
        return { success: false, error: err?.message || "Internal printing error." };
    }
});
electron_1.ipcMain.handle("get-printers", async () => {
    try {
        if (!mainWindow)
            return [];
        const printers = await mainWindow.webContents.getPrintersAsync();
        return printers.map((p) => ({
            name: p.name,
            displayName: p.displayName || p.name,
            isDefault: p.isDefault
        }));
    }
    catch (err) {
        console.error("Failed to retrieve system printers:", err);
        return [];
    }
});
// Single instance lock (essential on POS machines to prevent duplicate processes)
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on("second-instance", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
    electron_1.app.whenReady().then(() => {
        electron_1.Menu.setApplicationMenu(null);
        createWindow();
    });
}
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
