import {
  Database,
  Gamepad2,
  Maximize2,
  Minimize2,
  Minus,
  Chrome as Home,
  RefreshCw,
  Search,
  Settings,
  X,
  Expand,
  Shrink,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LibrarySnapshot } from '@shared/types'
import { GamepadIndicator } from '@renderer/components/GamepadIndicator'

const windowControls = window.windowControls

const CURSOR_HIDE_DELAY = 3000

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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!windowControls) return
    windowControls.isMaximized().then(setIsMaximized).catch(() => {})
    const unsub = windowControls.onMaximizeChange(setIsMaximized)
    return unsub
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isFullscreen])

  useEffect(() => {
    const showCursor = () => {
      setCursorVisible(true)
      document.documentElement.classList.remove('cursor-hidden')
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
      cursorTimerRef.current = setTimeout(() => {
        if (document.body.classList.contains('gamepad-mode')) {
          setCursorVisible(false)
          document.documentElement.classList.add('cursor-hidden')
        }
      }, CURSOR_HIDE_DELAY)
    }
    window.addEventListener('mousemove', showCursor, { passive: true })
    return () => {
      window.removeEventListener('mousemove', showCursor)
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
    }
  }, [])

  const handleMinimize = useCallback(() => { windowControls?.minimize().catch(() => {}) }, [])
  const handleMaximize = useCallback(() => { windowControls?.maximize().catch(() => {}) }, [])
  const handleClose = useCallback(() => { windowControls?.close().catch(() => {}) }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen bg-night text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,79,139,0.16),transparent_28%),linear-gradient(240deg,rgba(92,242,196,0.14),transparent_26%),radial-gradient(circle_at_50%_-20%,rgba(247,214,91,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,13,0.2),#07080d_72%)]" />
      </div>

      {windowControls && (
        <div
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-end px-2 py-2"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button type="button" onClick={handleMinimize} className="inline-flex h-8 w-8 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white" title="Minimizar">
              <Minus className="h-4 w-4" />
            </button>
            <button type="button" onClick={handleMaximize} className="inline-flex h-8 w-8 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white" title={isMaximized ? 'Restaurar' : 'Maximizar'}>
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={handleClose} className="inline-flex h-8 w-8 items-center justify-center rounded text-white/40 transition hover:bg-red-500/80 hover:text-white" title="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 flex w-[88px] flex-col items-center border-r border-white/8 bg-black/28 py-6 backdrop-blur-2xl">
        <button
          type="button"
          onClick={onHome}
          className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-night shadow-glow transition hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          title="Inicio — Sarkan Vault"
        >
          <Gamepad2 className="h-5 w-5" />
        </button>

        <nav className="flex flex-1 flex-col gap-3" aria-label="Navegación principal">
          <NavIcon active={activeView === 'home'} title="Inicio" onClick={onHome}>
            <Home className="h-5 w-5" />
          </NavIcon>
          <NavIcon active={activeView === 'console'} title="Biblioteca" onClick={onHome}>
            <Database className="h-5 w-5" />
          </NavIcon>
          <NavIcon active={activeView === 'search'} title="Buscar (Select)" onClick={onSearch}>
            <Search className="h-5 w-5" />
          </NavIcon>
          <NavIcon active={activeView === 'settings'} title="Configuración" onClick={onSettings}>
            <Settings className="h-5 w-5" />
          </NavIcon>
        </nav>

        <div className="flex flex-col items-center gap-3 pt-4">
          <GamepadIndicator />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/6 text-white/50 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
            title={isFullscreen ? 'Salir de pantalla completa (F11)' : 'Pantalla completa (F11)'}
          >
            {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onScan}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/6 text-white/50 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
            title="Escanear biblioteca"
          >
            <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </aside>

      <main className="relative z-10 min-h-screen pl-[104px] pr-7 pt-5 pb-14">
        {children}
      </main>
    </div>
  )
}

interface NavIconProps {
  active: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}

function NavIcon({ active, title, onClick, children }: NavIconProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-11 w-11 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
        active
          ? 'bg-white text-night shadow-md'
          : 'border border-white/10 bg-white/6 text-white/52 hover:bg-white/12 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
