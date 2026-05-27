import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import type {
  ConsoleId,
  EmulatorConfig,
  GameEntry,
  LibrarySnapshot,
  MetadataSettings,
  PublicMetadataSettings
} from '../../shared/types'
import { consoleCatalog } from './consoleCatalog'
import { toMediaUrl } from './mediaProtocol'

interface PersistedLibrary {
  version: number
  emulators: EmulatorConfig[]
  metadataSettings: MetadataSettings
  games: GameEntry[]
  lastScanAt?: string
}

const STORE_VERSION = 1

export class LocalStore {
  private state?: PersistedLibrary
  private readonly filePath: string

  constructor() {
    this.filePath = join(app.getPath('userData'), 'library.json')
  }

  async load(): Promise<PersistedLibrary> {
    if (this.state) return this.state

    try {
      const raw = await readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(raw) as PersistedLibrary
      this.state = this.hydrate(parsed)
    } catch {
      this.state = this.createInitialState()
      await this.save()
    }

    return this.state
  }

  async save(): Promise<void> {
    if (!this.state) return
    await mkdir(dirname(this.filePath), { recursive: true })
    const tempPath = `${this.filePath}.tmp`
    await writeFile(tempPath, `${JSON.stringify(this.state, null, 2)}\n`, 'utf8')
    await rename(tempPath, this.filePath)
  }

  async getSnapshot(): Promise<LibrarySnapshot> {
    const state = await this.load()
    const realGames = state.games.filter((game) => game.source === 'scan')
    const consolesWithRealGames = new Set(realGames.map((game) => game.consoleId))
    const sampleGames = consoleCatalog.flatMap((consoleDef) =>
      consolesWithRealGames.has(consoleDef.id) ? [] : createSampleGames(consoleDef.id)
    )
    const games = [...realGames, ...sampleGames].map((game) => ({
      ...game,
      coverUrl: toMediaUrl(game.coverPath)
    }))

    const configuredConsoles = state.emulators.filter(
      (config) => Boolean(config.executablePath) || Boolean(config.romFolderPath)
    ).length
    const favorites = games.filter((game) => game.favorite)
    const recentlyPlayed = games
      .filter((game) => Boolean(game.lastPlayed))
      .sort((a, b) => new Date(b.lastPlayed ?? 0).getTime() - new Date(a.lastPlayed ?? 0).getTime())
      .slice(0, 18)

    return {
      consoles: consoleCatalog,
      emulators: state.emulators,
      metadataSettings: toPublicMetadataSettings(state.metadataSettings),
      games,
      favorites,
      recentlyPlayed,
      lastScanAt: state.lastScanAt,
      sampleMode: realGames.length === 0,
      stats: {
        totalGames: realGames.length,
        configuredConsoles,
        favoriteCount: realGames.filter((game) => game.favorite).length,
        recentlyPlayedCount: recentlyPlayed.filter((game) => game.source === 'scan').length
      }
    }
  }

  async getEmulatorConfig(consoleId: ConsoleId): Promise<EmulatorConfig | undefined> {
    const state = await this.load()
    return state.emulators.find((config) => config.consoleId === consoleId)
  }

  async saveEmulatorConfig(config: EmulatorConfig): Promise<void> {
    const state = await this.load()
    const existingIndex = state.emulators.findIndex((item) => item.consoleId === config.consoleId)
    const cleanConfig = normalizeConfig(config)

    if (existingIndex >= 0) {
      state.emulators[existingIndex] = cleanConfig
    } else {
      state.emulators.push(cleanConfig)
    }

    await this.save()
  }

  async saveEmulatorConfigs(configs: EmulatorConfig[]): Promise<void> {
    const state = await this.load()
    const byConsole = new Map(state.emulators.map((config) => [config.consoleId, config]))

    for (const config of configs) {
      byConsole.set(config.consoleId, normalizeConfig({ ...byConsole.get(config.consoleId), ...config }))
    }

    state.emulators = consoleCatalog.map((consoleDef) =>
      byConsole.get(consoleDef.id) ?? createDefaultConfig(consoleDef.id)
    )
    await this.save()
  }

  async getMetadataSettings(): Promise<MetadataSettings> {
    const state = await this.load()
    return state.metadataSettings
  }

