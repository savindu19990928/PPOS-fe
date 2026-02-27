import { app, BrowserWindow, Menu } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
    }
    else {
        const indexPath = path.join(app.getAppPath(), "dist", "index.html");
        mainWindow.loadFile(indexPath);
    }
}
app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
