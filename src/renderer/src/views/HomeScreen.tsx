import { Flame, Play } from 'lucide-react'
import { useMemo } from 'react'
import type { ConsoleDefinition, ConsoleId, GameEntry, LibrarySnapshot } from '@shared/types'
import { getConsole, getEmulator, groupByConsole, groupByGenre, genreOrder, pickRandomRealGame, sortGames } from '@renderer/lib/format'
import { ConsoleTile } from '@renderer/components/ConsoleTile'
import { CoverFrame } from '@renderer/components/CoverFrame'
import { GameCarousel } from '@renderer/components/GameCarousel'

interface HomeScreenProps {
  snapshot: LibrarySnapshot
  onOpenConsole: (consoleId: ConsoleId) => void
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
}

export function HomeScreen({
  snapshot,
  onOpenConsole,
  onOpenGame,
  onLaunchGame
}: HomeScreenProps): JSX.Element {
  const groupedGames = groupByConsole(snapshot.games)

  const heroGame = useMemo(() => {
    return pickRandomRealGame(snapshot.games) ?? snapshot.games[0]
  }, [snapshot.games])

  const heroConsole = getConsole(snapshot.consoles, heroGame.consoleId)
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
      {/* Hero Section - Featured Game */}
      <section className="relative overflow-hidden rounded-xl border border-white/8 shadow-2xl" style={{ minHeight: '500px' }}>
        {/* Full cover background */}
        <div className="absolute inset-0">
          <CoverFrame game={heroGame} consoleDef={heroConsole} priority className="h-full w-full" />
        </div>

        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${heroConsole.colorFrom}60 0%, ${heroConsole.colorTo}30 40%, transparent 70%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-night/90 via-night/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-night/30" />

        {/* Content */}
        <div className="relative z-10 flex h-full min-h-[500px] flex-col justify-end p-8 md:p-12" style={{ maxWidth: '55%' }}>
          {/* Console badge */}
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase" style={{ backgroundColor: `${heroConsole.accent}30`, color: heroConsole.accent, border: `1px solid ${heroConsole.accent}50` }}>
            {heroConsole.shortName}
          </div>

          {/* Featured badge */}
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-black/40 px-3 py-1.5 text-xs font-bold uppercase text-white/70 backdrop-blur-xl">
            <Flame className="h-3.5 w-3.5 text-ember" />
            Destacado
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] text-white md:text-6xl lg:text-7xl drop-shadow-2xl">
            {heroGame.title}
          </h1>

          <p className="mt-4 max-w-md text-base leading-7 text-white/70">
            {heroConsole.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onLaunchGame(heroGame)}
              data-focusable-id="hero-play"
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-white px-8 text-base font-extrabold text-night shadow-lg transition hover:bg-mint hover:scale-105"
            >
              <Play className="h-5 w-5 fill-current" />
              Jugar
            </button>
            <button
              type="button"
              onClick={() => onOpenGame(heroGame)}
              data-focusable-id="hero-details"
              className="inline-flex h-14 items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Detalles
            </button>
          </div>
        </div>
      </section>

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
          compact
        />
      ))}
    </div>
  )
}
