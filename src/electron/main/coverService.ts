import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join, parse } from 'node:path'
import { app } from 'electron'
import type {
  ConsoleId,
  CoverDownloadResult,
  CoverProviderId,
  CoverSearchResponse,
  CoverSearchResult,
  GameEntry,
  MetadataSettings,
  MissingCoverSummary
} from '../../shared/types'
import { LocalStore } from './localStore'

const steamGridDbBaseUrl = 'https://www.steamgriddb.com/api/v2'
const screenScraperBaseUrl = 'https://www.screenscraper.fr/api2/jeuInfos.php'
const acceptedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const screenScraperSystemIds: Record<ConsoleId, number> = {
  'sega-genesis': 1,
  snes: 4,
  n64: 14,
  ps1: 57,
  gba: 12,
  nds: 15
}

export class CoverService {
  constructor(private readonly store: LocalStore) {}

  async search(gameId: string, query?: string): Promise<CoverSearchResponse> {
    const game = await this.store.getGame(gameId)
    const settings = await this.store.getMetadataSettings()
    const warnings: string[] = []

    if (!game || game.source !== 'scan') {
      return {
        gameId,
        query: query ?? '',
        results: [],
        warnings: ['Online cover search is available after scanning real ROM files.']
      }
    }

    const searchQuery = normalizeGameTitle(query || game.title || parse(game.fileName).name)
    const providerOrder = getProviderOrder(settings)
    const results: CoverSearchResult[] = []

    for (const provider of providerOrder) {
      try {
        if (provider === 'steamgriddb') {
          results.push(...(await this.searchSteamGridDb(game, searchQuery, settings)))
        } else {
          results.push(...(await this.searchScreenScraper(game, searchQuery, settings)))
        }
      } catch (error) {
        warnings.push(`${providerLabel(provider)}: ${error instanceof Error ? error.message : 'search failed'}`)
      }
    }

    if (!providerOrder.length) {
      warnings.push('No online cover providers are enabled yet.')
    }

    return {
      gameId,
      query: searchQuery,
      results: dedupeResults(results).slice(0, 30),
      warnings
    }
  }

  async download(gameId: string, result: CoverSearchResult): Promise<CoverDownloadResult> {
    const game = await this.store.getGame(gameId)

    if (!game || game.source !== 'scan') {
      return { ok: false, message: 'Only scanned local games can receive downloaded covers.' }
    }

    if (!isHttpUrl(result.imageUrl)) {
      return { ok: false, message: 'The selected cover URL is not valid.' }
    }

    try {
      const response = await fetch(result.imageUrl)

      if (!response.ok) {
        return { ok: false, message: `Cover download failed with HTTP ${response.status}.` }
      }

      const contentType = response.headers.get('content-type') ?? ''
      const extension = extensionFromContentType(contentType) ?? extensionFromUrl(result.imageUrl)

      if (!extension || !acceptedImageExtensions.has(extension)) {
        return { ok: false, message: 'The downloaded file is not a supported image type.' }
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      if (!buffer.length) {
        return { ok: false, message: 'The downloaded cover was empty.' }
      }

      const targetFolder = await getCoverTargetFolder(this.store, game)
      await mkdir(targetFolder, { recursive: true })
      const coverPath = join(targetFolder, `${safeFileName(parse(game.fileName).name || game.title)}${extension}`)
      await writeFile(coverPath, buffer)
      await this.store.setGameCover(game.id, coverPath)

      return {
        ok: true,
        message: `Cover saved from ${result.providerName}.`,
        coverPath
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Cover download failed.'
      }
    }
  }

  async downloadMissing(consoleId?: ConsoleId, limit = 25): Promise<MissingCoverSummary> {
    const state = await this.store.load()
    const games = state.games
      .filter((game) => game.source === 'scan')
      .filter((game) => !consoleId || game.consoleId === consoleId)
      .filter((game) => !game.coverPath)
      .slice(0, Math.max(1, Math.min(limit, 100)))

    const summary: MissingCoverSummary = {
      scanned: games.length,
      downloaded: 0,
      failed: 0,
      skipped: 0,
      messages: []
    }

    for (const game of games) {
      const searchResponse = await this.search(game.id)
      const bestMatch = searchResponse.results[0]

      if (!bestMatch) {
        summary.skipped += 1
        summary.messages.push(`${game.title}: no cover found.`)
        continue
      }

      const downloadResult = await this.download(game.id, bestMatch)

      if (downloadResult.ok) {
        summary.downloaded += 1
      } else {
        summary.failed += 1
        summary.messages.push(`${game.title}: ${downloadResult.message}`)
      }
    }

    return summary
  }

  private async searchSteamGridDb(
    game: GameEntry,
    query: string,
    settings: MetadataSettings
  ): Promise<CoverSearchResult[]> {
    if (!settings.steamGridDb.enabled || !settings.steamGridDb.apiKey) return []

    const gameMatches = await fetchJson<SteamGridDbSearchResponse>(
      `${steamGridDbBaseUrl}/search/autocomplete/${encodeURIComponent(query)}`,
      {
        Authorization: `Bearer ${settings.steamGridDb.apiKey}`
      }
    )

    const matches = gameMatches.data?.slice(0, 4) ?? []
    const allResults: CoverSearchResult[] = []

    for (const match of matches) {
      const gridUrl = new URL(`${steamGridDbBaseUrl}/grids/game/${match.id}`)
      gridUrl.searchParams.set('dimensions', '600x900,342x482,660x930')
      gridUrl.searchParams.set('mimes', 'image/png,image/jpeg,image/webp')
      gridUrl.searchParams.set('types', 'static')
      gridUrl.searchParams.set('nsfw', 'false')
      gridUrl.searchParams.set('humor', 'false')
      gridUrl.searchParams.set('epilepsy', 'false')
      gridUrl.searchParams.set('limit', '12')

      const gridResponse = await fetchJson<SteamGridDbGridResponse>(gridUrl.toString(), {
        Authorization: `Bearer ${settings.steamGridDb.apiKey}`
      })

      allResults.push(
        ...(gridResponse.data ?? []).map((grid) => ({
          id: `steamgriddb:${match.id}:${grid.id}`,
          provider: 'steamgriddb' as const,
          providerName: 'SteamGridDB',
          gameTitle: match.name,
          imageUrl: grid.url,
          thumbUrl: grid.thumb || grid.url,
          score: grid.score,
          sourceGameId: String(match.id),
          metadata: {
            verified: Boolean(match.verified),
            style: grid.style ?? 'unknown',
            sourceTitle: game.title
          }
        }))
      )
    }

    return allResults.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  }

  private async searchScreenScraper(
    game: GameEntry,
    query: string,
    settings: MetadataSettings
  ): Promise<CoverSearchResult[]> {
    if (
      !settings.screenScraper.enabled ||
      !settings.screenScraper.userName ||
      !settings.screenScraper.password ||
      !settings.screenScraper.devId ||
      !settings.screenScraper.devPassword
    ) {
      return []
    }

    const systemId = screenScraperSystemIds[game.consoleId]
    const url = new URL(screenScraperBaseUrl)
    url.searchParams.set('devid', settings.screenScraper.devId)
    url.searchParams.set('devpassword', settings.screenScraper.devPassword)
    url.searchParams.set('ssid', settings.screenScraper.userName)
    url.searchParams.set('sspassword', settings.screenScraper.password)
    url.searchParams.set('softname', settings.screenScraper.softName || 'RetroForge')
    url.searchParams.set('output', 'json')
    url.searchParams.set('romtype', 'rom')
    url.searchParams.set('romnom', game.fileName || query)
    url.searchParams.set('systemeid', String(systemId))

    const response = await fetchJson<unknown>(url.toString())
    const urls = extractScreenScraperImageUrls(response)

    return urls.slice(0, 12).map((imageUrl, index) => ({
      id: `screenscraper:${hashValue(`${game.id}:${imageUrl}`)}`,
      provider: 'screenscraper' as const,
      providerName: 'ScreenScraper',
      gameTitle: query,
      imageUrl,
      thumbUrl: imageUrl,
      score: 100 - index,
      metadata: {
        systemId
      }
    }))
  }
}

interface SteamGridDbSearchResponse {
  success: boolean
  data?: Array<{
    id: number
    name: string
    types?: string[]
    verified?: boolean
  }>
}

interface SteamGridDbGridResponse {
  success: boolean
  data?: Array<{
    id: number
    score?: number
    style?: string
    url: string
    thumb?: string
    tags?: string[]
  }>
}

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return (await response.json()) as T
}

