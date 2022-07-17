const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 950,
    height: 780,
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
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
