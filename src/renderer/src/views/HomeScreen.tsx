import { Flame, LibraryBig, Star, TimerReset } from 'lucide-react'
import type { ConsoleId, GameEntry, LibrarySnapshot } from '@shared/types'
import { getConsole, getEmulator, groupByConsole } from '@renderer/lib/format'
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
  const heroGame =
    snapshot.recentlyPlayed[0] ?? snapshot.favorites[0] ?? snapshot.games.find((game) => game.source === 'sample') ?? snapshot.games[0]
  const heroConsole = getConsole(snapshot.consoles, heroGame.consoleId)
  const continuePlaying = snapshot.recentlyPlayed.length ? snapshot.recentlyPlayed : snapshot.games.filter((game) => game.playCount > 0)
  const featured = snapshot.games.filter((game) => game.favorite).slice(0, 14)
  const allGames = snapshot.games.slice(0, 20)

  return (
    <div className="space-y-10">
      <section className="relative min-h-[460px] overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] shadow-card">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(125deg, ${heroConsole.colorFrom}, ${heroConsole.colorTo})`
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_22%,rgba(255,255,255,0.26),transparent_30%),linear-gradient(90deg,rgba(7,8,13,0.94)_0%,rgba(7,8,13,0.62)_46%,rgba(7,8,13,0.12)_100%)]" />
        <div className="relative grid min-h-[460px] grid-cols-1 gap-8 p-7 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="flex max-w-3xl flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-black/24 px-4 py-2 text-xs font-extrabold uppercase text-white/70 backdrop-blur-xl">
              <Flame className="h-4 w-4 text-ember" />
              Featured locally
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.03] text-white md:text-7xl">{heroGame.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">{heroConsole.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onLaunchGame(heroGame)}
                className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-extrabold text-night transition hover:bg-mint"
              >
                Launch game
              </button>
              <button
                type="button"
                onClick={() => onOpenGame(heroGame)}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/14 bg-white/8 px-6 text-sm font-bold text-white transition hover:bg-white/14"
              >
                Details
              </button>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <HeroStat icon={<LibraryBig className="h-4 w-4" />} label="Games" value={snapshot.stats.totalGames || snapshot.games.length} />
              <HeroStat icon={<Star className="h-4 w-4" />} label="Favorites" value={snapshot.favorites.length} />
              <HeroStat icon={<TimerReset className="h-4 w-4" />} label="Recent" value={snapshot.recentlyPlayed.length} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenGame(heroGame)}
            className="group mx-auto flex w-full max-w-[340px] items-center self-center overflow-hidden rounded-lg border border-white/16 bg-black/24 p-3 shadow-card backdrop-blur-2xl transition hover:-translate-y-2 hover:border-white/28"
          >
            <div className="aspect-[2/3] w-full overflow-hidden rounded-md">
              <CoverFrame game={heroGame} consoleDef={heroConsole} priority />
            </div>
          </button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Console Hubs</h2>
            <p className="mt-1 text-sm text-white/54">Configure emulators once, then browse each system like a media shelf.</p>
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
        title="Continue Playing"
        subtitle="Sorted from your most recent launches."
        games={continuePlaying.slice(0, 18)}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
        compact
      />
      <GameCarousel
        title="Favorites"
        subtitle="Pinned games stay one click away."
        games={featured}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
      />
      <GameCarousel
        title="Recently Added"
        subtitle="Freshly scanned ROMs and sample entries."
        games={allGames}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
        compact
      />
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
    <div className="rounded-lg border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-white/54">
        {icon}
        <span className="text-xs font-extrabold uppercase">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
