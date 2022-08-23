const fs = require('fs');
const path = require("path");
const { app, BrowserWindow, ipcMain, screen, Menu, session, shell } = require('electron');
const format = require('date-fns/format');
const store = require("./store");

const servers = require("./constants/servers.json");
const resolutions = require("./constants/resolutions.json");

// Global reference to settingsWin
let settingsWin = null;
let gameWin = null;

const screenshot = async () => {
  const desktopPath = app.getPath("desktop");
  if (gameWin) {
    let image = await gameWin.webContents.capturePage();
    let outputFilePath = path.join(desktopPath, `majsoul-electron-capture-${format(new Date(), 'MM-dd-yyyy-HH-mm-ss')}.png`);
    await fs.promises.writeFile(outputFilePath, image.toPNG());
  }
}

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
        { role: 'quit' },
        {
          label: 'Screenshot',
          accelerator: 'CommandOrControl+S',
          click: screenshot
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Open Developer Tool',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
          click: async () => {
            let focused = BrowserWindow.getFocusedWindow();
            if (focused) {
              focused.webContents.openDevTools();
            }
          }
        },
        {
          label: 'Project Page',
          click: async () => {
            await shell.openExternal('https://github.com/quincyyhuang/Majsoul-Electron')
          }
        },
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
    let win;

    if (process.platform === "darwin") {
      win = new BrowserWindow({
        width: width,
        height: height,
        useContentSize: true,
        show: false,
        resizable: allowWindowResize,
        maximizable: allowWindowResize,
        fullscreenable: allowWindowResize
      });

      if (allowWindowResize && keepAspectRatio) {
        // This only works properly as expected on MacOS
        win.setAspectRatio(16/9);
      }
    } else if (process.platform === "linux") {
      win = new BrowserWindow({
        width: width,
        height: height,
        useContentSize: true,
        show: false,
        icon: path.join(__dirname, "../build/icon.png"),
        resizable: allowWindowResize,
        maximizable: allowWindowResize,
        fullscreenable: allowWindowResize
      });

      if (allowWindowResize && keepAspectRatio) {
        let isMoving = false;
        let movingTimer = null;
        let resizeTimer = null;

        // "resized" event is not supported on Linux and "resize" fires all the time when user is resizing the window
        win.on('resize', () => {
          if (!isMoving) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              const [width, _] = win.getContentSize();
              win.setContentSize(width, Math.round(width * 9 / 16));
            }, 300);
          }
        });

        win.on('move', () => {
          // Because move also fires resize but we do not want to resize because that causes weird jerk of the window
          isMoving = true;
          clearTimeout(movingTimer);
          movingTimer = setTimeout(() => {
            isMoving = false;
          }, 300);
        });
      }
    } else if (process.platform === "win32") {
      win = new BrowserWindow({
        width: width,
        height: height,
        useContentSize: true,
        show: false,
        maximizable: allowWindowResize,
        fullscreenable: allowWindowResize
      });

      // Prevent resize workaround on Windows
      if (allowWindowResize === false) {
        win.on('will-resize', (event, _) => {
          event.preventDefault();
        });
      } else {
        if (keepAspectRatio === true) {
          // Keep aspect ratio workaround on Windows
          win.on('resized', () => {
            const [width, _] = win.getContentSize();
            win.setContentSize(width, Math.round(width * 9 / 16));
          });
        }
      }
    }

    // Pass game url by query string
    win.loadFile(path.join(__dirname, '../static/game.html'), {
      query: {
        url: serverItem.url
      }
    });

    win.once('ready-to-show', () => {
      win.show();
    });

    gameWin = win;
  }
}

const createSettingsWindow = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    useContentSize: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'settingsPreload.js')
    }
  });

  // Set AppImage icon on linux, bundle does not work somehow
  if (process.platform === "linux") {
    win.setIcon(path.join(__dirname, "../build/icon.png"));
  }

  win.loadFile(path.join(__dirname, '../static/settings.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

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

  ipcMain.handle("clearUserData", () => {
    store.clear();
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