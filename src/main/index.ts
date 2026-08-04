import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { orpcHandler } from './server'
import { db } from './db'
import { buildContext } from './server/orpc'
import { mkdir } from 'node:fs/promises'
import { runMigrations } from './db/migrate'
import { DBDirectory } from './db/path'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.dorra.hanoti')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await mkdir(DBDirectory(), { recursive: true })

  const arabicFontPath = app.isPackaged
    ? path.join(process.resourcesPath, 'fonts', 'NotoNaskhArabic-Regular.ttf')
    : path.join(process.cwd(), 'resources', 'fonts', 'NotoNaskhArabic-Regular.ttf')

  const migrationPath = app.isPackaged
    ? path.join(process.resourcesPath, 'migrations')
    : path.join(process.cwd(), 'resources', 'migrations')

  const database = db()

  await runMigrations(database, migrationPath)

  const context = buildContext(database, arabicFontPath)

  ipcMain.on('start-orpc-server', async (event) => {
    const [serverPort] = event.ports
    orpcHandler.upgrade(serverPort, { context })
    serverPort.start()
  })

  ipcMain.handle('open-pdf', async (_event, payload: { base64: string; filename: string }) => {
    const tempPath = path.join(app.getPath('temp'), payload.filename)
    await fs.writeFile(tempPath, Buffer.from(payload.base64, 'base64'))
    await shell.openPath(tempPath)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
