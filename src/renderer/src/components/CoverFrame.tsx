import type { ConsoleDefinition, GameEntry } from '@shared/types'

interface CoverFrameProps {
  game: GameEntry
  consoleDef: ConsoleDefinition
  className?: string
  priority?: boolean
}

export function CoverFrame({ game, consoleDef, className = '', priority = false }: CoverFrameProps): JSX.Element {
  if (game.coverUrl) {
    return (
      <img
        src={game.coverUrl}
        alt={`${game.title} cover`}
        loading={priority ? 'eager' : 'lazy'}
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }

  const initials = game.title
    .split(' ')
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={`relative flex h-full w-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(145deg, ${consoleDef.colorFrom}, ${consoleDef.colorTo})`
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.32),transparent_28%),radial-gradient(circle_at_78%_78%,rgba(0,0,0,0.34),transparent_34%)]" />
      <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase text-white/80 backdrop-blur-md">
        {consoleDef.shortName}
      </div>
      <div className="absolute inset-x-5 top-1/2 -translate-y-1/2">
        <div className="font-display text-5xl font-bold text-white/90 drop-shadow-lg">{initials}</div>
        <div className="mt-4 h-1.5 w-16 rounded-full bg-white/80" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 via-black/30 to-transparent p-5">
        <p className="line-clamp-2 text-lg font-extrabold leading-tight text-white">{game.title}</p>
        <p className="mt-2 text-xs font-semibold uppercase text-white/62">Local cover missing</p>
      </div>
    </div>
  )
}
