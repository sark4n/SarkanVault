import { useMemo } from 'react'
import type { ConsoleDefinition, ConsoleId, GameEntry, LibrarySnapshot } from '@shared/types'
import { getConsole, getEmulator, groupByConsole } from '@renderer/lib/format'
import { ConsoleTile } from '@renderer/components/ConsoleTile'
import { GameCarousel } from '@renderer/components/GameCarousel'
import { FeaturedGamesCarousel } from '@renderer/components/FeaturedGamesCarousel'

interface HomeScreenProps {
  snapshot: LibrarySnapshot
  onOpenConsole: (consoleId: ConsoleId) => void
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
  section?: 'principal' | 'biblioteca' | 'mis-juegos'
  profileFavorites?: GameEntry[]
}

export function HomeScreen({
  snapshot,
  onOpenConsole,
  onOpenGame,
  onLaunchGame,
  onToggleHidden,
  section = 'principal',
  profileFavorites = [],
}: HomeScreenProps): JSX.Element {
  const groupedGames = groupByConsole(snapshot.games)
  const continuePlaying = snapshot.recentlyPlayed.length
    ? snapshot.recentlyPlayed
    : snapshot.games.filter((game) => game.playCount > 0)

  const allFavorites = useMemo(() => {
    const favIds = new Set(profileFavorites.map(g => g.id))
    return [...profileFavorites, ...snapshot.favorites.filter(g => !favIds.has(g.id))]
  }, [profileFavorites, snapshot.favorites])

  // ── Principal Section: Featured + Continue Playing ───────────────────────────
  if (section === 'principal') {
    return (
      <div className="space-y-10">
        {/* Featured Games Gallery */}
        <FeaturedGamesCarousel
          games={snapshot.games}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
        />

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
      </div>
    )
  }

  // ── Biblioteca Section: All Consoles Grid ───────────────────────────────────
  if (section === 'biblioteca') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <section className="mb-4">
          <h2 className="font-display text-3xl font-bold text-white">Biblioteca</h2>
          <p className="mt-2 text-sm text-white/54">
            Todas las plataformas disponibles. Selecciona una para ver sus juegos.
          </p>
        </section>

        {/* Console Grid - Responsive, compact tiles to fit all without scroll */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {snapshot.consoles.map((consoleDef) => (
            <ConsoleTile
              key={consoleDef.id}
              consoleDef={consoleDef}
              games={groupedGames.get(consoleDef.id) ?? []}
              config={getEmulator(snapshot.emulators, consoleDef.id)}
              onOpen={() => onOpenConsole(consoleDef.id)}
              compact
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Mis Juegos Section: Recent + Favorites ──────────────────────────────────
  if (section === 'mis-juegos') {
    return (
      <div className="space-y-10">
        {/* Header */}
        <section>
          <h2 className="font-display text-3xl font-bold text-white">Mis Juegos</h2>
          <p className="mt-2 text-sm text-white/54">
            Tu actividad reciente y tus favoritos.
          </p>
        </section>

        {/* Continue Playing */}
        <GameCarousel
          title="Jugado Recientemente"
          subtitle="Tus ultimas partidas."
          games={continuePlaying.slice(0, 18)}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
          compact
        />

        {/* Favorites */}
        <GameCarousel
          title="Favoritos"
          subtitle="Juegos que has marcado como favoritos."
          games={allFavorites.slice(0, 18)}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
          compact
        />

        {/* Empty state if no games */}
        {continuePlaying.length === 0 && allFavorites.length === 0 && (
          <div className="rounded-xl border border-white/8 bg-white/[0.04] p-12 text-center">
            <p className="text-lg font-bold text-white/60">
              Aun no tienes juegos jugados ni favoritos.
            </p>
            <p className="mt-2 text-sm text-white/40">
              Explora la biblioteca y juega para ver tu actividad aqui.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Fallback - shouldn't reach
  return <div />
}
