const { BrowserWindow, app, screen } = require('electron')
const path = require('path')

let mainWindow
let customerWindow

function createWindows() {
  const displays = screen.getAllDisplays()

  // Main POS Window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))

  // Customer Display
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
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    customerWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    console.log('No second monitor detected')
  }
}

app.whenReady().then(createWindows)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
