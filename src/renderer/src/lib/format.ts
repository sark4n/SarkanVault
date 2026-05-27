import type { ConsoleDefinition, ConsoleId, EmulatorConfig, GameEntry } from '@shared/types'

export function getConsole(consoles: ConsoleDefinition[], consoleId: ConsoleId): ConsoleDefinition {
  return consoles.find((consoleDef) => consoleDef.id === consoleId) ?? consoles[0]
}

export function getEmulator(emulators: EmulatorConfig[], consoleId: ConsoleId): EmulatorConfig | undefined {
  return emulators.find((emulator) => emulator.consoleId === consoleId)
}

export function formatDate(value?: string): string {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

export function shortPath(value?: string, maxLength = 64): string {
  if (!value) return 'Not configured'
  if (value.length <= maxLength) return value
  return `...${value.slice(value.length - maxLength)}`
}

export function groupByConsole(games: GameEntry[]): Map<ConsoleId, GameEntry[]> {
  return games.reduce((map, game) => {
    const current = map.get(game.consoleId) ?? []
    current.push(game)
    map.set(game.consoleId, current)
    return map
  }, new Map<ConsoleId, GameEntry[]>())
}

export function sortGames(games: GameEntry[], sortMode: string): GameEntry[] {
  const sortedGames = [...games]

  if (sortMode === 'recent') {
    return sortedGames.sort((a, b) => new Date(b.lastPlayed ?? 0).getTime() - new Date(a.lastPlayed ?? 0).getTime())
  }

  if (sortMode === 'plays') {
    return sortedGames.sort((a, b) => b.playCount - a.playCount || a.title.localeCompare(b.title))
  }

  return sortedGames.sort((a, b) => a.title.localeCompare(b.title))
}

export function isConfigured(config?: EmulatorConfig): boolean {
  return Boolean(config?.romFolderPath || config?.executablePath)
}
