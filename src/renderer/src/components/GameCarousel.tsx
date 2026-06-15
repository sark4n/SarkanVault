import { ChevronRight } from 'lucide-react'
import type { ConsoleDefinition, GameEntry } from '@shared/types'
import { GameCard } from './GameCard'
import { SectionHeader } from './SectionHeader'

interface GameCarouselProps {
  title: string
  subtitle?: string
  games: GameEntry[]
  consoles: ConsoleDefinition[]
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden?: (game: GameEntry) => void
  onSeeAll?: () => void
  onOpenConsole?: () => void
  compact?: boolean
}

export function GameCarousel({
  title,
  subtitle,
  games,
  consoles,
  onOpenGame,
  onLaunchGame,
  onToggleHidden,
  onSeeAll,
  onOpenConsole,
  compact,
}: GameCarouselProps): JSX.Element | null {
  if (!games.length) return null

  return (
    <section className="animate-fadeUp" aria-label={title}>
      <div className="mb-4 flex items-end justify-between">
        <SectionHeader title={title} subtitle={subtitle} />
        {onOpenConsole && (
          <button
            type="button"
            onClick={onOpenConsole}
            aria-label={`Ver todo — ${title}`}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-mint"
          >
            Ver todo
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Horizontally scrollable row — spatial nav navigates within this as a "row" */}
      <div
        role="list"
        aria-label={`Juegos — ${title}`}
        className="carousel-row -mx-8 px-8"
      >
        {games.map((game) => {
          const consoleDef = consoles.find((item) => item.id === game.consoleId) ?? consoles[0]
          return (
            <div key={game.id} role="listitem">
              <GameCard
                game={game}
                consoleDef={consoleDef}
                onOpen={onOpenGame}
                onLaunch={onLaunchGame}
                onToggleHidden={onToggleHidden || (() => {})}
                compact={compact}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
