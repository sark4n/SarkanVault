import { createHash } from 'node:crypto'
import { Dirent } from 'node:fs'
import { opendir, readdir, stat } from 'node:fs/promises'
import { extname, join, parse } from 'node:path'
import type { ConsoleId, EmulatorConfig, GameEntry, ScanSummary } from '../../shared/types'
import { LocalStore } from './localStore'

const coverExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

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

  private async scanConsole(config: EmulatorConfig): Promise<ScanSummary['consoles'][number]> {
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
        source: 'scan'
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
