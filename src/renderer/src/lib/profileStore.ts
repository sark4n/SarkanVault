// ── Profile Store — localStorage-based profile system ────────────────────────

export interface UserProfile {
  id: string
  nickname: string
  avatarUrl?: string      // URL/data-url de la foto
  avatarColor: string     // color de avatar generado si no hay foto
  createdAt: string
  recentGameIds: string[] // IDs de juegos recientes (sobrescriben los de snapshot)
  favoriteGameIds: string[]
}

const STORAGE_KEY = 'sarkanvault_profiles'
const ACTIVE_KEY  = 'sarkanvault_active_profile'

const AVATAR_COLORS = [
  '#5cf2c4', '#ff4f8b', '#f7d65b', '#818cf8', '#fb923c',
  '#34d399', '#e879f9', '#38bdf8', '#f472b6', '#a78bfa',
]

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

export function getProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile[]) : []
  } catch {
    return []
  }
}

export function saveProfiles(profiles: UserProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function createProfile(nickname: string, avatarUrl?: string): UserProfile {
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    nickname: nickname.trim() || 'Jugador',
    avatarUrl,
    avatarColor: randomColor(),
    createdAt: new Date().toISOString(),
    recentGameIds: [],
    favoriteGameIds: [],
  }
  const profiles = getProfiles()
  profiles.push(profile)
  saveProfiles(profiles)
  return profile
}

export function updateProfile(id: string, patch: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): UserProfile | null {
  const profiles = getProfiles()
  const idx = profiles.findIndex(p => p.id === id)
  if (idx === -1) return null
  profiles[idx] = { ...profiles[idx], ...patch }
  saveProfiles(profiles)
  return profiles[idx]
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id)
  saveProfiles(profiles)
  if (getActiveProfileId() === id) localStorage.removeItem(ACTIVE_KEY)
}

/** Iniciales para avatar sin foto */
export function getInitials(nickname: string): string {
  return nickname.trim().slice(0, 2).toUpperCase() || '?'
}
