const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require("electron-updater")

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1150,
    height: 920,
    autoHideMenuBar: true,
    // titleBarStyle: 'hidden',
    // titleBarOverlay: {
    //   color: '#003186',
    //   symbolColor: '#FFFFFF'
    // },
    webPreferences: {
      preload: path.join(__dirname, 'server/app.js'),
      nodeIntegrationInWorker: true
    }
  })

  win.loadFile('client/home.html')

  ipcMain.handle('open-dialog-download-folder', () => {
    return dialog.showOpenDialogSync( { properties:["openDirectory"] })
  });

  ipcMain.handle('search-beta-updates', () => {
    autoUpdater.channel = 'beta'
    autoUpdater.allowPrerelease();
    autoUpdater.checkForUpdatesAndNotify();
  });

  ipcMain.handle('get-version', () => {
    return app.getVersion()
  });

  // Open dev tools
  if (process.env.npm_package_version === '0.0.0-dev') {
    win.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  if (app.getVersion().includes('-beta')) {
    autoUpdater.channel = 'beta'
  }

  autoUpdater.checkForUpdatesAndNotify();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
