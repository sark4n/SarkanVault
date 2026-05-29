import { Database, Gamepad2, Chrome as Home, RefreshCw, Search, Settings, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameEntry, LibrarySnapshot } from '@shared/types'
import { SearchDropdown } from '@renderer/components/SearchDropdown'

interface AppShellProps {
  snapshot: LibrarySnapshot
  activeView: string
  isBusy: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onHome: () => void
  onSettings: () => void
  onScan: () => void
  onSelectSearchResult: (game: GameEntry) => void
  onLaunchSearchResult: (game: GameEntry) => void
  children: React.ReactNode
}

export function AppShell({
  snapshot,
  activeView,
  isBusy,
  searchQuery,
  onSearchChange,
  onHome,
  onSettings,
  onScan,
  onSelectSearchResult,
  onLaunchSearchResult,
  children
}: AppShellProps): JSX.Element {
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const focusSearch = useCallback(() => {
    inputRef.current?.focus()
    setSearchOpen(true)
  }, [])

  const clearSearch = useCallback(() => {
    onSearchChange('')
    setSearchOpen(false)
    inputRef.current?.blur()
  }, [onSearchChange])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        focusSearch()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [focusSearch])

  return (
    <div className="min-h-screen bg-night text-white">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,79,139,0.16),transparent_28%),linear-gradient(240deg,rgba(92,242,196,0.14),transparent_26%),radial-gradient(circle_at_50%_-20%,rgba(247,214,91,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,13,0.2),#07080d_72%)]" />
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

      <main className="relative z-10 min-h-screen px-5 pb-14 pt-5 lg:pl-[124px] lg:pr-8">
        <header className="mb-8 flex items-center justify-between gap-5 rounded-lg border border-white/8 bg-white/[0.045] px-5 py-4 backdrop-blur-2xl">
          <button type="button" onClick={onHome} className="flex min-w-0 items-center gap-4 text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-night">
              <Gamepad2 className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-bold text-white">RetroForge</span>
              <span className="block truncate text-xs font-semibold uppercase text-white/48">
                Centro de comando arcade local
              </span>
            </span>
          </button>
          <div className="relative hidden min-w-0 flex-1 items-center justify-center md:flex">
            <div className="flex h-11 w-full max-w-xl items-center gap-3 rounded-md border border-white/8 bg-black/20 px-4">
              <Search className="h-4 w-4 shrink-0 text-white/38" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/34"
                placeholder="Buscar juegos..."
              />
              {!searchQuery && (
                <kbd className="shrink-0 rounded border border-white/12 bg-white/6 px-2 py-0.5 text-[10px] font-semibold text-white/34">
                  Ctrl+K
                </kbd>
              )}
            </div>
            <SearchDropdown
              query={searchQuery}
              games={snapshot.games}
              consoles={snapshot.consoles}
              onSelect={(game) => {
                onSelectSearchResult(game)
                clearSearch()
              }}
              onLaunch={(game) => {
                onLaunchSearchResult(game)
                clearSearch()
              }}
              onClose={clearSearch}
              visible={searchOpen}
            />
          </div>
          {searchOpen && searchQuery && (
            <div
              className="fixed inset-0 z-40"
              onClick={clearSearch}
            />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onScan}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/8 px-4 text-sm font-bold text-white transition hover:bg-white/14"
            >
              <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
              Escanear
            </button>
            <button
              type="button"
              onClick={onSettings}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-extrabold text-night transition hover:bg-mint"
            >
              <Settings className="h-4 w-4" />
              Configurar
            </button>
          </div>
        </header>

        {snapshot.sampleMode ? (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-volt/20 bg-volt/10 px-4 py-3 text-sm text-volt">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Mostrando estanterías de muestra hasta que se configuren las carpetas de ROMs. Todo aquí es offline y local; tus juegos
              reales aparecerán después de la configuración y el escaneo.
            </p>
          </div>
        ) : null}

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
