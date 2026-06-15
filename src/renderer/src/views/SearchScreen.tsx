import { Search, X, Clock3, Star, Gamepad2 } from 'lucide-react'
import { useEffect, useRef, useState, useMemo } from 'react'
import type { ConsoleDefinition, GameEntry, LibrarySnapshot } from '@shared/types'
import { getConsole, inferGenre, sortGames } from '@renderer/lib/format'
import { CoverFrame } from '@renderer/components/CoverFrame'

interface SearchScreenProps {
  snapshot: LibrarySnapshot
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
}

export function SearchScreen({ snapshot, onOpenGame, onLaunchGame, onToggleHidden }: SearchScreenProps): JSX.Element {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuery('')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const normalizedQuery = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!normalizedQuery) return []
    return snapshot.games.filter((game) => {
      const consoleDef = getConsole(snapshot.consoles, game.consoleId)
      return (
        game.title.toLowerCase().includes(normalizedQuery) ||
        inferGenre(game).toLowerCase().includes(normalizedQuery) ||
        consoleDef.shortName.toLowerCase().includes(normalizedQuery) ||
        consoleDef.name.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [normalizedQuery, snapshot.games, snapshot.consoles])

  const hasQuery = normalizedQuery.length > 0

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 pb-8 pt-2">
        <div className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-2xl shadow-card">
          <Search className="h-5 w-5 shrink-0 text-white/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Títulos, géneros, consolas..."
            className="min-w-0 flex-1 bg-transparent text-lg font-medium text-white outline-none placeholder:text-white/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/60 transition hover:bg-white/14 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {hasQuery ? (
        <SearchResults
          query={query}
          results={results}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
        />
      ) : (
        <SuggestedContent
          snapshot={snapshot}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
        />
      )}
    </div>
  )
}

interface SearchResultsProps {
  query: string
  results: GameEntry[]
  consoles: ConsoleDefinition[]
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
}

function SearchResults({ query, results, consoles, onOpenGame, onLaunchGame, onToggleHidden }: SearchResultsProps): JSX.Element {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Search className="h-7 w-7 text-white/30" />
        </div>
        <p className="text-xl font-bold text-white/40">Sin resultados</p>
        <p className="mt-2 text-sm text-white/28">No hay juegos que coincidan con "{query}"</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-5 text-sm font-semibold text-white/40">
        {results.length} resultado{results.length === 1 ? '' : 's'} para "{query}"
      </p>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {results.map((game) => {
          const consoleDef = getConsole(consoles, game.consoleId)
          return (
            <SearchGameCard
              key={game.id}
              game={game}
              consoleDef={consoleDef}
              onOpen={onOpenGame}
              onLaunch={onLaunchGame}
            />
          )
        })}
      </div>
    </div>
  )
}

interface SuggestedContentProps {
  snapshot: LibrarySnapshot
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
}

function SuggestedContent({ snapshot, onOpenGame, onLaunchGame, onToggleHidden }: SuggestedContentProps): JSX.Element {
  const recentGames = snapshot.recentlyPlayed.slice(0, 12)
  const favoriteGames = snapshot.favorites.slice(0, 12)
  const allGames = sortGames(snapshot.games, 'title').slice(0, 18)

  return (
    <div className="space-y-10">
      {recentGames.length > 0 && (
        <SuggestedRow
          icon={<Clock3 className="h-4 w-4 text-ember" />}
          title="Recientes"
          games={recentGames}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
        />
      )}
      {favoriteGames.length > 0 && (
        <SuggestedRow
          icon={<Star className="h-4 w-4 text-volt" />}
          title="Favoritos"
          games={favoriteGames}
          consoles={snapshot.consoles}
          onOpenGame={onOpenGame}
          onLaunchGame={onLaunchGame}
          onToggleHidden={onToggleHidden}
        />
      )}
      <SuggestedRow
        icon={<Gamepad2 className="h-4 w-4 text-mint" />}
        title="Todos los juegos"
        games={allGames}
        consoles={snapshot.consoles}
        onOpenGame={onOpenGame}
        onLaunchGame={onLaunchGame}
        onToggleHidden={onToggleHidden}
      />
    </div>
  )
}

interface SuggestedRowProps {
  icon: React.ReactNode
  title: string
  games: GameEntry[]
  consoles: ConsoleDefinition[]
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
  onToggleHidden: (game: GameEntry) => void
}

function SuggestedRow({ icon, title, games, consoles, onOpenGame, onLaunchGame, onToggleHidden }: SuggestedRowProps): JSX.Element {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {games.map((game) => {
          const consoleDef = getConsole(consoles, game.consoleId)
          return (
            <SearchGameCard
              key={game.id}
              game={game}
              consoleDef={consoleDef}
              onOpen={onOpenGame}
              onLaunch={onLaunchGame}
              compact
            />
          )
        })}
      </div>
    </section>
  )
}

interface SearchGameCardProps {
  game: GameEntry
  consoleDef: ConsoleDefinition
  onOpen: (game: GameEntry) => void
  onLaunch: (game: GameEntry) => void
  compact?: boolean
}

function SearchGameCard({ game, consoleDef, onOpen, onLaunch, compact = false }: SearchGameCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      className="group relative overflow-hidden rounded-lg border border-white/8 bg-white/[0.04] shadow-card transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(game)}
    >
      <div className={`${compact ? 'aspect-[2/3]' : 'aspect-[2/3]'} overflow-hidden`}>
        <CoverFrame game={game} consoleDef={consoleDef} />
      </div>

      {hovered && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3">
          <p className="line-clamp-2 text-xs font-bold leading-tight text-white">{game.title}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-white/50">{consoleDef.shortName}</p>
          {!compact && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onLaunch(game) }}
              className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-white text-[11px] font-extrabold text-night transition hover:bg-mint"
            >
              Jugar
            </button>
          )}
        </div>
      )}

      {!hovered && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="line-clamp-1 text-[10px] font-bold text-white/80">{game.title}</p>
        </div>
      )}
    </article>
  )
}
