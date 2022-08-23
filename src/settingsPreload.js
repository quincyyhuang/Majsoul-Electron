const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: ipcRenderer.invoke("getSettings"),
  startGame: settings => ipcRenderer.invoke("startGame", settings)
});