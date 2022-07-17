const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require("electron-updater")

const createWindow = () => {
  const win = new BrowserWindow({
    width: 950,
    height: 780,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#003186',
      symbolColor: '#FFFFFF'
    },
    webPreferences: {
      preload: path.join(__dirname, 'server/app.js'),
      nodeIntegrationInWorker: true
    }
  })

  win.loadFile('client/home.html')

  ipcMain.handle('open-dialog-download-folder', () => {
    return dialog.showOpenDialogSync( { properties:["openDirectory"] })
  });

  // Open dev tools
  win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  if (window.localStorage.getItem('updateChannel') === 'beta') {
    autoUpdater.channel = 'beta'
  }

  autoUpdater.checkForUpdatesAndNotify();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
