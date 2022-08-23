const Store = require('electron-store');

const store = new Store({
  defaults: {
    allowWindowResize: false,
    keepAspectRatio: true,
    server: "ZH",
  }
});

module.exports = store;