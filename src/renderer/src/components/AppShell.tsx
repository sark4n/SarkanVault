import { Database, Gamepad2, Maximize2, Minus, Chrome as Home, RefreshCw, Search, Settings, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { LibrarySnapshot } from '@shared/types'

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
  snapshot,
  activeView,
  isBusy,
  onHome,
  onSearch,
  onSettings,
  onScan,
  children
}: AppShellProps): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!windowControls) return
    windowControls.isMaximized().then(setIsMaximized).catch(() => {})
    const unsubscribe = windowControls.onMaximizeChange(setIsMaximized)
    return unsubscribe
  }, [])

  const handleMinimize = useCallback(() => { windowControls?.minimize().catch(() => {}) }, [])
  const handleMaximize = useCallback(() => { windowControls?.maximize().catch(() => {}) }, [])
  const handleClose = useCallback(() => { windowControls?.close().catch(() => {}) }, [])

  return (
    <div className="min-h-screen bg-night text-white">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,79,139,0.16),transparent_28%),linear-gradient(240deg,rgba(92,242,196,0.14),transparent_26%),radial-gradient(circle_at_50%_-20%,rgba(247,214,91,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,13,0.2),#07080d_72%)]" />
      </div>

      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-end gap-0 px-2 py-2" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button type="button" onClick={handleMinimize} className="inline-flex h-8 w-8 items-center justify-center rounded text-white/50 transition hover:bg-white/10 hover:text-white" title="Minimizar">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleMaximize} className="inline-flex h-8 w-8 items-center justify-center rounded text-white/50 transition hover:bg-white/10 hover:text-white" title={isMaximized ? 'Restaurar' : 'Maximizar'}>
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={handleClose} className="inline-flex h-8 w-8 items-center justify-center rounded text-white/50 transition hover:bg-red-500/80 hover:text-white" title="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[92px] border-r border-white/8 bg-black/20 backdrop-blur-2xl lg:block">
        <div className="flex h-full flex-col items-center py-7">
          <button
            type="button"
            onClick={onHome}
            className="mb-10 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-night shadow-glow"
            title="Inicio"
          >
            <Gamepad2 className="h-6 w-6" />
          </button>
          <nav className="flex flex-1 flex-col gap-4">
            <NavIcon active={activeView === 'home'} title="Inicio" onClick={onHome}>
              <Home className="h-5 w-5" />
            </NavIcon>
            <NavIcon active={activeView === 'console'} title="Biblioteca" onClick={onHome}>
              <Database className="h-5 w-5" />
            </NavIcon>
            <NavIcon active={activeView === 'search'} title="Buscar" onClick={onSearch}>
              <Search className="h-5 w-5" />
            </NavIcon>
            <NavIcon active={activeView === 'settings'} title="Configuración" onClick={onSettings}>
              <Settings className="h-5 w-5" />
            </NavIcon>
          </nav>
          <button
            type="button"
            onClick={onScan}
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/7 text-white/78 transition hover:bg-white/12"
            title="Escanear biblioteca"
          >
            <RefreshCw className={`h-5 w-5 ${isBusy ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </aside>

      <main className="relative z-10 min-h-screen px-5 pb-14 pt-12 lg:pl-[124px] lg:pr-8">
        <header className="mb-8 flex items-center gap-5 rounded-lg border border-white/8 bg-white/[0.045] px-5 py-4 backdrop-blur-2xl">
          <button type="button" onClick={onHome} className="flex shrink-0 items-center gap-4 text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-night">
              <Gamepad2 className="h-6 w-6" />
            </span>
            <span className="hidden sm:block">
              <span className="block font-display text-xl font-bold text-white">Sarkan Vault</span>
              <span className="block truncate text-xs font-semibold uppercase text-white/48">
                Centro de juegos de Leo y Edi
              </span>
            </span>
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onSearch}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition ${activeView === 'search' ? 'bg-white text-night' : 'bg-white/8 text-white hover:bg-white/14'}`}
            title="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onSettings}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/8 text-white transition hover:bg-white/14"
            title="Configuración"
          >
            <Settings className="h-4 w-4" />
          </button>
        </header>

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
      className={`flex h-12 w-12 items-center justify-center rounded-lg transition ${
        active ? 'bg-white text-night' : 'border border-white/10 bg-white/7 text-white/58 hover:bg-white/12 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
