/// <reference types="vite/client" />

import type { RetroLauncherApi } from '../shared/types'

interface WindowControls {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
}

declare global {
  interface Window {
    retroLauncher: RetroLauncherApi
    windowControls: WindowControls
  }
}
