import { Clock3, Play, Star, Eye, EyeOff } from 'lucide-react'
import type { ConsoleDefinition, GameEntry } from '@shared/types'
import { formatDate, inferGenre } from '@renderer/lib/format'
import { CoverFrame } from './CoverFrame'

interface GameCardProps {
  game: GameEntry
  consoleDef: ConsoleDefinition
  onOpen: (game: GameEntry) => void
  onLaunch: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
  compact?: boolean
}

export function GameCard({ game, consoleDef, onOpen, onLaunch, onToggleHidden, compact = false }: GameCardProps): JSX.Element {
  const genre = inferGenre(game)
  const cardWidth = compact ? 'w-[220px]' : 'w-[240px]'
  const coverAspect = compact ? 'aspect-[3/4]' : 'aspect-[2/3]'

  return (
    <article
      data-game-id={game.id}
      className={`group relative shrink-0 overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] shadow-card transition duration-300 hover:-translate-y-2 hover:border-white/22 hover:bg-white/[0.075] ${cardWidth}`}
    >
      {/* Cover image — primary focusable for spatial nav */}
      <button
        type="button"
        onClick={() => onOpen(game)}
        data-game-id={game.id}
        data-focusable-id={game.id}
        aria-label={`Ver detalles de ${game.title}`}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
      >
        <div className={`${coverAspect} overflow-hidden rounded-t-lg`}>
          <CoverFrame game={game} consoleDef={consoleDef} />
        </div>
      </button>

      <div className="space-y-3 p-4">
        <button
          type="button"
          onClick={() => onOpen(game)}
          aria-label={`${game.title} — ${consoleDef.shortName}`}
          className="block w-full text-left focus-visible:outline-none"
          tabIndex={-1}
        >
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-white">
            {game.title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-white/46">
            {consoleDef.shortName} · {genre}
          </p>
        </button>

        <div className="flex items-center justify-between gap-3 text-xs text-white/50">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formatDate(game.lastPlayed)}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleHidden(game)
              }}
              aria-label={game.hidden ? `Mostrar ${game.title}` : `Ocultar ${game.title}`}
              tabIndex={-1}
              className="rounded p-1 transition hover:bg-white/10"
              title={game.hidden ? 'Mostrar' : 'Ocultar'}
            >
              {game.hidden ? (
                <EyeOff className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Eye className="h-3.5 w-3.5 shrink-0" />
              )}
            </button>
            {game.favorite ? <Star className="h-4 w-4 shrink-0 fill-volt text-volt" /> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onLaunch(game)}
          aria-label={`Jugar ${game.title}`}
          tabIndex={-1}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-extrabold text-night transition hover:bg-mint focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
        >
          <Play className="h-4 w-4 fill-current" />
          Jugar
        </button>
      </div>

      {/* Glow accent */}
      <div
        className="pointer-events-none absolute inset-x-4 top-4 h-24 rounded-full opacity-0 blur-3xl transition duration-300 group-hover:opacity-70"
        style={{ backgroundColor: consoleDef.accent }}
      />
    </article>
  )
}
