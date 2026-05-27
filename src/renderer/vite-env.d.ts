/// <reference types="vite/client" />

import type { RetroLauncherApi } from '../shared/types'

declare global {
  interface Window {
    retroLauncher: RetroLauncherApi
  }
}
