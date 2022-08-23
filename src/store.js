const Store = require('electron-store');

const store = new Store({
  defaults: {
    allowWindowResize: false,
    keepAspectRatio: true,
    server: "CN",
  }
});

module.exports = store;