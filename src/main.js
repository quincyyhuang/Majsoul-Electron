const { app } = require('electron');
const { autoUpdater } = require("electron-updater");
const { prepareIPC, makeMenu, createSettingsWindow } = require("./setup");

// Set up auto updater
if (app.isPackaged) {
  autoUpdater.checkForUpdatesAndNotify();
}

// This fixes color brightness issues
app.commandLine.appendSwitch('disable-color-correct-rendering');

app.whenReady().then(() => {
  makeMenu();
  prepareIPC();
  createSettingsWindow();
});