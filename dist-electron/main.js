"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
// Windows 7/8.1 compatibility flags:
// 1. Disable window occlusion calculation (prevents blank/freezing screens on Windows 7 & 8.1)
electron_1.app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
// 2. Disable GPU sandbox for legacy Windows graphics drivers
electron_1.app.commandLine.appendSwitch("disable-gpu-sandbox");
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
