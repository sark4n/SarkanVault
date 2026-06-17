import { ChevronRight, Gamepad2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ConsoleDefinition, EmulatorConfig, GameEntry } from '@shared/types'
import { isConfigured } from '@renderer/lib/format'

function toMediaUrl(filePath: string): string {
  const encoded = btoa(unescape(encodeURIComponent(filePath)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `retro-media://local/${encoded}`
}

interface ConsoleTileProps {
  consoleDef: ConsoleDefinition
  games: GameEntry[]
  config?: EmulatorConfig
  onOpen: () => void
  compact?: boolean
}

export function ConsoleTile({ consoleDef, games, config, onOpen, compact = false }: ConsoleTileProps): JSX.Element {
  const imageUrl = config?.consoleImageUrl || consoleDef.imageUrl
  const configured = isConfigured(config)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const tileRef = useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!tileRef.current) return
    const rect = tileRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  const tileMinHeight = compact ? '180px' : '260px'
  const padding = compact ? 'p-4' : 'p-6'
  const titleSize = compact ? 'text-2xl' : 'text-4xl'
  const iconSize = compact ? 'h-8 w-8' : 'h-12 w-12'
  const gameCountSize = compact ? 'text-xl' : 'text-3xl'
  const manufacturerHide = compact ? 'hidden' : ''

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onOpen}
      onMouseMove={handleMouseMove}
      aria-label={`${consoleDef.name} — ${games.length} juegos`}
      data-focusable-id={consoleDef.id}
      className="group relative overflow-hidden rounded-xl border border-white/8 text-left shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
      style={{ minHeight: tileMinHeight }}
    >
      {/* Background image */}
      {imageUrl ? (
        <img
          src={imageUrl.startsWith('http') ? imageUrl : toMediaUrl(imageUrl)}
          alt={consoleDef.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${consoleDef.colorFrom}, ${consoleDef.colorTo})`
          }}
        />
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Subtle accent color overlay on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-30"
        style={{
          background: `linear-gradient(135deg, ${consoleDef.colorFrom}, ${consoleDef.colorTo})`
        }}
      />

      {/* Radial glow effect following mouse */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${consoleDef.accent}30 0%, transparent 50%)`
        }}
      />

      {/* Top highlight/shine */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_50%)]" />

      {/* Content container */}
      <div className={`relative flex h-full flex-col justify-between ${padding}`} style={{ minHeight: tileMinHeight }}>
        {/* Header section */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold uppercase tracking-wider text-white/70 ${manufacturerHide}`}>{consoleDef.manufacturer}</p>
            <h3 className={`mt-1 font-display font-bold tracking-tight text-white drop-shadow-lg truncate ${titleSize}`}>
              {consoleDef.shortName}
            </h3>
          </div>
          <div
            className={`flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 shrink-0 ${iconSize}`}
            style={{
              background: `linear-gradient(135deg, ${consoleDef.accent}50, ${consoleDef.accent}30)`,
              boxShadow: `0 0 20px ${consoleDef.accent}40`
            }}
          >
            <Gamepad2 className={`${compact ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: consoleDef.accent }} />
          </div>
        </div>

        {/* Footer section */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className={`font-display font-bold text-white ${gameCountSize}`}>{games.length}</span>
              <span className={`font-medium text-white/60 ${compact ? 'text-xs' : 'text-sm'}`}>juegos</span>
            </div>
            {!compact && (
              <p className="mt-1 text-xs font-semibold text-white/50">
                {configured ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Configurado
                  </span>
                ) : (
                  <span className="text-amber-400">Necesita configuracion</span>
                )}
              </p>
            )}
          </div>

          {/* Action button */}
          <span
            className={`inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/20 shrink-0 ${iconSize}`}
            style={{
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`
            }}
          >
            <ChevronRight className={`text-white transition-transform duration-300 group-hover:translate-x-0.5 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </span>
        </div>
      </div>
    </button>
  )
}
