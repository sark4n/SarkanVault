import { Play } from 'lucide-react'
import { useMemo } from 'react'
import type { ConsoleDefinition, ConsoleId, GameEntry, LibrarySnapshot } from '@shared/types'
import { getConsole, getEmulator, groupByConsole, groupByGenre, genreOrder, sortGames } from '@renderer/lib/format'
import { ConsoleTile } from '@renderer/components/ConsoleTile'
import { GameCarousel } from '@renderer/components/GameCarousel'
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
  onOpenConsole,
  onOpenGame,
  onLaunchGame,
  onToggleHidden
}: HomeScreenProps): JSX.Element {
  const groupedGames = groupByConsole(snapshot.games)
  const continuePlaying = snapshot.recentlyPlayed.length ? snapshot.recentlyPlayed : snapshot.games.filter((game) => game.playCount > 0)

  const genreGroups = useMemo(() => {
    const groups = groupByGenre(snapshot.games)
    return genreOrder
      .filter((genre) => groups.has(genre))
      .map((genre) => ({ genre, games: groups.get(genre) ?? [] }))
  }, [snapshot.games])

  const consoleGroups = useMemo(() => {
    return snapshot.consoles
      .map((consoleDef) => ({
        consoleDef,
        games: groupedGames.get(consoleDef.id) ?? []
      }))
      .filter(({ games }) => games.length > 0)
  }, [snapshot.consoles, groupedGames])

  return (
    <div className="space-y-10">
      {/* Featured Games Gallery */}
      <FeaturedGamesCarousel
        games={snapshot.games}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
      />

      {/* Platform Centers */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Bibliotecas</h2>
            <p className="mt-1 text-sm text-white/54">Configura emuladores, juegos de PC y accesos directos una vez, luego explora todo desde una sola app.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.consoles.map((consoleDef) => (
            <ConsoleTile
              key={consoleDef.id}
              consoleDef={consoleDef}
              games={groupedGames.get(consoleDef.id) ?? []}
              config={getEmulator(snapshot.emulators, consoleDef.id)}
              onOpen={() => onOpenConsole(consoleDef.id)}
            />
          ))}
        </div>
      </section>

      {/* Continue Playing */}
      <GameCarousel
        title="Continuar Jugando"
        subtitle="Ordenados por tus lanzamientos mas recientes."
        games={continuePlaying.slice(0, 18)}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
        onToggleHidden={onToggleHidden}
        compact
      />

      {/* Platform Sections - Clickable */}
      {consoleGroups.map(({ consoleDef, games }) => (
        <GameCarousel
          key={consoleDef.id}
          title={consoleDef.name}
          subtitle={`${games.length} juego${games.length === 1 ? '' : 's'} · ${consoleDef.generation} · ${consoleDef.manufacturer}`}
          games={sortGames(games, 'title').slice(0, 18)}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
          onOpenConsole={() => onOpenConsole(consoleDef.id)}
          compact
        />
      ))}

      {/* Genre Sections */}
      {genreGroups.map(({ genre, games }) => (
        <GameCarousel
          key={genre}
          title={genre}
          subtitle={`${games.length} juegos en ${genre}`}
          games={sortGames(games, 'title').slice(0, 18)}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
          compact
        />
      ))}
    </div>
  )
}
