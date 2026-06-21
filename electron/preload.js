const { BrowserWindow, app, screen, ipcMain } = require('electron')

const path = require('path')
const AutoLaunch = require('auto-launch')

let splashWindow
let mainWindow
let customerWindow

const appLauncher = new AutoLaunch({
  name: 'Princess Salon POS',
})

function createWindows() {
  const displays = screen.getAllDisplays()

  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    center: true,
    alwaysOnTop: true,
    resizable: false,
    autoHideMenuBar: true,
  })

  splashWindow.loadFile(path.join(__dirname, 'splash.html'))

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL('https://posfrontend-4v9e.vercel.app')

  mainWindow.webContents.once('did-finish-load', () => {
    if (splashWindow) {
      splashWindow.destroy()
    }

    mainWindow.show()
  })

  if (displays.length > 1) {
    const secondDisplay = displays[1]

    customerWindow = new BrowserWindow({
      x: secondDisplay.bounds.x,
      y: secondDisplay.bounds.y,
      width: secondDisplay.bounds.width,
      height: secondDisplay.bounds.height,
      fullscreen: true,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    customerWindow.loadURL('https://posfrontend-4v9e.vercel.app/customer-display')
  }
}

ipcMain.handle('print-receipt', async (event, html) => {
  const printWindow = new BrowserWindow({
    show: false,
  })

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

  await new Promise((resolve) => {
    printWindow.webContents.print(
      {
        silent: true,
        printBackground: true,
      },
      () => {
        resolve()
      },
    )
  })

  printWindow.close()

  return true
})

app.whenReady().then(async () => {
  const enabled = await appLauncher.isEnabled()

  if (!enabled) {
    await appLauncher.enable()
  }

  createWindows()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
