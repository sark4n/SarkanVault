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
  onSeeAll?: () => void
  compact?: boolean
}

export function GameCarousel({
  title,
  subtitle,
  games,
  consoles,
  onOpenGame,
  onLaunchGame,
  onSeeAll,
  compact
}: GameCarouselProps): JSX.Element | null {
  if (!games.length) return null

  return (
    <section className="animate-fadeUp">
      <SectionHeader title={title} subtitle={subtitle} actionLabel={onSeeAll ? 'See all' : undefined} onAction={onSeeAll} />
      <div className="scroll-smooth-x -mx-8 flex gap-5 overflow-x-auto px-8 pb-7 pt-1">
        {games.map((game) => {
          const consoleDef = consoles.find((item) => item.id === game.consoleId) ?? consoles[0]
          return (
            <GameCard
              key={game.id}
              game={game}
              consoleDef={consoleDef}
              onOpen={onOpenGame}
              onLaunch={onLaunchGame}
              compact={compact}
            />
          )
        })}
      </div>
    </section>
  )
}
