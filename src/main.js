const { app } = require('electron');
const { autoUpdater } = require("electron-updater");
const { prepareIPC, makeMenu, createSettingsWindow } = require("./setup");

// Set up auto updater
if (app.isPackaged) {
  autoUpdater.checkForUpdatesAndNotify();
}

// Enable this to get brighter color but may not be accurate
// app.commandLine.appendSwitch('disable-color-correct-rendering');

app.whenReady().then(() => {
  makeMenu();
  prepareIPC();
  createSettingsWindow();
});