  async saveMetadataSettings(settings: MetadataSettings): Promise<void> {
    const state = await this.load()
    state.metadataSettings = mergeMetadataSettings(state.metadataSettings, settings)
    await this.save()
  }

  async replaceScannedGames(consoleId: ConsoleId, games: GameEntry[]): Promise<void> {
    const state = await this.load()
    const existingByRomPath = new Map(
      state.games
        .filter((game) => game.consoleId === consoleId && game.source === 'scan')
        .map((game) => [game.romPath.toLowerCase(), game])
    )

    const mergedGames = games.map((game) => {
      const existing = existingByRomPath.get(game.romPath.toLowerCase())
      return {
        ...game,
        favorite: existing?.favorite ?? game.favorite,
        playCount: existing?.playCount ?? game.playCount,
        lastPlayed: existing?.lastPlayed,
        addedAt: existing?.addedAt ?? game.addedAt
      }
    })

    state.games = [
      ...state.games.filter((game) => game.consoleId !== consoleId || game.source !== 'scan'),
      ...mergedGames
    ]
    state.lastScanAt = new Date().toISOString()
    await this.save()
  }

  async touchLaunch(gameId: string): Promise<GameEntry | undefined> {
    const state = await this.load()
    const game = state.games.find((item) => item.id === gameId && item.source === 'scan')

    if (!game) return undefined

    game.playCount += 1
    game.lastPlayed = new Date().toISOString()
    game.updatedAt = game.lastPlayed
    await this.save()
    return game
  }

  async toggleFavorite(gameId: string): Promise<void> {
    const state = await this.load()
    const game = state.games.find((item) => item.id === gameId && item.source === 'scan')

    if (!game) return

    game.favorite = !game.favorite
    game.updatedAt = new Date().toISOString()
    await this.save()
  }

  async setGameCover(gameId: string, coverPath: string): Promise<void> {
    const state = await this.load()
    const game = state.games.find((item) => item.id === gameId && item.source === 'scan')

    if (!game) return

    game.coverPath = coverPath
    game.updatedAt = new Date().toISOString()
    await this.save()
  }

  async getGame(gameId: string): Promise<GameEntry | undefined> {
    const state = await this.load()
    return state.games.find((game) => game.id === gameId)
  }

  private createInitialState(): PersistedLibrary {
    return {
      version: STORE_VERSION,
      emulators: consoleCatalog.map((consoleDef) => createDefaultConfig(consoleDef.id)),
      metadataSettings: createDefaultMetadataSettings(),
      games: []
    }
  }

  private hydrate(state: PersistedLibrary): PersistedLibrary {
    const byConsole = new Map(state.emulators?.map((config) => [config.consoleId, config]) ?? [])
    return {
      version: STORE_VERSION,
      emulators: consoleCatalog.map((consoleDef) => {
        const existingConfig = byConsole.get(consoleDef.id)
        return normalizeConfig({
          ...createDefaultConfig(consoleDef.id),
          ...existingConfig,
          supportedExtensions: existingConfig?.supportedExtensions?.length
            ? existingConfig.supportedExtensions
            : consoleDef.romExtensions
        })
      }),
      metadataSettings: normalizeMetadataSettings(state.metadataSettings ?? createDefaultMetadataSettings()),
      games: (state.games ?? []).filter((game) => game.source === 'scan'),
      lastScanAt: state.lastScanAt
    }
  }
}

export function createDefaultMetadataSettings(): MetadataSettings {
  return {
    steamGridDb: {
      enabled: false,
      apiKey: ''
    },
    screenScraper: {
      enabled: false,
      userName: '',
      password: '',
      devId: '',
      devPassword: '',
      softName: 'RetroForge'
    },
    preferProvider: 'steamgriddb'
  }
}

export function createDefaultConfig(consoleId: ConsoleId): EmulatorConfig {
  const consoleDef = consoleCatalog.find((item) => item.id === consoleId)
  const firstCandidate = consoleDef?.candidates[0]

  return {
    consoleId,
    emulatorName: firstCandidate?.name ?? '',
    executablePath: '',
    romFolderPath: '',
    coverFolderPath: '',
    supportedExtensions: consoleDef?.romExtensions ?? [],
    launchArguments: firstCandidate?.defaultLaunchArguments ?? '"{rom}"',
    retroArchCorePath: '',
    updatedAt: new Date().toISOString()
  }
}

