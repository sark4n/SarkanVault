import { Download, FolderOpen, Gamepad2, Heart, ImagePlus, Play, Search, Star, TimerReset } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CoverSearchResult, GameEntry, LibrarySnapshot } from '@shared/types'
import { CoverFrame } from '@renderer/components/CoverFrame'
import { formatDate, getConsole, getEmulator, shortPath } from '@renderer/lib/format'

interface GameDetailsScreenProps {
  game: GameEntry
  snapshot: LibrarySnapshot
  onBack: () => void
  onLaunch: (game: GameEntry) => void
  onToggleFavorite: (game: GameEntry) => void
  onSearchCovers: (game: GameEntry, query?: string) => Promise<{ results: CoverSearchResult[]; warnings: string[] }>
  onDownloadCover: (game: GameEntry, cover: CoverSearchResult) => Promise<void>
  onRevealPath: (filePath: string) => void
}

export function GameDetailsScreen({
  game,
  snapshot,
  onBack,
  onLaunch,
  onToggleFavorite,
  onSearchCovers,
  onDownloadCover,
  onRevealPath
}: GameDetailsScreenProps): JSX.Element {
  const consoleDef = getConsole(snapshot.consoles, game.consoleId)
  const emulator = getEmulator(snapshot.emulators, game.consoleId)
  const [coverQuery, setCoverQuery] = useState(game.title)
  const [coverResults, setCoverResults] = useState<CoverSearchResult[]>([])
  const [coverMessage, setCoverMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    setCoverQuery(game.title)
    setCoverResults([])
    setCoverMessage('')
  }, [game.id, game.title])

  const searchCovers = async (): Promise<void> => {
    setIsSearching(true)
    setCoverMessage('')

    try {
      const response = await onSearchCovers(game, coverQuery)
      setCoverResults(response.results)
      setCoverMessage(
        response.results.length ? `${response.results.length} cover options found.` : response.warnings[0] ?? 'No covers found.'
      )
    } catch (error) {
      setCoverMessage(error instanceof Error ? error.message : 'Cover search failed.')
    } finally {
      setIsSearching(false)
    }
  }

  const downloadCover = async (cover: CoverSearchResult): Promise<void> => {
    try {
      await onDownloadCover(game, cover)
    } catch (error) {
      setCoverMessage(error instanceof Error ? error.message : 'Cover download failed.')
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative min-h-[640px] overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] shadow-card">
        {game.coverUrl ? (
          <img src={game.coverUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-34 blur-2xl" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${consoleDef.colorFrom}, ${consoleDef.colorTo})` }}
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_8%,rgba(255,255,255,0.16),transparent_32%),linear-gradient(90deg,#07080d_0%,rgba(7,8,13,0.88)_42%,rgba(7,8,13,0.44)_100%)]" />

        <div className="relative grid min-h-[640px] gap-9 p-7 lg:grid-cols-[380px_1fr] lg:p-10">
          <div className="flex items-center">
            <div className="w-full overflow-hidden rounded-lg border border-white/14 bg-black/22 p-3 shadow-card backdrop-blur-xl">
              <div className="aspect-[2/3] overflow-hidden rounded-md">
                <CoverFrame game={game} consoleDef={consoleDef} priority />
              </div>
            </div>
          </div>

          <div className="flex max-w-4xl flex-col justify-center">
            <button
              type="button"
              onClick={onBack}
              className="mb-8 w-fit rounded-md border border-white/10 bg-white/7 px-4 py-2 text-sm font-bold text-white/72 transition hover:bg-white/12"
            >
              Volver
            </button>
            <p className="text-xs font-extrabold uppercase text-white/48">{consoleDef.name}</p>
            <h1 className="mt-3 font-display text-6xl font-bold leading-[1.02] text-white md:text-8xl">{game.title}</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge icon={<Gamepad2 className="h-4 w-4" />} label={emulator?.emulatorName || 'Sin emulador'} />
              <Badge icon={<TimerReset className="h-4 w-4" />} label={`Última vez jugado: ${formatDate(game.lastPlayed)}`} />
              <Badge icon={<Star className="h-4 w-4" />} label={`${game.playCount} partidas`} />
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onLaunch(game)}
                className="inline-flex h-14 items-center gap-3 rounded-md bg-white px-8 text-base font-extrabold text-night transition hover:bg-mint"
              >
                <Play className="h-5 w-5 fill-current" />
                Jugar
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(game)}
                className={`inline-flex h-14 items-center gap-3 rounded-md border px-6 text-base font-bold transition ${
                  game.favorite
                    ? 'border-pulse/40 bg-pulse/16 text-pulse'
                    : 'border-white/12 bg-white/8 text-white hover:bg-white/14'
                }`}
              >
                <Heart className={`h-5 w-5 ${game.favorite ? 'fill-pulse' : ''}`} />
                {game.favorite ? 'En favoritos' : 'Favorito'}
              </button>
              {game.romPath ? (
                <button
                  type="button"
                  onClick={() => onRevealPath(game.romPath)}
                  className="inline-flex h-14 items-center gap-3 rounded-md border border-white/12 bg-white/8 px-6 text-base font-bold text-white transition hover:bg-white/14"
                >
                  <FolderOpen className="h-5 w-5" />
                  Mostrar ROM
                </button>
              ) : null}
              <button
                type="button"
                onClick={searchCovers}
                disabled={isSearching}
                className="inline-flex h-14 items-center gap-3 rounded-md border border-mint/30 bg-mint/12 px-6 text-base font-bold text-mint transition hover:bg-mint/18 disabled:opacity-50"
              >
                <ImagePlus className="h-5 w-5" />
                {isSearching ? 'Buscando' : 'Buscar carátulas'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/8 bg-white/[0.045] p-5 shadow-card backdrop-blur-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase text-white/42">Arte online</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">Búsqueda de Carátulas</h2>
          </div>
          <div className="flex min-w-0 flex-1 gap-2 lg:max-w-2xl">
            <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-md border border-white/10 bg-black/20 px-4">
              <Search className="h-4 w-4 shrink-0 text-white/40" />
              <input
                value={coverQuery}
                onChange={(event) => setCoverQuery(event.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30"
                placeholder="Buscar título de carátula"
              />
            </div>
            <button
              type="button"
              onClick={searchCovers}
              disabled={isSearching}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-extrabold text-night transition hover:bg-mint disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </div>

        {coverMessage ? <p className="mt-4 text-sm font-semibold text-white/58">{coverMessage}</p> : null}

        {coverResults.length ? (
          <div className="scroll-smooth-x -mx-5 mt-5 flex gap-4 overflow-x-auto px-5 pb-4">
            {coverResults.map((cover) => (
              <article
                key={cover.id}
                className="group relative w-[170px] shrink-0 overflow-hidden rounded-lg border border-white/8 bg-black/24 shadow-card transition hover:-translate-y-1 hover:border-white/22"
              >
                <div className="aspect-[2/3] overflow-hidden bg-white/5">
                  <img src={cover.thumbUrl} alt={cover.gameTitle} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-3 p-3">
                  <div>
                    <p className="line-clamp-2 min-h-[2.25rem] text-sm font-extrabold leading-[1.15] text-white">
                      {cover.gameTitle}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase text-white/44">{cover.providerName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCover(cover)}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-white text-xs font-extrabold text-night transition hover:bg-mint"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Usar carátula
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Detail label="Ejecutable del emulador" value={shortPath(emulator?.executablePath, 92)} />
        <Detail label="Ruta del ROM" value={shortPath(game.romPath, 92)} />
        <Detail label="Ruta de la carátula" value={shortPath(game.coverPath, 92)} />
      </section>
    </div>
  )
}

interface BadgeProps {
  icon: React.ReactNode
  label: string
}

function Badge({ icon, label }: BadgeProps): JSX.Element {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-black/24 px-4 text-sm font-bold text-white/72 backdrop-blur-xl">
      {icon}
      {label}
    </span>
  )
}

interface DetailProps {
  label: string
  value: string
}

function Detail({ label, value }: DetailProps): JSX.Element {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.045] p-5 backdrop-blur-2xl">
      <p className="text-xs font-extrabold uppercase text-white/42">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-white/78">{value}</p>
    </div>
  )
}
