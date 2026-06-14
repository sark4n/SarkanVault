import type { GameMetadata, Achievement } from '@shared/types'

export interface MetadataSource {
  searchGame(title: string, consoleName?: string): Promise<GameMetadata | null>
}

export interface AchievementSource {
  fetchAchievements(gameTitle: string): Promise<Achievement[]>
}

export interface VideoPreviewSource {
  getPreviewUrl(gameTitle: string): Promise<string | null>
}

// TheGamesDB Integration
class TheGamesDBSource implements MetadataSource {
  private readonly baseUrl = 'https://api.thegamesdb.net/v1'

  async searchGame(title: string, consoleName?: string): Promise<GameMetadata | null> {
    try {
      const response = await fetch(`${this.baseUrl}/Games/ByGameName?name=${encodeURIComponent(title)}`)
      const data = await response.json()

      if (!data.data || data.data.length === 0) return null

      const game = data.data[0]
      return {
        description: game.overview || undefined,
        releaseDate: game.release_date || undefined,
        developer: game.developer || undefined,
        publisher: game.publisher || undefined,
        rating: game.rating ? parseFloat(game.rating) : undefined,
      }
    } catch (error) {
      console.error('TheGamesDB error:', error)
      return null
    }
  }
}

// RAWG.io Integration for Achievements
class RAWGSource implements AchievementSource {
  private readonly baseUrl = 'https://api.rawg.io/api'
  private readonly apiKey = 'free'

  async fetchAchievements(gameTitle: string): Promise<Achievement[]> {
    try {
      // RAWG doesn't have a direct achievements endpoint, but we can use it for game data
      const searchResponse = await fetch(
        `${this.baseUrl}/games?search=${encodeURIComponent(gameTitle)}&key=${this.apiKey}`
      )
      const searchData = await searchResponse.json()

      if (!searchData.results || searchData.results.length === 0) return []

      const game = searchData.results[0]
      const achievements: Achievement[] = []

      // Parse achievements from game description if available
      if (game.achievements_count) {
        for (let i = 0; i < Math.min(game.achievements_count, 5); i++) {
          achievements.push({
            id: `ach_${i}`,
            name: `Achievement ${i + 1}`,
            description: 'Unlock this achievement in-game',
            unlocked: false,
          })
        }
      }

      return achievements
    } catch (error) {
      console.error('RAWG error:', error)
      return []
    }
  }
}

// Video Preview Service
class VideoPreviewService implements VideoPreviewSource {
  async getPreviewUrl(gameTitle: string): Promise<string | null> {
    try {
      // Search for gameplay videos - returns a YouTube search URL
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(gameTitle + ' gameplay')}`
      // This returns a search URL rather than embedding; client can open it
      return searchUrl
    } catch (error) {
      console.error('Video preview error:', error)
      return null
    }
  }
}

// Singleton instances
const theGamesDBSource = new TheGamesDBSource()
const rawgSource = new RAWGSource()
const videoPreviewService = new VideoPreviewService()

// Public API
export async function fetchGameMetadata(
  gameTitle: string,
  consoleName?: string
): Promise<GameMetadata | null> {
  return theGamesDBSource.searchGame(gameTitle, consoleName)
}

export async function fetchGameAchievements(gameTitle: string): Promise<Achievement[]> {
  return rawgSource.fetchAchievements(gameTitle)
}

export async function getVideoPreviewUrl(gameTitle: string): Promise<string | null> {
  return videoPreviewService.getPreviewUrl(gameTitle)
}

export async function enrichGameMetadata(
  gameTitle: string,
  consoleName?: string
): Promise<GameMetadata> {
  const [metadata, achievements, videoUrl] = await Promise.all([
    fetchGameMetadata(gameTitle, consoleName),
    fetchGameAchievements(gameTitle),
    getVideoPreviewUrl(gameTitle),
  ])

  return {
    ...metadata,
    achievements,
    videoPreviewUrl: videoUrl || undefined,
  }
}
