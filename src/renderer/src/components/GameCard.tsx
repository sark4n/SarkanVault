import { Clock3, Play, Star } from 'lucide-react'
import type { ConsoleDefinition, GameEntry } from '@shared/types'
import { formatDate } from '@renderer/lib/format'
import { CoverFrame } from './CoverFrame'

interface GameCardProps {
  game: GameEntry
  consoleDef: ConsoleDefinition
  onOpen: (game: GameEntry) => void
  onLaunch: (game: GameEntry) => void
  compact?: boolean
}

export function GameCard({ game, consoleDef, onOpen, onLaunch, compact = false }: GameCardProps): JSX.Element {
  return (
    <article
      className={`group relative shrink-0 overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] shadow-card transition duration-300 hover:-translate-y-2 hover:border-white/22 hover:bg-white/[0.075] ${
        compact ? 'w-[164px]' : 'w-[212px]'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(game)}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
      >
        <div className="aspect-[2/3] overflow-hidden rounded-t-lg">
          <CoverFrame game={game} consoleDef={consoleDef} />
        </div>
      </button>
      <div className="space-y-3 p-4">
        <button type="button" onClick={() => onOpen(game)} className="block w-full text-left">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-white">{game.title}</h3>
        </button>
        <div className="flex items-center justify-between gap-3 text-xs text-white/50">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formatDate(game.lastPlayed)}</span>
          </span>
          {game.favorite ? <Star className="h-4 w-4 shrink-0 fill-volt text-volt" /> : null}
        </div>
        <button
          type="button"
          onClick={() => onLaunch(game)}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-extrabold text-night transition hover:bg-mint focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
        >
          <Play className="h-4 w-4 fill-current" />
          Play
        </button>
      </div>
      <div
        className="pointer-events-none absolute inset-x-4 top-4 h-24 rounded-full opacity-0 blur-3xl transition duration-300 group-hover:opacity-70"
        style={{ backgroundColor: consoleDef.accent }}
      />
    </article>
  )
}
