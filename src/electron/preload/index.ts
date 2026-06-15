import { contextBridge, ipcRenderer } from 'electron'
import type { ConsoleId, CoverSearchResult, EmulatorConfig, MetadataSettings, RetroLauncherApi } from '../../shared/types'

const api: RetroLauncherApi = {
  getSnapshot: () => ipcRenderer.invoke('library:getSnapshot'),
  scanLibrary: () => ipcRenderer.invoke('library:scan'),
  detectEmulators: () => ipcRenderer.invoke('emulators:detect'),
  saveEmulator: (config: EmulatorConfig) => ipcRenderer.invoke('emulators:save', config),
  saveMetadataSettings: (settings: MetadataSettings) => ipcRenderer.invoke('metadata:saveSettings', settings),
  searchCovers: (gameId: string, query?: string) => ipcRenderer.invoke('covers:search', gameId, query),
  downloadCover: (gameId: string, result: CoverSearchResult) => ipcRenderer.invoke('covers:download', gameId, result),
  downloadMissingCovers: (consoleId?: ConsoleId, limit?: number) =>
    ipcRenderer.invoke('covers:downloadMissing', consoleId, limit),
  setLocalCover: (gameId: string, filePath: string) => ipcRenderer.invoke('covers:setLocal', gameId, filePath),
  rescanLocalCovers: (consoleId?: ConsoleId) => ipcRenderer.invoke('covers:rescanLocal', consoleId),
  chooseExecutable: () => ipcRenderer.invoke('dialog:chooseExecutable'),
  chooseImage: () => ipcRenderer.invoke('dialog:chooseImage'),
  chooseFolder: () => ipcRenderer.invoke('dialog:chooseFolder'),
  launchGame: (gameId: string) => ipcRenderer.invoke('games:launch', gameId),
  toggleFavorite: (gameId: string) => ipcRenderer.invoke('games:toggleFavorite', gameId),
  toggleHidden: (gameId: string) => ipcRenderer.invoke('games:toggleHidden', gameId),
  revealPath: (filePath: string) => ipcRenderer.invoke('shell:revealPath', filePath)
}

contextBridge.exposeInMainWorld('retroLauncher', api)

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean) => callback(value)
    ipcRenderer.on('window:maximizeChanged', handler)
    return () => ipcRenderer.removeListener('window:maximizeChanged', handler)
  }
})
