import { createHash } from 'node:crypto'
import { opendir, readFile, stat } from 'node:fs/promises'
import { extname, join, parse } from 'node:path'
import type { ConsoleId, EmulatorConfig, GameEntry, ScanSummary } from '../../shared/types'
import { LocalStore } from './localStore'

const coverExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const pcExtensionRank: Record<string, number> = {
  '.acf': 60,
  '.url': 50,
  '.lnk': 40,
  '.exe': 30,
  '.bat': 20,
  '.cmd': 20
}

export class RomScanner {
  constructor(private readonly store: LocalStore) {}

  async scanAll(): Promise<ScanSummary> {
    const state = await this.store.load()
    const summaries: ScanSummary['consoles'] = []
    let totalGames = 0

    for (const config of state.emulators) {
      const summary = await this.scanConsole(config)
      summaries.push(summary)
      totalGames += summary.totalGames
    }

    return {
      scannedAt: new Date().toISOString(),
      totalGames,
      consoles: summaries
    }
  }

  async rescanLocalCovers(consoleId?: ConsoleId): Promise<void> {
    const state = await this.store.load()
    const configs = consoleId
      ? state.emulators.filter((c) => c.consoleId === consoleId)
      : state.emulators

    for (const config of configs) {
      if (!config.coverFolderPath) continue
      const coverIndex = await buildCoverIndex(config.coverFolderPath)

      const gamesToUpdate = state.games.filter(
        (game) => game.consoleId === config.consoleId && game.source === 'scan' && !game.coverPath
      )

      for (const game of gamesToUpdate) {
        const romBaseName = parse(game.fileName).name
        const coverPath = findCoverForRom(romBaseName, coverIndex)
        if (coverPath) {
          await this.store.setGameCover(game.id, coverPath)
        }
      }
    }
  }

  private async scanConsole(config: EmulatorConfig): Promise<ScanSummary['consoles'][number]> {
    if (config.consoleId === 'pc') {
      return this.scanPcLibrary(config)
    }

    const warnings: string[] = []

    if (!config.romFolderPath) {
      return {
        consoleId: config.consoleId,
        romFolderPath: '',
        totalGames: 0,
        warnings: ['No ROM folder configured.']
      }
    }

    if (!(await pathExists(config.romFolderPath))) {
      return {
        consoleId: config.consoleId,
        romFolderPath: config.romFolderPath,
        totalGames: 0,
        warnings: ['Configured ROM folder was not found.']
      }
    }

    const supportedExtensions = new Set(config.supportedExtensions.map((extension) => extension.toLowerCase()))
    const romFiles = await collectFiles(config.romFolderPath, (entryPath) =>
      supportedExtensions.has(extname(entryPath).toLowerCase())
    )
    const coverIndex = config.coverFolderPath ? await buildCoverIndex(config.coverFolderPath) : new Map<string, string>()
    const now = new Date().toISOString()
    const games: GameEntry[] = romFiles.map((romPath) => {
      const parsed = parse(romPath)
      const title = cleanTitle(parsed.name)
      const coverPath = findCoverForRom(parsed.name, coverIndex)

      return {
        id: createGameId(config.consoleId, romPath),
        consoleId: config.consoleId,
        title,
        fileName: parsed.base,
        romPath,
        extension: parsed.ext.toLowerCase(),
        coverPath,
        favorite: false,
        playCount: 0,
        addedAt: now,
        updatedAt: now,
        source: 'scan' as const
      }
    })

    await this.store.replaceScannedGames(config.consoleId, games)

    return {
      consoleId: config.consoleId,
      romFolderPath: config.romFolderPath,
      totalGames: games.length,
      warnings
    }
  }

  private async scanPcLibrary(config: EmulatorConfig): Promise<ScanSummary['consoles'][number]> {
    const warnings: string[] = []

    if (!config.romFolderPath) {
      return {
        consoleId: config.consoleId,
        romFolderPath: '',
        totalGames: 0,
        warnings: ['No PC games folder configured.']
      }
    }

    if (!(await pathExists(config.romFolderPath))) {
      return {
        consoleId: config.consoleId,
        romFolderPath: config.romFolderPath,
        totalGames: 0,
        warnings: ['Configured PC games folder was not found.']
      }
    }

    const supportedExtensions = new Set(config.supportedExtensions.map((extension) => extension.toLowerCase()))
    const launchFiles = await collectFiles(config.romFolderPath, (entryPath) =>
      supportedExtensions.has(extname(entryPath).toLowerCase())
    )
    const coverIndex = config.coverFolderPath ? await buildCoverIndex(config.coverFolderPath) : new Map<string, string>()
    const now = new Date().toISOString()
    const entries = await Promise.all(launchFiles.map((launchPath) => createPcGameEntry(config, launchPath, coverIndex, now)))
    const games = dedupePcGames(entries.filter((game): game is GameEntry => Boolean(game)))

    if (!games.length && launchFiles.length) {
      warnings.push('Only helper executables or unsupported PC launch entries were found.')
    }

    await this.store.replaceScannedGames(config.consoleId, games)

    return {
      consoleId: config.consoleId,
      romFolderPath: config.romFolderPath,
      totalGames: games.length,
      warnings
    }
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath)
    return true
  } catch {
    return false
  }
}

