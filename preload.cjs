const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isDev: () => ipcRenderer.invoke("is-dev"),
  openDataFolder: () => ipcRenderer.invoke("open-data-folder"),
  getDataPath: () => ipcRenderer.invoke("get-data-path"),
  saveWorldDialog: (json) => ipcRenderer.invoke("save-world-dialog", json),
  loadWorldDialog: () => ipcRenderer.invoke("load-world-dialog"),
  copyImageToClipboard: (dataUrl) => ipcRenderer.invoke("copy-image-to-clipboard", dataUrl),
});
