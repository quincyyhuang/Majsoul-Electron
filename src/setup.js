const path = require("path");
const { app, BrowserWindow, ipcMain, screen, Menu, session, shell } = require('electron');
const store = require("./store");

const servers = require("./constants/servers.json");
const resolutions = require("./constants/resolutions.json");

// Global reference to settingsWin
let settingsWin = null;
let gameWin = null;

const makeMenu = () => {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Majsoul ZH Website',
          click: async () => {
            await shell.openExternal('https://www.maj-soul.com/')
          }
        },
        {
          label: 'Majsoul JP Website',
          click: async () => {
            await shell.openExternal('https://mahjongsoul.com/')
          }
        },
        {
          label: 'Majsoul EN Website',
          click: async () => {
            await shell.openExternal('https://mahjongsoul.yo-star.com/')
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const createGameWindow = (settings) => {
  const { allowWindowResize, keepAspectRatio, server, res } = settings;
  let [width, height] = res.split("x");
  width = Number(width)
  height = Number(height);

  const serverItem = servers.find(s => s.name === server);
  if (serverItem) {
    const win = new BrowserWindow({
      width: width,
      height: height,
      useContentSize: true,
      resizable: allowWindowResize,
      maximizable: allowWindowResize,
      webPreferences: {
        additionalArguments: [serverItem.url],
        preload: path.join(__dirname, 'gamePreload.js')
      }
    });

    if (allowWindowResize && keepAspectRatio) {
      win.setAspectRatio(16/9);
    }
  
    win.loadFile(path.join(__dirname, '../static/game.html'));

    gameWin = win;
  }
}

const createSettingsWindow = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'settingsPreload.js')
    }
  });

  win.loadFile(path.join(__dirname, '../static/settings.html'));

  settingsWin = win;
}

const prepareIPC = () => {
  // Get display resolution
  const display = screen.getPrimaryDisplay();
  const supportedResolutions = resolutions.filter(r => display.size.width >= r.width && display.size.height >= r.height);
  const optimalRes = supportedResolutions[Math.floor(supportedResolutions.length / 2)]

  ipcMain.handle("getSettings", () => {
    let settings = {};

    settings.allowWindowResize = store.get("allowWindowResize");
    settings.keepAspectRatio = store.get("keepAspectRatio");
    settings.server = {
      server: store.get("server"),
      serverList: servers.map(s => s.name)
    };
    settings.res = {
      res: store.get("res", `${optimalRes.width}x${optimalRes.height}`),
      resList: supportedResolutions.map(r => `${r.width}x${r.height}`)
    };

    return settings;
  });

  ipcMain.handle("clearCache", () => {
    session.defaultSession.clearStorageData();
  });

  ipcMain.handle("startGame", (_, settings) => {
    // Save changes
    if (settings.allowWindowResize !== store.get("allowWindowResize")) {
      store.set("allowWindowResize", settings.allowWindowResize);
    }
    if (settings.keepAspectRatio !== store.get("keepAspectRatio")) {
      store.set("keepAspectRatio", settings.keepAspectRatio);
    }
    if (settings.server !== store.get("server")) {
      store.set("server", settings.server);
    }
    if (settings.res !== store.get("res")) {
      store.set("res", settings.res);
    }

    // Close settings win
    if (settingsWin) {
      settingsWin.close();
    }

    // Start game
    createGameWindow(settings);
  });
}

module.exports = {
  prepareIPC,
  createSettingsWindow,
  makeMenu
};