async function collectFiles(root: string, predicate: (filePath: string) => boolean): Promise<string[]> {
  const files: string[] = []
  const stack = [root]

  while (stack.length) {
    const currentDirectory = stack.pop()
    if (!currentDirectory) continue

    let directory
    try {
      directory = await opendir(currentDirectory)
    } catch {
      continue
    }

    for await (const entry of directory) {
      const entryPath = join(currentDirectory, entry.name)

      if (entry.isDirectory()) {
        stack.push(entryPath)
      } else if (entry.isFile() && predicate(entryPath)) {
        files.push(entryPath)
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}

async function buildCoverIndex(coverFolderPath: string): Promise<Map<string, string>> {
  if (!(await pathExists(coverFolderPath))) return new Map()

  const coverFiles = await collectFiles(coverFolderPath, (filePath) => coverExtensions.has(extname(filePath).toLowerCase()))
  const coverIndex = new Map<string, string>()

  for (const coverPath of coverFiles) {
    const baseName = parse(coverPath).name
    coverIndex.set(normalizeName(baseName), coverPath)
  }

  return coverIndex
}

function findCoverForRom(romBaseName: string, coverIndex: Map<string, string>): string | undefined {
  const normalizedRomName = normalizeName(romBaseName)
  if (coverIndex.has(normalizedRomName)) return coverIndex.get(normalizedRomName)

  for (const [coverName, coverPath] of coverIndex.entries()) {
    if (coverName.includes(normalizedRomName) || normalizedRomName.includes(coverName)) {
      return coverPath
    }
  }

  return undefined
}

function cleanTitle(fileName: string): string {
  return fileName
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeName(value: string): string {
  return cleanTitle(value).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function createGameId(consoleId: ConsoleId, romPath: string): string {
  return `${consoleId}:${createHash('sha1').update(romPath.toLowerCase()).digest('hex')}`
}

async function createPcGameEntry(
  config: EmulatorConfig,
  launchPath: string,
  coverIndex: Map<string, string>,
  now: string
): Promise<GameEntry | undefined> {
  const parsed = parse(launchPath)
  const extension = parsed.ext.toLowerCase()

  if (extension === '.exe' && isIgnoredPcExecutable(launchPath)) {
    return undefined
  }

  let title = cleanPcTitle(parsed.name)
  let launchUrl: string | undefined

  if (extension === '.acf') {
    const steamEntry = await readSteamAppManifest(launchPath)
    if (!steamEntry) return undefined
    title = steamEntry.name
    launchUrl = `steam://rungameid/${steamEntry.appId}`
  } else if (extension === '.url') {
    launchUrl = await readInternetShortcutUrl(launchPath)
  }

  const coverPath = findCoverForRom(title, coverIndex) ?? findCoverForRom(parsed.name, coverIndex)
  const idSource = launchUrl ?? launchPath

  return {
    id: createGameId(config.consoleId, idSource),
    consoleId: config.consoleId,
    title,
    fileName: parsed.base,
    romPath: launchPath,
    launchUrl,
    extension,
    coverPath,
    favorite: false,
    playCount: 0,
    addedAt: now,
    updatedAt: now,
    source: 'scan' as const
  }
}

function cleanPcTitle(fileName: string): string {
  const title = cleanTitle(fileName)
    .replace(/\b(win32|win64|x86|x64|shipping|launcher|start|client)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return title || cleanTitle(fileName)
}

function isIgnoredPcExecutable(filePath: string): boolean {
  const normalizedPath = filePath.toLowerCase().replace(/\//g, '\\')
  const ignoredSegments = [
    '\\_commonredist\\',
    '\\redist\\',
    '\\redistributable\\',
    '\\directx\\',
    '\\vcredist\\',
    '\\support\\',
    '\\installer\\',
    '\\installers\\',
    '\\tools\\',
    '\\crashreporter\\',
    '\\easyanticheat\\',
    '\\battleye\\',
    '\\.egstore\\'
  ]

  if (ignoredSegments.some((segment) => normalizedPath.includes(segment))) {
    return true
  }

  const executableName = parse(filePath).base.toLowerCase()
  return /^(unins|uninstall|install|setup|dxsetup|vc_redist|vcredist|dotnet|unitycrashhandler|crashreport|crashpad|ue4prereq)/i.test(
    executableName
  )
}

async function readSteamAppManifest(filePath: string): Promise<{ appId: string; name: string } | undefined> {
  try {
    const raw = await readFile(filePath, 'utf8')
    const appId = getValveKeyValue(raw, 'appid') ?? parse(filePath).name.replace(/^appmanifest_/i, '')
    const name = getValveKeyValue(raw, 'name')

    if (!appId || !name) return undefined
    return { appId, name: cleanPcTitle(name) }
  } catch {
    return undefined
  }
}

async function readInternetShortcutUrl(filePath: string): Promise<string | undefined> {
  try {
    const raw = await readFile(filePath, 'utf8')
    const match = raw.match(/^URL=(.+)$/im)
    return match?.[1]?.trim()
  } catch {
    return undefined
  }
}

function getValveKeyValue(raw: string, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = raw.match(new RegExp(`"${escapedKey}"\\s+"([^"]+)"`, 'i'))
  return match?.[1]?.trim()
}

function dedupePcGames(games: GameEntry[]): GameEntry[] {
  const byTitle = new Map<string, GameEntry>()

  for (const game of games) {
    const key = normalizeName(game.title)
    const existing = byTitle.get(key)

    if (!existing || getPcEntryRank(game) > getPcEntryRank(existing)) {
      byTitle.set(key, game)
    }
  }

  return [...byTitle.values()].sort((a, b) => a.title.localeCompare(b.title))
}

function getPcEntryRank(game: GameEntry): number {
  const launchUrlBonus = game.launchUrl ? 5 : 0
  return (pcExtensionRank[game.extension] ?? 0) + launchUrlBonus
}
