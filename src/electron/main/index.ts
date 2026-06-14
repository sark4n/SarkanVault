import { join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, protocol, shell } from 'electron'
import type { ConsoleId, CoverSearchResult, EmulatorConfig, MetadataSettings } from '../../shared/types'
import { CoverService } from './coverService'
import { detectEmulators } from './emulatorDetector'
import { GameLauncher } from './launcher'
import { LocalStore } from './localStore'
import { registerMediaProtocol } from './mediaProtocol'
import { RomScanner } from './romScanner'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'retro-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
])

app.setName('Sarkan Vault')

const store = new LocalStore()
const scanner = new RomScanner(store)
const launcher = new GameLauncher(store)
const coverService = new CoverService(store)

async function createWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1060,
    minHeight: 720,
    fullscreen: true,
    title: 'Sarkan Vault',
    backgroundColor: '#07080d',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximizeChanged', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximizeChanged', false)
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('library:getSnapshot', async () => store.getSnapshot())

  ipcMain.handle('library:scan', async () => {
    const summary = await scanner.scanAll()
    const snapshot = await store.getSnapshot()
    return { snapshot, summary }
  })

  ipcMain.handle('emulators:detect', async () => {
    const state = await store.load()
    const { configs, detections } = detectEmulators(state.emulators)
    await store.saveEmulatorConfigs(configs)
    const snapshot = await store.getSnapshot()
    return { snapshot, detections }
  })

  ipcMain.handle('emulators:save', async (_event, config: EmulatorConfig) => {
    await store.saveEmulatorConfig(config)
    return store.getSnapshot()
  })

  ipcMain.handle('metadata:saveSettings', async (_event, settings: MetadataSettings) => {
    await store.saveMetadataSettings(settings)
    return store.getSnapshot()
  })

  ipcMain.handle('covers:search', async (_event, gameId: string, query?: string) => {
    return coverService.search(gameId, query)
  })

  ipcMain.handle('covers:download', async (_event, gameId: string, result: CoverSearchResult) => {
    const downloadResult = await coverService.download(gameId, result)
    const snapshot = await store.getSnapshot()
    return { snapshot, result: downloadResult }
  })

  ipcMain.handle('covers:downloadMissing', async (_event, consoleId?: ConsoleId, limit?: number) => {
    const summary = await coverService.downloadMissing(consoleId, limit)
    const snapshot = await store.getSnapshot()
    return { snapshot, summary }
  })

  ipcMain.handle('covers:setLocal', async (_event, gameId: string, filePath: string) => {
    await store.setGameCover(gameId, filePath)
    return store.getSnapshot()
  })

  ipcMain.handle('covers:rescanLocal', async (_event, consoleId?: ConsoleId) => {
    await scanner.rescanLocalCovers(consoleId)
    return store.getSnapshot()
  })

  ipcMain.handle('dialog:chooseExecutable', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options = {
      title: 'Choose emulator executable',
      properties: ['openFile'],
      filters: [{ name: 'Windows executable', extensions: ['exe'] }]
    } satisfies Electron.OpenDialogOptions
    const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options)

    return result.canceled ? undefined : result.filePaths[0]
  })

  ipcMain.handle('dialog:chooseFolder', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options = {
      title: 'Choose folder',
      properties: ['openDirectory', 'createDirectory']
    } satisfies Electron.OpenDialogOptions
    const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options)

    return result.canceled ? undefined : result.filePaths[0]
  })

  ipcMain.handle('dialog:chooseImage', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options = {
      title: 'Choose console image',
      properties: ['openFile'],
      filters: [{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
    } satisfies Electron.OpenDialogOptions
    const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options)

    return result.canceled ? undefined : result.filePaths[0]
  })

  ipcMain.handle('games:launch', async (_event, gameId: string) => {
    const result = await launcher.launch(gameId)
    const snapshot = await store.getSnapshot()
    return { snapshot, result }
  })

  ipcMain.handle('games:toggleFavorite', async (_event, gameId: string) => {
    await store.toggleFavorite(gameId)
    return store.getSnapshot()
  })

  ipcMain.handle('shell:revealPath', async (_event, targetPath: string) => {
    if (targetPath) shell.showItemInFolder(targetPath)
  })

  ipcMain.handle('window:minimize', async (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window:maximize', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.handle('window:close', async (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window:isMaximized', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.isMaximized() ?? false
  })
}

app.whenReady().then(async () => {
  registerMediaProtocol()
  registerIpc()
  await store.load()
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
