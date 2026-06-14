export type ConsoleId =
  | 'nes'
  | 'sega-genesis'
  | 'snes'
  | 'n64'
  | 'ps1'
  | 'gba'
  | 'dreamcast'
  | 'gamecube'
  | 'switch'
  | 'pc'

export type GameSource = 'scan' | 'sample'

export type CoverProviderId = 'steamgriddb' | 'screenscraper'

export interface EmulatorCandidate {
  name: string
  executableNames: string[]
  installHints: string[]
  defaultLaunchArguments?: string
  retroArchCoreNames?: string[]
}

export interface ConsoleDefinition {
  id: ConsoleId
  name: string
  shortName: string
  manufacturer: string
  generation: string
  description: string
  colorFrom: string
  colorTo: string
  accent: string
  romExtensions: string[]
  candidates: EmulatorCandidate[]
  imageUrl?: string
}

export interface EmulatorConfig {
  consoleId: ConsoleId
  emulatorName: string
  executablePath: string
  romFolderPath: string
  coverFolderPath: string
  supportedExtensions: string[]
  launchArguments: string
  retroArchCorePath: string
  consoleImageUrl?: string
  updatedAt?: string
}

export interface GameEntry {
  id: string
  consoleId: ConsoleId
  title: string
  fileName: string
  romPath: string
  launchUrl?: string
  extension: string
  coverPath?: string
  coverUrl?: string
  favorite: boolean
  playCount: number
  lastPlayed?: string
  addedAt: string
  updatedAt: string
  source: GameSource
  genre?: string
  metadata?: GameMetadata
}

export interface GameMetadata {
  description?: string
  releaseDate?: string
  developer?: string
  publisher?: string
  rating?: number
  achievements?: Achievement[]
  videoPreviewUrl?: string
  saveStates?: SaveState[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
  unlocked: boolean
  unlockedAt?: string
}

export interface SaveState {
  id: string
  slotNumber: number
  createdAt: string
  fileSize: number
  screenshotPath?: string
  cloudSynced?: boolean
}

export interface SteamGridDbSettings {
  enabled: boolean
  apiKey: string
}

export interface ScreenScraperSettings {
  enabled: boolean
  userName: string
  password: string
  devId: string
  devPassword: string
  softName: string
}

export interface MetadataSettings {
  steamGridDb: SteamGridDbSettings
  screenScraper: ScreenScraperSettings
  preferProvider: CoverProviderId
}

export interface PublicMetadataSettings {
  steamGridDb: Omit<SteamGridDbSettings, 'apiKey'> & {
    hasApiKey: boolean
  }
  screenScraper: Omit<ScreenScraperSettings, 'password' | 'devPassword'> & {
    hasPassword: boolean
    hasDevPassword: boolean
  }
  preferProvider: CoverProviderId
}

export interface CoverSearchResult {
  id: string
  provider: CoverProviderId
  providerName: string
  gameTitle: string
  imageUrl: string
  thumbUrl: string
  width?: number
  height?: number
  format?: string
  score?: number
  sourceGameId?: string
  metadata?: Record<string, string | number | boolean>
}

export interface CoverSearchResponse {
  gameId: string
  query: string
  results: CoverSearchResult[]
  warnings: string[]
}

export interface CoverDownloadResult {
  ok: boolean
  message: string
  coverPath?: string
}

export interface MissingCoverSummary {
  scanned: number
  downloaded: number
  failed: number
  skipped: number
  messages: string[]
}

export interface LibraryStats {
  totalGames: number
  configuredConsoles: number
  favoriteCount: number
  recentlyPlayedCount: number
}

export interface LibrarySnapshot {
  consoles: ConsoleDefinition[]
  emulators: EmulatorConfig[]
  metadataSettings: PublicMetadataSettings
  games: GameEntry[]
  recentlyPlayed: GameEntry[]
  favorites: GameEntry[]
  stats: LibraryStats
  lastScanAt?: string
  sampleMode: boolean
}

export interface DetectionResult {
  consoleId: ConsoleId
  emulatorName: string
  executablePath: string
  confidence: 'high' | 'medium'
  source: 'path' | 'known-location'
}

export interface ScanConsoleSummary {
  consoleId: ConsoleId
  romFolderPath: string
  totalGames: number
  warnings: string[]
}

export interface ScanSummary {
  scannedAt: string
  totalGames: number
  consoles: ScanConsoleSummary[]
}

export interface LaunchResult {
  ok: boolean
  message: string
  launchedAt?: string
}

export interface RetroLauncherApi {
  getSnapshot: () => Promise<LibrarySnapshot>
  scanLibrary: () => Promise<{ snapshot: LibrarySnapshot; summary: ScanSummary }>
  detectEmulators: () => Promise<{ snapshot: LibrarySnapshot; detections: DetectionResult[] }>
  saveEmulator: (config: EmulatorConfig) => Promise<LibrarySnapshot>
  saveMetadataSettings: (settings: MetadataSettings) => Promise<LibrarySnapshot>
  searchCovers: (gameId: string, query?: string) => Promise<CoverSearchResponse>
  downloadCover: (
    gameId: string,
    result: CoverSearchResult
  ) => Promise<{ snapshot: LibrarySnapshot; result: CoverDownloadResult }>
  downloadMissingCovers: (
    consoleId?: ConsoleId,
    limit?: number
  ) => Promise<{ snapshot: LibrarySnapshot; summary: MissingCoverSummary }>
  setLocalCover: (gameId: string, filePath: string) => Promise<LibrarySnapshot>
  rescanLocalCovers: (consoleId?: ConsoleId) => Promise<LibrarySnapshot>
  chooseExecutable: () => Promise<string | undefined>
  chooseImage: () => Promise<string | undefined>
  chooseFolder: () => Promise<string | undefined>
  launchGame: (gameId: string) => Promise<{ snapshot: LibrarySnapshot; result: LaunchResult }>
  toggleFavorite: (gameId: string) => Promise<LibrarySnapshot>
  revealPath: (filePath: string) => Promise<void>
}
