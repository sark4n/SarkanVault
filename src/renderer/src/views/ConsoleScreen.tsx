import { Search, SlidersHorizontal, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ConsoleId, GameEntry, LibrarySnapshot } from '@shared/types'
import { getConsole, getEmulator, groupByGenre, genreOrder, shortPath, sortGames } from '@renderer/lib/format'
import { GameCard } from '@renderer/components/GameCard'
import { GameCarousel } from '@renderer/components/GameCarousel'

interface ConsoleScreenProps {
  consoleId: ConsoleId
  snapshot: LibrarySnapshot
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onOpenSettings: () => void
}

export function ConsoleScreen({
  consoleId,
  snapshot,
  onOpenGame,
  onLaunchGame,
  onOpenSettings
}: ConsoleScreenProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState('title')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const consoleDef = getConsole(snapshot.consoles, consoleId)
  const emulator = getEmulator(snapshot.emulators, consoleId)
  const consoleGames = snapshot.games.filter((game) => game.consoleId === consoleId)
  const favoriteGames = consoleGames.filter((game) => game.favorite)
  const recentGames = consoleGames.filter((game) => game.lastPlayed)

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const visibleGames = consoleGames.filter((game) => {
      const matchesSearch = !normalizedQuery || game.title.toLowerCase().includes(normalizedQuery)
      const matchesFavorite = !favoritesOnly || game.favorite
      return matchesSearch && matchesFavorite
    })

    return sortGames(visibleGames, sortMode)
  }, [consoleGames, favoritesOnly, query, sortMode])

  const genreGroups = useMemo(() => {
    const groups = groupByGenre(filteredGames)
    return genreOrder
      .filter((genre) => groups.has(genre))
      .map((genre) => ({ genre, games: groups.get(genre) ?? [] }))
  }, [filteredGames])

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] p-7 shadow-card">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: `linear-gradient(135deg, ${consoleDef.colorFrom}, ${consoleDef.colorTo})`
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,13,0.90),rgba(7,8,13,0.34)),radial-gradient(circle_at_82%_10%,rgba(255,255,255,0.28),transparent_24%)]" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-4xl">
            <p className="text-xs font-extrabold uppercase text-white/58">{consoleDef.manufacturer} / {consoleDef.generation}</p>
            <h1 className="mt-3 font-display text-5xl font-bold text-white md:text-7xl">{consoleDef.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/68">{consoleDef.description}</p>
          </div>
          <div className="grid min-w-[280px] gap-3 rounded-lg border border-white/12 bg-black/22 p-4 backdrop-blur-2xl">
            <Info label="Emulador" value={emulator?.emulatorName || 'No configurado'} />
            <Info label="Carpeta ROM" value={shortPath(emulator?.romFolderPath, 42)} />
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-1 inline-flex h-10 items-center justify-center rounded-md bg-white text-sm font-extrabold text-night transition hover:bg-mint"
            >
              Configurar consola
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-white/8 bg-white/[0.045] p-4 backdrop-blur-2xl lg:flex-row lg:items-center">
        <div className="flex h-11 flex-1 items-center gap-3 rounded-md border border-white/8 bg-black/20 px-4">
          <Search className="h-4 w-4 text-white/38" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar juegos de ${consoleDef.shortName}`}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/34"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFavoritesOnly((value) => !value)}
            className={`inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-bold transition ${
              favoritesOnly ? 'border-volt/40 bg-volt/16 text-volt' : 'border-white/10 bg-white/6 text-white/72 hover:bg-white/12'
            }`}
          >
            <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-volt' : ''}`} />
            Favoritos
          </button>
          <label className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/6 px-4 text-sm font-bold text-white/72">
            <SlidersHorizontal className="h-4 w-4" />
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none"
            >
              <option value="title">Alfabético (A-Z)</option>
              <option value="recent">Jugados recientemente</option>
              <option value="plays">Conteo de partidas</option>
            </select>
          </label>
        </div>
      </div>

      <GameCarousel
        title="Jugados Recientemente"
        games={sortGames(recentGames, 'recent').slice(0, 14)}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
        compact
      />
      <GameCarousel
        title="Favoritos"
        games={favoriteGames.slice(0, 14)}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
        compact
      />

      <section>
        <div className="mb-4">
          <h2 className="font-display text-2xl font-bold text-white">Todos los Juegos</h2>
          <p className="mt-1 text-sm text-white/54">{filteredGames.length} entradas visibles</p>
        </div>
        {filteredGames.length ? (
          <div className="space-y-8">
            {genreGroups.map(({ genre, games }) => (
              <div key={genre}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white/78">{genre}</h3>
                  <span className="text-xs text-white/38">{games.length} juegos</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
                  {games.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      consoleDef={consoleDef}
                      onOpen={onOpenGame}
                      onLaunch={onLaunchGame}
                      compact
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/8 bg-white/[0.045] p-10 text-center text-white/54">
            No hay juegos que coincidan con la búsqueda y filtros actuales.
          </div>
        )}
      </section>
    </div>
  )
}

interface InfoProps {
  label: string
  value: string
}

function Info({ label, value }: InfoProps): JSX.Element {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase text-white/42">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