async function getCoverTargetFolder(store: LocalStore, game: GameEntry): Promise<string> {
  const config = await store.getEmulatorConfig(game.consoleId)

  if (config?.coverFolderPath) return config.coverFolderPath
  if (game.romPath) return join(dirname(game.romPath), 'covers')

  return join(app.getPath('userData'), 'covers', game.consoleId)
}

function getProviderOrder(settings: MetadataSettings): CoverProviderId[] {
  const providers: CoverProviderId[] = []

  if (settings.preferProvider === 'screenscraper') {
    providers.push('screenscraper', 'steamgriddb')
  } else {
    providers.push('steamgriddb', 'screenscraper')
  }

  return providers.filter((provider) =>
    provider === 'steamgriddb' ? settings.steamGridDb.enabled : settings.screenScraper.enabled
  )
}

function providerLabel(provider: CoverProviderId): string {
  return provider === 'steamgriddb' ? 'SteamGridDB' : 'ScreenScraper'
}

function normalizeGameTitle(value: string): string {
  return value
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/\b(usa|europe|japan|world|rev|v\d+(\.\d+)?)\b/gi, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeResults(results: CoverSearchResult[]): CoverSearchResult[] {
  const seen = new Set<string>()
  return results.filter((result) => {
    const key = result.imageUrl.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractScreenScraperImageUrls(value: unknown): string[] {
  const urls = new Set<string>()

  function visit(node: unknown, keyHint = ''): void {
    if (!node) return

    if (typeof node === 'string') {
      if (isHttpUrl(node) && /\.(png|jpe?g|webp)(\?|$)/i.test(node) && /box|cover|media|image/i.test(keyHint)) {
        urls.add(node)
      }
      return
    }

    if (Array.isArray(node)) {
      for (const item of node) visit(item, keyHint)
      return
    }

    if (typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        visit(child, `${keyHint}.${key}`)
      }
    }
  }

  visit(value)
  return [...urls]
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function extensionFromContentType(contentType: string): string | undefined {
  if (contentType.includes('image/jpeg')) return '.jpg'
  if (contentType.includes('image/png')) return '.png'
  if (contentType.includes('image/webp')) return '.webp'
  return undefined
}

function extensionFromUrl(value: string): string | undefined {
  try {
    const extension = extname(new URL(value).pathname).toLowerCase()
    return acceptedImageExtensions.has(extension) ? extension : undefined
  } catch {
    return undefined
  }
}

function safeFileName(value: string): string {
  const cleanName = normalizeGameTitle(value).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim()
  return cleanName || `cover-${Date.now()}`
}

function hashValue(value: string): string {
  return createHash('sha1').update(value).digest('hex')
}
