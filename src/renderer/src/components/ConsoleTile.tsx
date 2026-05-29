import { ChevronRight } from 'lucide-react'
import type { ConsoleDefinition, EmulatorConfig, GameEntry } from '@shared/types'
import { isConfigured } from '@renderer/lib/format'

interface ConsoleTileProps {
  consoleDef: ConsoleDefinition
  games: GameEntry[]
  config?: EmulatorConfig
  onOpen: () => void
}

export function ConsoleTile({ consoleDef, games, config, onOpen }: ConsoleTileProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative min-h-[180px] overflow-hidden rounded-lg border border-white/8 p-5 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-white/24 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
    >
      {consoleDef.imageUrl ? (
        <>
          <img
            src={consoleDef.imageUrl}
            alt={consoleDef.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${consoleDef.colorFrom}cc, ${consoleDef.colorTo}aa)`
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.52))]" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${consoleDef.colorFrom}, ${consoleDef.colorTo})`
          }}
        />
      )}
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-white/68">{consoleDef.manufacturer}</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-white">{consoleDef.shortName}</h3>
          </div>
        </div>
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/80">{games.length} juegos</p>
            <p className="mt-1 text-xs text-white/58">{isConfigured(config) ? 'Configurado' : 'Necesita configuración'}</p>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-night transition group-hover:translate-x-1">
            <ChevronRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </button>
  )
}
