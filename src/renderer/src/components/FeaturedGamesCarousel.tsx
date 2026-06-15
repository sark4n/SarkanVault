import { ChevronLeft, ChevronRight, Flame, Play } from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import type { ConsoleDefinition, GameEntry } from '@shared/types'
import { getConsole, sortGames } from '@renderer/lib/format'
import { CoverFrame } from './CoverFrame'

interface FeaturedGamesCarouselProps {
  games: GameEntry[]
  consoles: ConsoleDefinition[]
  onOpenGame: (game: GameEntry) => void
  onLaunchGame: (game: GameEntry) => void
}

export function FeaturedGamesCarousel({
  games,
  consoles,
  onOpenGame,
  onLaunchGame
}: FeaturedGamesCarouselProps): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  // Get featured games (top 8 most played or random selection)
  const featuredGames = useMemo(() => {
    if (!games.length) return []
    return sortGames(games, 'plays').slice(0, 8)
  }, [games])

  const currentGame = featuredGames[currentIndex] ?? featuredGames[0]
  const heroConsole = getConsole(consoles, currentGame.consoleId)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredGames.length)
    setIsAutoPlay(true)
  }, [featuredGames.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + featuredGames.length) % featuredGames.length)
    setIsAutoPlay(true)
  }, [featuredGames.length])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsAutoPlay(true)
  }, [])

  // Auto-advance carousel every 3.5 seconds
  useEffect(() => {
    if (!isAutoPlay || !featuredGames.length) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredGames.length)
    }, 3500)

    return () => clearInterval(timer)
  }, [isAutoPlay, featuredGames.length])

  if (!featuredGames.length) return <div />

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/8 shadow-2xl" style={{ minHeight: '630px', height: '630px' }}>
      {/* Animated background container with crossfade */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Current slide with smooth transition */}
        <div
          className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        >
          <CoverFrame game={currentGame} consoleDef={heroConsole} priority className="h-full w-full object-cover" />
        </div>
      </div>

      {/* Animated gradient overlays */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{
          background: `linear-gradient(90deg, ${heroConsole.colorFrom}60 0%, ${heroConsole.colorTo}30 40%, transparent 70%)`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-night/90 via-night/50 to-transparent transition-opacity duration-500 ease-in-out" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-night/30" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-12">
        {/* Top section: Console badge */}
        <div>
          <div
            key={`${currentGame.id}-badge`}
            className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase transition-all duration-300 carousel-slide-in"
            style={{
              backgroundColor: `${heroConsole.accent}30`,
              color: heroConsole.accent,
              border: `1px solid ${heroConsole.accent}50`
            }}
          >
            {heroConsole.shortName}
          </div>
        </div>

        {/* Bottom section: Game info */}
        <div className="max-w-2xl overflow-hidden">
          {/* Featured badge */}
          <div 
            key={`${currentGame.id}-featured`}
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-black/40 px-3 py-1.5 text-xs font-bold uppercase text-white/70 backdrop-blur-xl carousel-slide-in"
            style={{ animationDelay: '0.1s' }}
          >
            <Flame className="h-3.5 w-3.5 text-ember" />
            Destacado
          </div>

          {/* Game title with fade animation */}
          <h1
            key={`${currentGame.id}-title`}
            className="font-display text-5xl font-bold leading-[1.05] text-white md:text-6xl lg:text-7xl drop-shadow-2xl carousel-fade-in"
          >
            {currentGame.title}
          </h1>

          {/* Console description */}
          <p 
            key={`${currentGame.id}-desc`}
            className="mt-4 max-w-md text-base leading-7 text-white/70 carousel-slide-in"
            style={{ animationDelay: '0.15s' }}
          >
            {heroConsole.description}
          </p>

          {/* Action buttons */}
          <div 
            key={`${currentGame.id}-buttons`}
            className="mt-8 flex flex-wrap gap-3 carousel-slide-in"
            style={{ animationDelay: '0.25s' }}
          >
            <button
              type="button"
              onClick={() => onLaunchGame(currentGame)}
              data-focusable-id="hero-play"
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-white px-8 text-base font-extrabold text-night shadow-lg transition hover:bg-mint hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Jugar
            </button>
            <button
              type="button"
              onClick={() => onOpenGame(currentGame)}
              data-focusable-id="hero-details"
              className="inline-flex h-14 items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
            >
              Detalles
            </button>
          </div>
        </div>
      </div>

      {/* Indicator dots - Bottom center */}
      <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 gap-2 pb-4">
        {featuredGames.map((game, index) => (
          <button
            key={game.id}
            onClick={() => goToIndex(index)}
            onMouseEnter={() => setIsAutoPlay(false)}
            onMouseLeave={() => setIsAutoPlay(true)}
            className={`inline-flex h-1.5 w-1.5 flex-none items-center justify-center rounded-full p-0 min-w-0 min-h-0 transition-colors duration-200 ${
              index === currentIndex
                ? 'bg-white'
                : 'bg-white/40 hover:bg-white/70 cursor-pointer'
            }`}
            aria-label={`Ir al juego ${index + 1}`}
          />
        ))}
      </div>


    </section>
  )
}
