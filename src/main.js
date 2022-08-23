const { app } = require('electron');
const { prepareIPC, makeMenu, createSettingsWindow } = require("./setup");

// This fixes color brightness issues
app.commandLine.appendSwitch('disable-color-correct-rendering');

app.whenReady().then(() => {
  makeMenu();
  prepareIPC();
  createSettingsWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});