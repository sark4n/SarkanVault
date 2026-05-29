import { useEffect, useRef, useState } from 'react'
import { Gamepad2, Play } from 'lucide-react'
import type { ConsoleDefinition, GameEntry } from '@shared/types'
import { getConsole } from '@renderer/lib/format'

interface SearchDropdownProps {
  query: string
  games: GameEntry[]
  consoles: ConsoleDefinition[]
  onSelect: (game: GameEntry) => void
  onLaunch: (game: GameEntry) => void
  onClose: () => void
  visible: boolean
}

export function SearchDropdown({
  query,
  games,
  consoles,
  onSelect,
  onLaunch,
  onClose,
  visible
}: SearchDropdownProps): JSX.Element | null {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const results = query.trim() ? games.slice(0, 8) : []

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!visible || !results.length) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault()
        onSelect(results[activeIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible, results, activeIndex, onSelect, onLaunch, onClose])

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  if (!visible || !query.trim()) return null

  if (!results.length) {
    return (
      <div className="absolute left-1/2 top-full z-50 mt-2 w-full max-w-xl -translate-x-1/2 rounded-lg border border-white/10 bg-[#11131c]/95 p-6 text-center shadow-2xl backdrop-blur-2xl">
        <p className="text-sm text-white/50">No se encontraron juegos para "{query}"</p>
      </div>
    )
  }

  return (
    <div className="absolute left-1/2 top-full z-50 mt-2 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-white/10 bg-[#11131c]/95 shadow-2xl backdrop-blur-2xl">
      <div ref={listRef} className="max-h-[420px] overflow-y-auto py-2">
        {results.map((game, index) => {
          const consoleDef = getConsole(consoles, game.consoleId)
          const isActive = index === activeIndex

          return (
            <div
              key={game.id}
              onClick={() => onSelect(game)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition ${
                isActive ? 'bg-white/10' : 'hover:bg-white/6'
              }`}
            >
              <div
                className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded"
                style={{
                  background: game.coverUrl ? 'transparent' : `linear-gradient(135deg, ${consoleDef.colorFrom}, ${consoleDef.colorTo})`
                }}
              >
                {game.coverUrl ? (
                  <img src={game.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Gamepad2 className="h-4 w-4 text-white/60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{game.title}</p>
                <p className="text-xs text-white/44">{consoleDef.shortName}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onLaunch(game)
                }}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-white/7 px-2.5 text-xs font-bold text-white/72 transition hover:bg-white/14"
              >
                <Play className="h-3 w-3" />
                Jugar
              </button>
            </div>
          )
        })}
      </div>
      <div className="border-t border-white/6 px-4 py-2 text-xs text-white/30">
        <kbd className="rounded border border-white/14 bg-white/6 px-1.5 py-0.5 text-[10px]">↑↓</kbd> navegar
        <span className="mx-2">·</span>
        <kbd className="rounded border border-white/14 bg-white/6 px-1.5 py-0.5 text-[10px]">↵</kbd> seleccionar
        <span className="mx-2">·</span>
        <kbd className="rounded border border-white/14 bg-white/6 px-1.5 py-0.5 text-[10px]">Esc</kbd> cerrar
      </div>
    </div>
  )
}
