const { app, BrowserWindow, ipcMain, shell, dialog, clipboard, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

// In dev (electron .) app.isPackaged is false → load from Vite dev server
// In production (packaged .exe/.dmg) app.isPackaged is true → load from dist
const isDev = !app.isPackaged;

ipcMain.handle("copy-image-to-clipboard", (_event, dataUrl) => {
  try {
    const img = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(img);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("open-data-folder", () => {
  shell.openPath(app.getPath("userData"));
});

ipcMain.handle("get-data-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("save-world-dialog", async (_event, jsonString) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Save World",
    defaultPath: "world.json",
    filters: [{ name: "World Builder Save", extensions: ["json"] }],
  });
  if (canceled || !filePath) return { success: false };
  try {
    fs.writeFileSync(filePath, jsonString, "utf8");
    return { success: true, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("load-world-dialog", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Load World",
    filters: [{ name: "World Builder Save", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (canceled || !filePaths.length) return { success: false };
  try {
    const content = fs.readFileSync(filePaths[0], "utf8");
    return { success: true, content };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "World Builder - Game Master App",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Open all external links in the system browser instead of a new Electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    const appUrl = isDev ? "http://localhost:5173" : `file://${path.join(__dirname, "dist")}`;
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
