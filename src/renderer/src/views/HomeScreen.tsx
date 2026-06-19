import type { ConsoleId, GameEntry, LibrarySnapshot } from '@shared/types'
import { FeaturedGamesCarousel } from '@renderer/components/FeaturedGamesCarousel'

interface HomeScreenProps {
  snapshot: LibrarySnapshot
  onOpenConsole: (consoleId: ConsoleId) => void
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
}

export function HomeScreen({
  snapshot,
  onOpenGame,
  onLaunchGame,
}: HomeScreenProps): JSX.Element {
  return (
    <FeaturedGamesCarousel
      games={snapshot.games}
      consoles={snapshot.consoles}
      onOpenGame={onOpenGame}
      onLaunchGame={onLaunchGame}
    />
  )
}
