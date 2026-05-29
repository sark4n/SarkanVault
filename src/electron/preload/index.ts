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
  chooseExecutable: () => ipcRenderer.invoke('dialog:chooseExecutable'),
  chooseImage: () => ipcRenderer.invoke('dialog:chooseImage'),
  chooseFolder: () => ipcRenderer.invoke('dialog:chooseFolder'),
  launchGame: (gameId: string) => ipcRenderer.invoke('games:launch', gameId),
  toggleFavorite: (gameId: string) => ipcRenderer.invoke('games:toggleFavorite', gameId),
  revealPath: (filePath: string) => ipcRenderer.invoke('shell:revealPath', filePath)
}

contextBridge.exposeInMainWorld('retroLauncher', api)
