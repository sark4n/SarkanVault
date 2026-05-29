import type { ConsoleDefinition, ConsoleId, EmulatorConfig, GameEntry } from '@shared/types'

export function getConsole(consoles: ConsoleDefinition[], consoleId: ConsoleId): ConsoleDefinition {
  return consoles.find((consoleDef) => consoleDef.id === consoleId) ?? consoles[0]
}

export function getEmulator(emulators: EmulatorConfig[], consoleId: ConsoleId): EmulatorConfig | undefined {
  return emulators.find((emulator) => emulator.consoleId === consoleId)
}

export function formatDate(value?: string): string {
  if (!value) return 'Nunca'
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

export function shortPath(value?: string, maxLength = 64): string {
  if (!value) return 'No configurado'
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

const genreKeywords: Record<string, string[]> = {
  Accion: ['fight', 'combat', 'beat', 'action', 'shoot', 'gun', 'weapon', 'strike', 'force', 'war', 'battle', 'ninja', 'street fighter', 'mortal kombat', 'tekken', 'dragon ball'],
  Aventuras: ['adventure', 'quest', 'zelda', 'tomb', '探索', '探索', 'link', 'dark', 'shadow', 'mystery', 'secret', 'pirate', 'indiana', 'monkey island', 'resident'],
  Rol: ['rpg', 'role', 'fantasy', 'final fantasy', 'dragon quest', 'pokemon', 'chronno', 'mana', 'earthbound', 'suikoden', 'breath of fire', 'phantasy', 'golden sun'],
  Carreras: ['racing', 'race', 'kart', 'mario kart', 'grand prix', 'need for speed', 'ridge racer', 'f-zero', 'wipeout', 'speed', 'driving', 'pilot'],
  Plataformas: ['mario', 'sonic', 'platform', 'megaman', 'rockman', 'donkey kong', 'crash', 'rayman', 'kirby', 'wario', 'yoshi', 'congo', 'bubble'],
  Puzzle: ['puzzle', 'tetris', 'dr mario', 'lumines', 'bejeweled', 'puyo', 'sokoban', 'minesweeper', 'professor layton'],
  Deportes: ['sport', 'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'fifa', 'madden', 'nba', 'winning eleven', 'pro evolution', 'iss'],
  Estrategia: ['strategy', 'tactics', 'fire emblem', 'advance wars', 'civilization', 'starcraft', 'age of empires', 'command', 'warcraft', 'ogre battle', 'shining force'],
  Pelea: ['fighter', 'fighting', 'versus', 'vs', 'king of fighters', 'samurai shodown', 'soul calibur', 'virtua fighter', 'dead or alive', 'marvel vs']
}

export function inferGenre(game: GameEntry): string {
  if (game.genre) return game.genre
  const title = game.title.toLowerCase()
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some((kw) => title.includes(kw))) return genre
  }
  return 'Otros'
}

export function groupByGenre(games: GameEntry[]): Map<string, GameEntry[]> {
  return games.reduce((map, game) => {
    const genre = inferGenre(game)
    const current = map.get(genre) ?? []
    current.push(game)
    map.set(genre, current)
    return map
  }, new Map<string, GameEntry[]>())
}

export const genreOrder = ['Accion', 'Aventuras', 'Rol', 'Plataformas', 'Carreras', 'Pelea', 'Estrategia', 'Puzzle', 'Deportes', 'Otros']

export function pickRandomRealGame(games: GameEntry[]): GameEntry | undefined {
  const realGames = games.filter((game) => game.source === 'scan' || game.source === 'sample')
  if (!realGames.length) return undefined
  return realGames[Math.floor(Math.random() * realGames.length)]
}
