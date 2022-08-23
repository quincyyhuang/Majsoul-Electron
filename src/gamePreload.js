const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  url: process.argv[process.argv.length - 1]
});