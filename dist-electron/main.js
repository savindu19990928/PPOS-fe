"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const electron_updater_1 = require("electron-updater");
// ==============================================================
// 1. Environment Configuration (.env & GitHub Token)
// ==============================================================
function loadEnvFile(envPath) {
    try {
        if (!envPath || !fs_1.default.existsSync(envPath))
            return false;
        const content = fs_1.default.readFileSync(envPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
                continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx !== -1) {
                const key = trimmed.slice(0, eqIdx).trim();
                let value = trimmed.slice(eqIdx + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (key && !process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
        return true;
    }
    catch (err) {
        console.warn("Could not load env file from:", envPath, err);
        return false;
    }
}
const possibleEnvPaths = [
    path_1.default.join(__dirname, "../.env"),
    path_1.default.join(process.cwd(), ".env"),
    path_1.default.join(electron_1.app.getAppPath(), ".env"),
    path_1.default.join(process.resourcesPath || "", ".env")
];
for (const p of possibleEnvPaths) {
    if (loadEnvFile(p)) {
        break;
    }
}
const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (githubToken) {
    process.env.GH_TOKEN = githubToken;
}
// ==============================================================
// 2. Windows 7 / 8 / 8.1 Legacy Compatibility Flags
// ==============================================================
// 1. Disable window occlusion calculation (prevents blank/freezing screens on Windows 7 & 8.1)
electron_1.app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
// 2. Disable GPU sandbox for legacy Windows graphics drivers
electron_1.app.commandLine.appendSwitch("disable-gpu-sandbox");
// 3. Enforce TLS 1.2 minimum on Windows 7 for secure GitHub HTTPS communication
electron_1.app.commandLine.appendSwitch("ssl-version-min", "tls1.2");
// 4. Fallback: Allow disabling hardware acceleration completely on low-spec/broken legacy drivers
if (process.argv.includes("--no-gpu") || process.argv.includes("--disable-gpu")) {
    electron_1.app.disableHardwareAcceleration();
}
// POS Printing Optimization: Direct printing to default printer without dialog or preview
electron_1.app.commandLine.appendSwitch("kiosk-printing");
const isDev = !electron_1.app.isPackaged;
let mainWindow = null;
// ==============================================================
// 3. Auto-Updater Setup (electron-updater + GitHub Releases)
// ==============================================================
electron_updater_1.autoUpdater.autoDownload = false; // User controls download via update button
electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
if (githubToken) {
    electron_updater_1.autoUpdater.setFeedURL({
        provider: "github",
        owner: "savindu19990928",
        repo: "PPOS-fe",
        token: githubToken
    });
}
function sendToWindow(channel, data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
}
electron_updater_1.autoUpdater.on("checking-for-update", () => {
    sendToWindow("update-status", { status: "checking" });
});
electron_updater_1.autoUpdater.on("update-available", (info) => {
    sendToWindow("update-status", {
        status: "available",
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
    });
});
electron_updater_1.autoUpdater.on("update-not-available", (info) => {
    sendToWindow("update-status", {
        status: "not-available",
        version: info?.version || electron_1.app.getVersion()
    });
});
electron_updater_1.autoUpdater.on("error", (err) => {
    sendToWindow("update-status", {
        status: "error",
        error: err?.message || "Error checking or downloading update"
    });
});
electron_updater_1.autoUpdater.on("download-progress", (progressObj) => {
    sendToWindow("update-status", {
        status: "downloading",
        percent: Math.round(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
    });
});
electron_updater_1.autoUpdater.on("update-downloaded", (info) => {
    sendToWindow("update-status", {
        status: "downloaded",
        version: info.version,
        releaseNotes: info.releaseNotes
    });
});
// Helper for development testing when app is not packaged
function checkGitHubReleasesInDev() {
    sendToWindow("update-status", { status: "checking" });
    const options = {
        hostname: "api.github.com",
        path: "/repos/savindu19990928/PPOS-fe/releases/latest",
        method: "GET",
        headers: {
            "User-Agent": "Mediflex-POS",
            ...(githubToken ? { Authorization: `token ${githubToken}` } : {})
        }
    };
    const req = https_1.default.request(options, (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
            try {
                if (res.statusCode === 200) {
                    const data = JSON.parse(raw);
                    const latestVersion = (data.tag_name || "").replace(/^v/, "");
                    const currentVersion = electron_1.app.getVersion();
                    if (latestVersion && latestVersion !== currentVersion) {
                        sendToWindow("update-status", {
                            status: "available",
                            version: latestVersion,
                            releaseDate: data.published_at,
                            releaseNotes: data.body,
                            isDev: true
                        });
                    }
                    else {
                        sendToWindow("update-status", {
                            status: "not-available",
                            version: currentVersion,
                            isDev: true
                        });
                    }
                }
                else if (res.statusCode === 404) {
                    sendToWindow("update-status", {
                        status: "not-available",
                        version: electron_1.app.getVersion(),
                        isDev: true
                    });
                }
                else {
                    sendToWindow("update-status", {
                        status: "error",
                        error: `GitHub API: ${res.statusCode} ${res.statusMessage}`,
                        isDev: true
                    });
                }
            }
            catch (err) {
                sendToWindow("update-status", {
                    status: "error",
                    error: err?.message || "Failed to parse release information",
                    isDev: true
                });
            }
        });
    });
    req.on("error", (err) => {
        sendToWindow("update-status", {
            status: "error",
            error: err.message,
            isDev: true
        });
    });
    req.end();
    return { success: true };
}
// ==============================================================
// 4. Main Window Creation
// ==============================================================
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
        // Automated background update check on app launch
        if (!isDev) {
            setTimeout(() => {
                electron_updater_1.autoUpdater.checkForUpdates().catch((err) => {
                    console.warn("Background auto-update check notice:", err?.message);
                });
            }, 5000);
        }
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
    }
    else {
        const indexPath = path_1.default.join(__dirname, "../dist/index.html");
        mainWindow.loadFile(indexPath);
    }
}
// ==============================================================
// 5. IPC Handlers for Auto-Update
// ==============================================================
electron_1.ipcMain.handle("check-for-updates", async () => {
    if (isDev) {
        return checkGitHubReleasesInDev();
    }
    try {
        const res = await electron_updater_1.autoUpdater.checkForUpdates();
        return { success: true, updateInfo: res?.updateInfo };
    }
    catch (err) {
        sendToWindow("update-status", {
            status: "error",
            error: err?.message || "Failed to check for updates."
        });
        return { success: false, error: err?.message };
    }
});
electron_1.ipcMain.handle("download-update", async () => {
    if (isDev) {
        return {
            success: false,
            error: "Auto-download is only supported in packaged production builds."
        };
    }
    try {
        await electron_updater_1.autoUpdater.downloadUpdate();
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err?.message };
    }
});
electron_1.ipcMain.handle("install-update", () => {
    try {
        electron_updater_1.autoUpdater.quitAndInstall(false, true);
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err?.message };
    }
});
electron_1.ipcMain.handle("get-app-version", () => {
    return electron_1.app.getVersion();
});
// ==============================================================
// 6. IPC Handlers for Native POS Printing
// ==============================================================
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
// Single instance lock
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
