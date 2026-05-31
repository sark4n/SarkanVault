import { Flame, LibraryBig, Star, TimerReset } from 'lucide-react'
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
      <section className="relative overflow-hidden rounded-lg border border-white/8 shadow-card" style={{ minHeight: '420px' }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(125deg, ${heroConsole.colorFrom}55, ${heroConsole.colorTo}33)`
          }}
        />
        <div className="absolute inset-0 bg-night/60" />

        <div className="absolute inset-y-0 right-0 w-[48%] overflow-hidden">
          <CoverFrame game={heroGame} consoleDef={heroConsole} priority className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-8 md:p-10" style={{ minHeight: '420px', maxWidth: '60%' }}>
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-black/30 px-4 py-2 text-xs font-extrabold uppercase text-white/70 backdrop-blur-xl">
            <Flame className="h-4 w-4 text-ember" />
            Destacado localmente
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] text-white md:text-5xl lg:text-6xl">{heroGame.title}</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/68">{heroConsole.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onLaunchGame(heroGame)}
              className="inline-flex h-12 items-center gap-3 rounded-lg bg-white px-7 text-sm font-extrabold text-night transition hover:bg-mint"
            >
              Ejecutar juego
            </button>
            <button
              type="button"
              onClick={() => onOpenGame(heroGame)}
              className="inline-flex h-12 items-center gap-3 rounded-lg border border-white/14 bg-white/8 px-7 text-sm font-bold text-white transition hover:bg-white/14"
            >
              Detalles
            </button>
          </div>
          <div className="mt-8 grid max-w-sm grid-cols-3 gap-3">
            <HeroStat icon={<LibraryBig className="h-4 w-4" />} label="Juegos" value={snapshot.stats.totalGames || snapshot.games.length} />
            <HeroStat icon={<Star className="h-4 w-4" />} label="Favoritos" value={snapshot.favorites.length} />
            <HeroStat icon={<TimerReset className="h-4 w-4" />} label="Recientes" value={snapshot.recentlyPlayed.length} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Centros de Consolas</h2>
            <p className="mt-1 text-sm text-white/54">Configura los emuladores una vez, luego explora cada sistema como una estantería multimedia.</p>
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

      <GameCarousel
        title="Continuar Jugando"
        subtitle="Ordenados por tus lanzamientos más recientes."
        games={continuePlaying.slice(0, 18)}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
        compact
      />

      {consoleGroups.map(({ consoleDef, games }) => (
        <GameCarousel
          key={consoleDef.id}
          title={consoleDef.name}
          subtitle={`${games.length} juego${games.length === 1 ? '' : 's'} · ${consoleDef.generation} · ${consoleDef.manufacturer}`}
          games={sortGames(games, 'title').slice(0, 18)}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          compact
        />
      ))}

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

interface HeroStatProps {
  icon: React.ReactNode
  label: string
  value: number
}

function HeroStat({ icon, label, value }: HeroStatProps): JSX.Element {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-white/54">
        {icon}
        <span className="text-xs font-extrabold uppercase">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
