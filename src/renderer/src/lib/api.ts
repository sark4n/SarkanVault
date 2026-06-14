import type { ConsoleDefinition, EmulatorConfig, GameEntry, LibrarySnapshot, RetroLauncherApi } from '@shared/types'

const previewConsoles: ConsoleDefinition[] = [
  {
    id: 'sega-genesis',
    name: 'Sega Genesis',
    shortName: 'Genesis',
    manufacturer: 'Sega',
    generation: '16-bit',
    description: 'Plataformas arcade, shooters y clasicos deportivos con energia FM synth nítida.',
    colorFrom: '#1f6feb',
    colorTo: '#ff4f8b',
    accent: '#66d9ff',
    romExtensions: ['.gen', '.md', '.smd', '.bin', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'snes',
    name: 'Super Nintendo',
    shortName: 'SNES',
    manufacturer: 'Nintendo',
    generation: '16-bit',
    description: 'RPGs coloridos, plataformas y clasicos multijugador con pixel art exuberante.',
    colorFrom: '#7c5cff',
    colorTo: '#5cf2c4',
    accent: '#c4b5fd',
    romExtensions: ['.smc', '.sfc', '.fig', '.swc', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'n64',
    name: 'Nintendo 64',
    shortName: 'N64',
    manufacturer: 'Nintendo',
    generation: '64-bit',
    description: 'Aventuras 3D, carreras y leyendas multijugador para cuatro controles.',
    colorFrom: '#1db954',
    colorTo: '#f7d65b',
    accent: '#8df06f',
    romExtensions: ['.z64', '.n64', '.v64', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'ps1',
    name: 'PlayStation 1',
    shortName: 'PS1',
    manufacturer: 'Sony',
    generation: '32-bit',
    description: 'RPGs de la era del disco, carreras, peleas y experimentos cinematograficos.',
    colorFrom: '#7d8597',
    colorTo: '#ff8a4c',
    accent: '#ffd166',
    romExtensions: ['.bin', '.cue', '.iso', '.chd'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'gba',
    name: 'Game Boy Advance',
    shortName: 'GBA',
    manufacturer: 'Nintendo',
    generation: 'Handheld',
    description: 'Aventuras de bolsillo con paletas brillantes y encanto de sesiones rapidas.',
    colorFrom: '#ff4f8b',
    colorTo: '#f7d65b',
    accent: '#ffb3cf',
    romExtensions: ['.gba', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'dreamcast',
    name: 'Sega Dreamcast',
    shortName: 'Dreamcast',
    manufacturer: 'Sega',
    generation: '128-bit',
    description: 'La última consola de Sega: acción 3D de culto, shooters intensos y joyas arcade únicas.',
    colorFrom: '#e05c2a',
    colorTo: '#ff9f4a',
    accent: '#ffcf86',
    romExtensions: ['.cdi', '.gdi', '.chd', '.cue', '.iso', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'gamecube',
    name: 'GameCube',
    shortName: 'GameCube',
    manufacturer: 'Nintendo',
    generation: '6th',
    description: 'La consola que trajo gráficos impresionantes y joyas como Super Smash Bros. Melee.',
    colorFrom: '#4a2c7d',
    colorTo: '#1e90ff',
    accent: '#00b7eb',
    romExtensions: ['.iso', '.gcm', '.ciso', '.gcz'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'switch',
    name: 'Nintendo Switch',
    shortName: 'Switch',
    manufacturer: 'Nintendo',
    generation: '8th Hybrid',
    description: 'La consola hibrida de Nintendo: joyas exclusivas como Breath of the Wild y Mario Odyssey.',
    colorFrom: '#e60012',
    colorTo: '#1a1a1a',
    accent: '#00d4aa',
    romExtensions: ['.nsp', '.xci', '.nsz', '.xcz'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  },
  {
    id: 'pc',
    name: 'PC Gaming',
    shortName: 'PC',
    manufacturer: 'Windows',
    generation: 'Modern',
    description: 'Juegos instalados, accesos directos y tiendas de PC en una sola biblioteca.',
    colorFrom: '#12b886',
    colorTo: '#3b82f6',
    accent: '#f59e0b',
    romExtensions: ['.exe', '.lnk', '.url', '.bat', '.cmd', '.acf'],
    imageUrl: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: []
  }
]

export const retroApi: RetroLauncherApi = window.retroLauncher ?? createPreviewApi()

function createPreviewApi(): RetroLauncherApi {
  let snapshot = createPreviewSnapshot()

  return {
    getSnapshot: async () => snapshot,
    scanLibrary: async () => ({
      snapshot,
      summary: {
        scannedAt: new Date().toISOString(),
        totalGames: 0,
        consoles: previewConsoles.map((consoleDef) => ({
          consoleId: consoleDef.id,
          romFolderPath: '',
          totalGames: 0,
          warnings: ['Browser preview mode. Run Electron for real scanning.']
        }))
      }
    }),
    detectEmulators: async () => ({ snapshot, detections: [] }),
    saveEmulator: async (config) => {
      snapshot = {
        ...snapshot,
        emulators: snapshot.emulators.map((item) => (item.consoleId === config.consoleId ? config : item))
      }
      return snapshot
    },
    chooseExecutable: async () => undefined,
    chooseImage: async () => undefined,
    chooseFolder: async () => undefined,
    saveMetadataSettings: async (settings) => {
      snapshot = {
        ...snapshot,
        metadataSettings: {
          steamGridDb: {
            enabled: settings.steamGridDb.enabled,
            hasApiKey: Boolean(settings.steamGridDb.apiKey) || snapshot.metadataSettings.steamGridDb.hasApiKey
          },
          screenScraper: {
            enabled: settings.screenScraper.enabled,
            userName: settings.screenScraper.userName,
            devId: settings.screenScraper.devId,
            softName: settings.screenScraper.softName,
            hasPassword: Boolean(settings.screenScraper.password) || snapshot.metadataSettings.screenScraper.hasPassword,
            hasDevPassword:
              Boolean(settings.screenScraper.devPassword) || snapshot.metadataSettings.screenScraper.hasDevPassword
          },
          preferProvider: settings.preferProvider
        }
      }
      return snapshot
    },
    searchCovers: async (gameId, query) => ({
      gameId,
      query: query ?? '',
      results: [],
      warnings: ['Browser preview mode cannot call online cover providers. Run Electron to search covers.']
    }),
    downloadCover: async () => ({
      snapshot,
      result: {
        ok: false,
        message: 'Browser preview mode cannot download covers. Run Electron to save artwork locally.'
      }
    }),
    downloadMissingCovers: async () => ({
      snapshot,
      summary: {
        scanned: 0,
        downloaded: 0,
        failed: 0,
        skipped: 0,
        messages: ['Browser preview mode cannot download covers.']
      }
    }),
    setLocalCover: async (gameId, filePath) => {
      snapshot = {
        ...snapshot,
        games: snapshot.games.map((game) =>
          game.id === gameId ? { ...game, coverPath: filePath, coverUrl: `preview://${filePath}` } : game
        )
      }
      return snapshot
    },
    rescanLocalCovers: async () => snapshot,
    launchGame: async () => ({
      snapshot,
      result: {
        ok: false,
        message: 'Browser preview mode cannot launch games. Run the Electron app to launch locally.'
      }
    }),
    toggleFavorite: async (gameId) => {
      snapshot = {
        ...snapshot,
        games: snapshot.games.map((game) => (game.id === gameId ? { ...game, favorite: !game.favorite } : game))
      }
      snapshot.favorites = snapshot.games.filter((game) => game.favorite)
      return snapshot
    },
    revealPath: async () => undefined
  }
}

function createPreviewSnapshot(): LibrarySnapshot {
  const now = new Date().toISOString()
  const emulators: EmulatorConfig[] = previewConsoles.map((consoleDef) => ({
    consoleId: consoleDef.id,
    emulatorName:
      consoleDef.id === 'pc'
        ? 'Lanzamiento directo'
        : consoleDef.id === 'ps1'
          ? 'DuckStation'
          : consoleDef.id === 'snes'
            ? 'Snes9x'
            : 'RetroArch',
    executablePath: '',
    romFolderPath: '',
    coverFolderPath: '',
    supportedExtensions: consoleDef.romExtensions,
    launchArguments: '"{rom}"',
    retroArchCorePath: '',
    updatedAt: now
  }))
  const games: GameEntry[] = previewConsoles.flatMap((consoleDef, consoleIndex) =>
    ['Neon Circuit', 'Midnight Quest', 'Pixel Grand Prix'].map((suffix, index) => ({
      id: `preview:${consoleDef.id}:${index}`,
      consoleId: consoleDef.id,
      title: `${consoleDef.shortName} ${suffix}`,
      fileName: `${consoleDef.shortName}-${suffix}.sample`,
      romPath: '',
      extension: '.sample',
      favorite: index === 0,
      playCount: index === 1 ? consoleIndex + 1 : 0,
      lastPlayed: index === 1 ? now : undefined,
      addedAt: now,
      updatedAt: now,
      source: 'sample' as const
    }))
  )

  return {
    consoles: previewConsoles,
    emulators,
    metadataSettings: {
      steamGridDb: {
        enabled: false,
        hasApiKey: false
      },
      screenScraper: {
        enabled: false,
        userName: '',
        devId: '',
        softName: 'Sarkan Vault',
        hasPassword: false,
        hasDevPassword: false
      },
      preferProvider: 'steamgriddb'
    },
    games,
    recentlyPlayed: games.filter((game) => game.lastPlayed),
    favorites: games.filter((game) => game.favorite),
    stats: {
      totalGames: 0,
      configuredConsoles: 0,
      favoriteCount: 0,
      recentlyPlayedCount: 0
    },
    sampleMode: true
  }
}
