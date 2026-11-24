// The game needs no Node access. This preload only tells the page it runs inside the desktop app.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('redStringDesktop', { platform: process.platform });
