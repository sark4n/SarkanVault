import {
  Database,
  Gamepad2,
  Maximize2,
  Minus,
  Chrome as Home,
  RefreshCw,
  Search,
  Settings,
  X,
  Expand,
  Shrink,
  Monitor,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LibrarySnapshot } from '@shared/types'
import { GamepadIndicator, GamepadHotplugOverlay, GamepadHintBar } from '@renderer/components/GamepadIndicator'
import { useConsoleMode } from '@renderer/hooks/useConsoleMode'
import { useGamepad } from '@renderer/hooks/useGamepad'

const windowControls = window.windowControls

interface AppShellProps {
  snapshot: LibrarySnapshot
  activeView: string
  isBusy: boolean
  onHome: () => void
  onSearch: () => void
  onSettings: () => void
  onScan: () => void
  children: React.ReactNode
}

export function AppShell({
  activeView,
  isBusy,
  onHome,
  onSearch,
  onSettings,
  onScan,
  children,
}: AppShellProps): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [titleOpacity, setTitleOpacity] = useState(1)
  const menuRef = useRef<HTMLDivElement>(null)

  const consoleMode = useConsoleMode()
  const { connected: gamepads, isActive: gamepadActive } = useGamepad()

  // ── Window controls ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!windowControls) return
    windowControls.isMaximized().then(setIsMaximized).catch(() => {})
    const unsub = windowControls.onMaximizeChange(setIsMaximized)
    return unsub
  }, [])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
        } else {
          document.exitFullscreen().catch(() => {})
        }
      }
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  // ── Close menu on outside click ─────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // ── Scroll effect for title opacity ────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const opacity = Math.max(0, 1 - window.scrollY / 140)
      setTitleOpacity(opacity)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMinimize = useCallback(() => { windowControls?.minimize().catch(() => {}) }, [])
  const handleMaximize = useCallback(() => { windowControls?.maximize().catch(() => {}) }, [])
  const handleClose    = useCallback(() => { windowControls?.close().catch(() => {}) }, [])

  const handleNavClick = (callback: () => void) => {
    callback()
    setMenuOpen(false)
  }

  // ── Gamepad hint bar hints (context-sensitive) ──────────────────────────
  const hintBarHints = [
    { button: 'A' as const,   label: 'Seleccionar' },
    { button: 'B' as const,   label: 'Volver' },
    { button: 'X' as const,   label: 'Favorito' },
    { button: 'Y' as const,   label: 'Opciones' },
    { button: 'LB' as const,  label: 'Inicio' },
    { button: 'RB' as const,  label: 'Buscar' },
  ]

  return (
    <div className={`min-h-screen bg-night text-white ${consoleMode.enabled ? 'console-mode-active' : ''}`}>
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,79,139,0.16),transparent_28%),linear-gradient(240deg,rgba(92,242,196,0.14),transparent_26%),radial-gradient(circle_at_50%_-20%,rgba(247,214,91,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,13,0.2),#07080d_72%)]" />
      </div>

      {/* Window Controls (title bar) */}
      {windowControls && (
        <div
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-end px-2 py-2"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div
            className="flex items-center"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={handleMinimize}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-mint"
              title="Minimizar"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-mint"
              title={isMaximized ? 'Restaurar' : 'Maximizar'}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-white/40 transition hover:bg-red-500/80 hover:text-white focus-visible:ring-2 focus-visible:ring-mint"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Logo / Nav Menu */}
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
          style={{ position: 'relative', zIndex: menuOpen ? 50 : 40 }}
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
          className={`absolute left-0 top-20 flex flex-col gap-2 transition-all duration-300 origin-top ${
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
            <MenuItem
              active={activeView === 'home'}
              title="Inicio"
              onClick={() => handleNavClick(onHome)}
            >
              <Home className="h-5 w-5" />
            </MenuItem>
            <MenuItem
              active={activeView === 'console'}
              title="Biblioteca"
              onClick={() => handleNavClick(onHome)}
            >
              <Database className="h-5 w-5" />
            </MenuItem>
            <MenuItem
              active={activeView === 'search'}
              title="Buscar"
              onClick={() => handleNavClick(onSearch)}
            >
              <Search className="h-5 w-5" />
            </MenuItem>
            <MenuItem
              active={activeView === 'settings'}
              title="Configuración"
              onClick={() => handleNavClick(onSettings)}
            >
              <Settings className="h-5 w-5" />
            </MenuItem>

            <div className="my-1 h-px bg-white/10" />

            {/* Fullscreen toggle */}
            <MenuItem
              title={consoleMode.isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {})
                } else {
                  document.exitFullscreen().catch(() => {})
                }
                setMenuOpen(false)
              }}
            >
              {consoleMode.isFullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
            </MenuItem>

            {/* Console Mode toggle */}
            <MenuItem
              active={consoleMode.enabled}
              title={consoleMode.enabled ? 'Salir del Modo Consola' : 'Modo Consola (Big Picture)'}
              onClick={() => { consoleMode.toggle(); setMenuOpen(false) }}
            >
              <Monitor className="h-5 w-5" />
            </MenuItem>

            {/* Scan */}
            <MenuItem
              title="Escanear biblioteca"
              onClick={() => { onScan(); setMenuOpen(false) }}
              busy={isBusy}
            >
              <RefreshCw className={`h-5 w-5 ${isBusy ? 'animate-spin' : ''}`} />
            </MenuItem>

            {/* Gamepad status */}
            <div className="flex items-center justify-center py-1">
              <GamepadIndicator />
            </div>
          </nav>

        </div>
      </div>

      {/* Main Content */}
      <main
        className="relative z-10 min-h-screen p-6 pt-24"
        id="main-content"
        role="main"
        aria-label="Contenido principal"
      >
        {children}
      </main>

      {/* Gamepad hint bar — shown when a controller is connected */}
      <GamepadHintBar
        hints={hintBarHints}
        visible={gamepadActive && gamepads.length > 0}
      />

      {/* Hot-plug toast notifications */}
      <GamepadHotplugOverlay />
    </div>
  )
}

// ── MenuItem ─────────────────────────────────────────────────────────────────

interface MenuItemProps {
  active?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
  busy?: boolean
}

function MenuItem({ active, title, onClick, children, busy }: MenuItemProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
        active
          ? 'bg-white text-night shadow-md scale-110'
          : 'bg-white/6 text-white/70 hover:bg-white/15 hover:text-white hover:scale-105'
      } ${busy ? 'opacity-70' : ''}`}
    >
      {children}
    </button>
  )
}
