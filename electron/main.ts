import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";

// Windows 7/8/8.1 compatibility flags:
// 1. Disable window occlusion calculation (prevents blank/freezing screens on Windows 7 & 8.1)
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
// 2. Disable GPU sandbox for legacy Windows graphics drivers
app.commandLine.appendSwitch("disable-gpu-sandbox");

// 3. Fallback: Allow disabling hardware acceleration completely on low-spec/broken legacy drivers
if (process.argv.includes("--no-gpu") || process.argv.includes("--disable-gpu")) {
  app.disableHardwareAcceleration();
}

// POS Printing Optimization:
// Direct printing to default printer without dialog or preview
app.commandLine.appendSwitch("kiosk-printing");

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#ffffff",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    mainWindow.loadFile(indexPath);
  }
}

// IPC Handlers for Native POS Printing
ipcMain.handle("print-receipt", async (_event, options: { html: string; silent?: boolean; deviceName?: string }) => {
  const { html, deviceName } = options;

  try {
    const printWin = new BrowserWindow({
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
      } catch (e) {
        console.warn("Could not query default printer:", e);
      }
    }

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    return await new Promise<{ success: boolean; error?: string }>((resolve) => {
      printWin.webContents.on("did-finish-load", () => {
        setTimeout(() => {
          printWin.webContents.print(
            {
              silent: true,
              printBackground: true,
              deviceName: targetDevice || "",
              color: false,
              margins: {
                marginType: "none"
              }
            },
            (success, failureReason) => {
              try {
                printWin.destroy();
              } catch (destroyErr) {
                console.error(destroyErr);
              }
              if (!success) {
                resolve({ success: false, error: failureReason || "Printing failed." });
              } else {
                resolve({ success: true });
              }
            }
          );
        }, 150);
      });

      printWin.webContents.on("did-fail-load", (_e, _code, desc) => {
        try {
          printWin.destroy();
        } catch (destroyErr) {
          console.error(destroyErr);
        }
        resolve({ success: false, error: desc || "Failed to render receipt content." });
      });
    });
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal printing error." };
  }
});

ipcMain.handle("get-printers", async () => {
  try {
    if (!mainWindow) return [];
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName || p.name,
      isDefault: p.isDefault
    }));
  } catch (err) {
    console.error("Failed to retrieve system printers:", err);
    return [];
  }
});

// Single instance lock (essential on POS machines to prevent duplicate processes)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});