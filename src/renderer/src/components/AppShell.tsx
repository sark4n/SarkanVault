import {
  Database,
  Gamepad2,
  House,
  RefreshCw,
  Search,
  Settings,
  Power,
  X,
  UserCircle2,
  Monitor,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LibrarySnapshot, GameEntry, ConsoleDefinition } from '@shared/types'
import type { UserProfile } from '@renderer/lib/profileStore'
import { getInitials } from '@renderer/lib/profileStore'
import {
  GamepadIndicator,
  GamepadHotplugOverlay,
  GamepadHintBar,
} from '@renderer/components/GamepadIndicator'
import { useConsoleMode } from '@renderer/hooks/useConsoleMode'
import { useGamepad } from '@renderer/hooks/useGamepad'

const windowControls = window.windowControls

interface AppShellProps {
  snapshot?: LibrarySnapshot
  activeView: string
  isBusy: boolean
  profile: UserProfile
  onHome: () => void
  onSearch: () => void
  onSettings: () => void
  onProfile: () => void
  onScan: () => void
  onSwitchProfile: () => void
  children: React.ReactNode
}

export function AppShell({
  snapshot,
  activeView,
  isBusy,
  profile,
  onHome,
  onSearch,
  onSettings,
  onProfile,
  onScan,
  onSwitchProfile,
  children,
}: AppShellProps): JSX.Element {
  const [menuOpen, setMenuOpen]           = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [titleOpacity, setTitleOpacity]   = useState(1)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [searchOpen, setSearchOpen]       = useState(false)
  const [searchQuery, setSearchQuery]     = useState('')

  const menuRef        = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const searchRef      = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const consoleMode = useConsoleMode()
  const { connected: gamepads, isActive: gamepadActive } = useGamepad()
  const hasGamepad = gamepads.length > 0

  const allGames: GameEntry[]            = snapshot?.games    ?? []
  const allConsoles: ConsoleDefinition[] = snapshot?.consoles ?? []

  const searchResults = searchQuery.trim().length >= 1
    ? allGames.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 12)
    : []

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) { setShowExitConfirm(false); return }
        if (searchOpen) { setSearchOpen(false); setSearchQuery(''); return }
        if (profileMenuOpen) { setProfileMenuOpen(false); return }
        if (menuOpen) { setMenuOpen(false); return }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [menuOpen, profileMenuOpen, searchOpen, showExitConfirm])

  // ── Close dropdowns on outside click ───────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  useEffect(() => {
    if (!profileMenuOpen) return
    const h = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [profileMenuOpen])

  useEffect(() => {
    if (!searchOpen) return
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false); setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [searchOpen])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60)
  }, [searchOpen])

  // ── Scroll: fade title ──────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setTitleOpacity(Math.max(0, 1 - window.scrollY / 140))
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const handleClose = useCallback(() => { windowControls?.close().catch(() => {}) }, [])

  const getConsoleName = (id: string) => {
    const c = allConsoles.find(c => c.id === id)
    return c?.shortName ?? c?.name ?? id
  }

  const hintBarHints = [
    { button: 'A' as const, label: 'Seleccionar' },
    { button: 'B' as const, label: 'Volver'      },
    { button: 'X' as const, label: 'Favorito'    },
    { button: 'Y' as const, label: 'Opciones'    },
    { button: 'LB' as const, label: 'Inicio'     },
    { button: 'RB' as const, label: 'Buscar'     },
  ]

  return (
    <div className={`min-h-screen bg-night text-white ${consoleMode.enabled ? 'console-mode-active' : ''}`}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,79,139,0.16),transparent_28%),linear-gradient(240deg,rgba(92,242,196,0.14),transparent_26%),radial-gradient(circle_at_50%_-20%,rgba(247,214,91,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,13,0.2),#07080d_72%)]" />
      </div>

      {/* ── Top-right: Search + Profile ── */}
      <div className="fixed right-6 top-6 z-40 flex items-center gap-2">

        {/* Search button + panel */}
        <div ref={searchRef} className="relative">
          <button
            type="button"
            onClick={() => { setSearchOpen(s => !s); setSearchQuery('') }}
            className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xl border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-mint ${
              searchOpen
                ? 'bg-mint text-night border-mint/50'
                : 'bg-black/50 text-white/70 border-white/10 hover:bg-white/10 hover:text-white backdrop-blur-sm'
            }`}
            title="Buscar (Ctrl+F)"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Search panel */}
          <div
            className={`absolute right-0 top-14 w-96 transition-all duration-300 origin-top-right ${
              searchOpen
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="rounded-2xl border border-white/10 bg-black/85 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                <Search className="h-4 w-4 text-white/40 flex-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar juegos..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white/60 transition">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {searchQuery.trim().length >= 1 ? (
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-white/40">
                      Sin resultados para "{searchQuery}"
                    </div>
                  ) : (
                    <ul>
                      {searchResults.map(game => (
                        <li key={game.id}>
                          <button
                            type="button"
                            onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/6 transition-colors"
                          >
                            <div className="h-11 w-11 flex-none rounded-lg overflow-hidden bg-white/5 border border-white/8">
                              {game.coverUrl
                                ? <img src={game.coverUrl} alt={game.title} className="h-full w-full object-cover" />
                                : <div className="h-full w-full flex items-center justify-center"><Gamepad2 className="h-4 w-4 text-white/20" /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{game.title}</p>
                              <p className="text-xs text-white/40 truncate">{getConsoleName(game.consoleId)}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-white/30">
                  Empieza a escribir para buscar…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile button + dropdown */}
        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(s => !s)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xl border transition-all duration-200 overflow-hidden focus-visible:ring-2 focus-visible:ring-mint ${
              profileMenuOpen
                ? 'border-mint/50 ring-2 ring-mint/30'
                : 'border-white/10 hover:border-white/25'
            }`}
            title="Perfil"
            aria-label="Perfil"
            aria-expanded={profileMenuOpen}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.nickname} className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center text-sm font-bold text-night"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {getInitials(profile.nickname)}
              </div>
            )}
          </button>

          {/* Profile dropdown */}
          <div
            className={`absolute right-0 top-14 w-52 transition-all duration-200 origin-top-right ${
              profileMenuOpen
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="rounded-2xl border border-white/10 bg-black/85 backdrop-blur-2xl shadow-2xl overflow-hidden">
              {/* Profile header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                <div
                  className="h-9 w-9 rounded-full overflow-hidden flex-none flex items-center justify-center text-xs font-bold text-night"
                  style={!profile.avatarUrl ? { backgroundColor: profile.avatarColor } : undefined}
                >
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.nickname} className="h-full w-full object-cover" />
                    : getInitials(profile.nickname)
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile.nickname}</p>
                  <p className="text-xs text-white/35 truncate">Perfil activo</p>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <ProfileMenuItem
                  icon={<UserCircle2 className="h-4 w-4" />}
                  label="Mi Perfil"
                  onClick={() => { setProfileMenuOpen(false); onProfile() }}
                />
                <ProfileMenuItem
                  icon={<Settings className="h-4 w-4" />}
                  label="Configuración"
                  onClick={() => { setProfileMenuOpen(false); onSettings() }}
                />
                <div className="my-1 mx-3 h-px bg-white/8" />
                <ProfileMenuItem
                  icon={<Monitor className="h-4 w-4" />}
                  label="Cambiar perfil"
                  onClick={() => { setProfileMenuOpen(false); onSwitchProfile() }}
                />
                <ProfileMenuItem
                  icon={<Power className="h-4 w-4" />}
                  label="Salir"
                  danger
                  onClick={() => { setProfileMenuOpen(false); setShowExitConfirm(true) }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logo / Nav Menu ── */}
      <div ref={menuRef} className="fixed left-6 top-6 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          data-focusable-id="nav-menu-toggle"
          className={`relative flex h-14 w-14 items-center justify-center rounded-xl shadow-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
            menuOpen
              ? 'bg-mint text-night rotate-180'
              : 'bg-white text-night hover:bg-mint hover:scale-110'
          }`}
          title="Menú – Sarkan Vault"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <Gamepad2 className="h-7 w-7" />
        </button>

        <h1
          className="text-2xl font-extrabold uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-purple-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-opacity duration-300 animate-shimmer"
          style={{ opacity: titleOpacity }}
        >
          SarkaN Vault
        </h1>

        {/* Dropdown */}
        <div
          className={`absolute left-0 top-20 transition-all duration-300 origin-top ${
            menuOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
          aria-hidden={!menuOpen}
        >
          <nav
            className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/60 p-2 backdrop-blur-2xl shadow-2xl"
            aria-label="Navegación principal"
          >
            {/* Inicio */}
            <NavItem active={activeView === 'home'} title="Inicio" onClick={() => { onHome(); setMenuOpen(false) }}>
              <House className="h-5 w-5" />
            </NavItem>

            {/* Biblioteca */}
            <NavItem active={activeView === 'console'} title="Biblioteca" onClick={() => { onHome(); setMenuOpen(false) }}>
              <Database className="h-5 w-5" />
            </NavItem>

            {/* Buscar */}
            <NavItem active={activeView === 'search'} title="Buscar" onClick={() => { onSearch(); setMenuOpen(false) }}>
              <Search className="h-5 w-5" />
            </NavItem>

            <div className="my-1 h-px bg-white/10" />

            {/* Escanear */}
            <NavItem title="Escanear biblioteca" onClick={() => { onScan(); setMenuOpen(false) }} busy={isBusy}>
              <RefreshCw className={`h-5 w-5 ${isBusy ? 'animate-spin' : ''}`} />
            </NavItem>

            {/* Indicador de gamepad / modo consola */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-white/6">
              {hasGamepad ? (
                <GamepadIndicator />
              ) : (
                <button
                  type="button"
                  onClick={() => { consoleMode.toggle(); setMenuOpen(false) }}
                  title={consoleMode.enabled ? 'Salir del Modo PC' : 'Modo PC'}
                  aria-label={consoleMode.enabled ? 'Salir del Modo PC' : 'Modo PC'}
                  className={`flex h-full w-full items-center justify-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
                    consoleMode.enabled ? 'text-mint' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Monitor className="h-5 w-5" />
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* ── Exit confirmation ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="relative z-10 w-80 rounded-2xl border border-white/10 bg-[#0f1018]/95 p-6 shadow-2xl backdrop-blur-2xl animate-fadeUp">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/20">
                <Power className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Salir de Sarkan Vault</h2>
                <p className="text-xs text-white/50 mt-0.5">¿Estás seguro que quieres salir?</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setShowExitConfirm(false)}
                className="flex-1 h-10 rounded-xl border border-white/10 bg-white/6 text-sm font-medium text-white/70 hover:bg-white/12 hover:text-white transition">
                Cancelar
              </button>
              <button type="button" onClick={handleClose}
                className="flex-1 h-10 rounded-xl bg-red-500/90 text-sm font-bold text-white hover:bg-red-500 transition hover:scale-105 active:scale-95 shadow-lg">
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 min-h-screen p-6 pt-24" id="main-content" role="main">
        {children}
      </main>

      <GamepadHintBar hints={hintBarHints} visible={gamepadActive && hasGamepad} />
      <GamepadHotplugOverlay />
    </div>
  )
}

// ── Nav item (logo menu) ──────────────────────────────────────────────────────

function NavItem({
  active, title, onClick, children, busy,
}: {
  active?: boolean; title: string; onClick: () => void; children: React.ReactNode; busy?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
        active ? 'bg-white text-night shadow-md scale-110' : 'bg-white/6 text-white/70 hover:bg-white/15 hover:text-white hover:scale-105'
      } ${busy ? 'opacity-70' : ''}`}
    >
      {children}
    </button>
  )
}

// ── Profile dropdown item ─────────────────────────────────────────────────────

function ProfileMenuItem({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        danger
          ? 'text-red-400/80 hover:text-red-400 hover:bg-red-500/10'
          : 'text-white/70 hover:text-white hover:bg-white/6'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
