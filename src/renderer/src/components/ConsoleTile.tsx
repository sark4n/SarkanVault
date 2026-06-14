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
}

export function ConsoleTile({ consoleDef, games, config, onOpen }: ConsoleTileProps): JSX.Element {
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

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onOpen}
      onMouseMove={handleMouseMove}
      aria-label={`${consoleDef.name} — ${games.length} juegos`}
      data-focusable-id={consoleDef.id}
      className="group relative min-h-[260px] overflow-hidden rounded-xl border border-white/8 text-left shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
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

      {/* Dark overlay for readability - less opaque to show image */}
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
      <div className="relative flex h-full min-h-[260px] flex-col justify-between p-6">
        {/* Header section */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">{consoleDef.manufacturer}</p>
            <h3 className="mt-3 font-display text-4xl font-bold tracking-tight text-white drop-shadow-lg">
              {consoleDef.shortName}
            </h3>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${consoleDef.accent}50, ${consoleDef.accent}30)`,
              boxShadow: `0 0 20px ${consoleDef.accent}40`
            }}
          >
            <Gamepad2 className="h-6 w-6" style={{ color: consoleDef.accent }} />
          </div>
        </div>

        {/* Footer section */}
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-white">{games.length}</span>
              <span className="text-sm font-medium text-white/60">juegos</span>
            </div>
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
          </div>

          {/* Action button with animated arrow */}
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/20"
            style={{
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`
            }}
          >
            <ChevronRight className="h-5 w-5 text-white transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </button>
  )
}