function normalizeConfig(config: EmulatorConfig): EmulatorConfig {
  return {
    ...config,
    emulatorName: config.emulatorName?.trim() ?? '',
    executablePath: config.executablePath?.trim() ?? '',
    romFolderPath: config.romFolderPath?.trim() ?? '',
    coverFolderPath: config.coverFolderPath?.trim() ?? '',
    retroArchCorePath: config.retroArchCorePath?.trim() ?? '',
    launchArguments: config.launchArguments?.trim() || '"{rom}"',
    supportedExtensions: [...new Set((config.supportedExtensions ?? []).map(normalizeExtension))],
    updatedAt: new Date().toISOString()
  }
}

function normalizeMetadataSettings(settings: MetadataSettings): MetadataSettings {
  return {
    steamGridDb: {
      enabled: Boolean(settings.steamGridDb?.enabled),
      apiKey: settings.steamGridDb?.apiKey?.trim() ?? ''
    },
    screenScraper: {
      enabled: Boolean(settings.screenScraper?.enabled),
      userName: settings.screenScraper?.userName?.trim() ?? '',
      password: settings.screenScraper?.password ?? '',
      devId: settings.screenScraper?.devId?.trim() ?? '',
      devPassword: settings.screenScraper?.devPassword ?? '',
      softName: settings.screenScraper?.softName?.trim() || 'RetroForge'
    },
    preferProvider: settings.preferProvider === 'screenscraper' ? 'screenscraper' : 'steamgriddb'
  }
}

function mergeMetadataSettings(current: MetadataSettings, next: MetadataSettings): MetadataSettings {
  const normalizedNext = normalizeMetadataSettings(next)

  return {
    ...normalizedNext,
    steamGridDb: {
      ...normalizedNext.steamGridDb,
      apiKey: normalizedNext.steamGridDb.apiKey || current.steamGridDb.apiKey
    },
    screenScraper: {
      ...normalizedNext.screenScraper,
      password: normalizedNext.screenScraper.password || current.screenScraper.password,
      devPassword: normalizedNext.screenScraper.devPassword || current.screenScraper.devPassword
    }
  }
}

function toPublicMetadataSettings(settings: MetadataSettings): PublicMetadataSettings {
  return {
    steamGridDb: {
      enabled: settings.steamGridDb.enabled,
      hasApiKey: Boolean(settings.steamGridDb.apiKey)
    },
    screenScraper: {
      enabled: settings.screenScraper.enabled,
      userName: settings.screenScraper.userName,
      devId: settings.screenScraper.devId,
      softName: settings.screenScraper.softName,
      hasPassword: Boolean(settings.screenScraper.password),
      hasDevPassword: Boolean(settings.screenScraper.devPassword)
    },
    preferProvider: settings.preferProvider
  }
}

function normalizeExtension(extension: string): string {
  const cleanExtension = extension.trim().toLowerCase()
  return cleanExtension.startsWith('.') ? cleanExtension : `.${cleanExtension}`
}

function createSampleGames(consoleId: ConsoleId): GameEntry[] {
  const now = new Date().toISOString()
  const sampleTitles: Record<ConsoleId, string[]> = {
    'sega-genesis': ['Neon Hedgehog Circuit', 'Shinobi Midnight Run', 'Mega Drive Rally'],
    snes: ['Starfall Valley', 'Mode Seven Grand Prix', 'Chrono Garden'],
    n64: ['Polygon Kingdom 64', 'Velvet Kart Arena', 'Temple of Four Players'],
    ps1: ['Crimson Disc Odyssey', 'Wipeout Afterglow', 'Memory Card Stories'],
    gba: ['Pocket Solar Quest', 'Advance Tactics Zero', 'Ruby Metro'],
    nds: ['Dual Screen Detective', 'Stylus Garden Club', 'Midnight Picross']
  }

  return sampleTitles[consoleId].map((title, index) => ({
    id: `sample:${consoleId}:${index}`,
    consoleId,
    title,
    fileName: `${title}.sample`,
    romPath: '',
    extension: '.sample',
    favorite: index === 0,
    playCount: index === 1 ? 2 : 0,
    lastPlayed: index === 1 ? now : undefined,
    addedAt: now,
    updatedAt: now,
    source: 'sample'
  }))
}
