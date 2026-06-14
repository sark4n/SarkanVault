import { useEffect, useState, useRef } from 'react'
import { Gamepad2 } from 'lucide-react'
import { GamepadInfo, gamepadManager } from '@renderer/lib/gamepadManager'

// ── Controller type icons ─────────────────────────────────────────────────────

function XboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fillOpacity="0.18" stroke="currentColor" strokeWidth="1" fill="none" />
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="7.5"  cy="9.5"  r="1.4" />
      <circle cx="16.5" cy="9.5"  r="1.4" />
      <circle cx="7.5"  cy="14.5" r="1.4" />
      <circle cx="16.5" cy="14.5" r="1.4" />
    </svg>
  )
}

function PlayStationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M11.5 2C7.91 2 5 4.91 5 8.5v7.5l2.5-.86V8.5C7.5 6.29 9.29 4.5 11.5 4.5S15.5 6.29 15.5 8.5v1l2.5.87V8.5C18 4.91 15.09 2 11.5 2zm-.5 6.5v9.5l-2.5.86V8.5h2.5zm3.5 3.14V22l-2.5-.86v-9.36l2.5.86z" />
    </svg>
  )
}

function GenericIcon({ className }: { className?: string }) {
  return <Gamepad2 className={className} aria-hidden="true" />
}

function ControllerIcon({ type, className }: { type: GamepadInfo['type']; className?: string }) {
  if (type === 'playstation') return <PlayStationIcon className={className} />
  if (type === 'xbox')        return <XboxIcon className={className} />
  return <GenericIcon className={className} />
}

// ── Toast notification for connect/disconnect ─────────────────────────────────

interface ControllerToastProps {
  info: GamepadInfo
  event: 'connected' | 'disconnected'
  onDone: () => void
}

function ControllerToast({ info, event, onDone }: ControllerToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  const label = event === 'connected' ? 'Conectado' : 'Desconectado'
  const typeLabel = info.type === 'xbox' ? 'Xbox' : info.type === 'playstation' ? 'PlayStation' : 'Control'
  const color = event === 'connected' ? 'border-mint/40 bg-mint/10 text-mint' : 'border-white/20 bg-white/5 text-white/60'

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-300 ${color}`}
      role="status"
      aria-live="polite"
    >
      <ControllerIcon type={info.type} className="h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{typeLabel} {label}</p>
        <p className="text-[11px] opacity-60 font-mono truncate max-w-[200px]">{info.id.slice(0, 30)}</p>
      </div>
      {event === 'connected' && (
        <span className="ml-auto h-2 w-2 rounded-full bg-mint animate-ping" />
      )}
    </div>
  )
}

// ── Main indicator (shown in sidebar) ────────────────────────────────────────

export function GamepadIndicator() {
  const [gamepads, setGamepads] = useState<GamepadInfo[]>(() => gamepadManager.getConnected())
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const unsubConnect = gamepadManager.onConnect(() => {
      setGamepads(gamepadManager.getConnected())
      setFlash(true)
      setTimeout(() => setFlash(false), 1400)
    })
    const unsubDisconnect = gamepadManager.onDisconnect(() => {
      setGamepads(gamepadManager.getConnected())
    })
    return () => {
      unsubConnect()
      unsubDisconnect()
    }
  }, [])

  const primary = gamepads[0]

  if (!primary) {
    return (
      <div
        title="Sin controlador"
        className="flex h-12 w-12 items-center justify-center rounded-lg text-white/20"
      >
        <Gamepad2 className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div
      title={`${gamepads.length} control${gamepads.length > 1 ? 'es' : ''} conectado${gamepads.length > 1 ? 's' : ''}`}
      className={`relative flex h-12 w-12 items-center justify-center rounded-lg border transition-all duration-300 ${
        flash
          ? 'border-mint/60 bg-mint/20 text-mint scale-110'
          : 'border-white/10 bg-white/5 text-white/60'
      }`}
    >
      <ControllerIcon type={primary.type} className="h-4.5 w-4.5" />
      <span
        className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-mint ${
          flash ? 'animate-ping' : ''
        }`}
      />
      {gamepads.length > 1 && (
        <span className="absolute bottom-1 right-1 text-[8px] font-bold text-mint">
          {gamepads.length}
        </span>
      )}
    </div>
  )
}

// ── Hot-plug toast overlay (mounted at app root) ──────────────────────────────

interface HotplugEvent {
  id: string
  info: GamepadInfo
  event: 'connected' | 'disconnected'
}

export function GamepadHotplugOverlay() {
  const [events, setEvents] = useState<HotplugEvent[]>([])
  const counterRef = useRef(0)

  useEffect(() => {
    const handleConnect = (info: GamepadInfo) => {
      const id = String(counterRef.current++)
      setEvents((prev) => [...prev, { id, info, event: 'connected' }])
    }
    const handleDisconnect = (info: GamepadInfo) => {
      const id = String(counterRef.current++)
      setEvents((prev) => [...prev, { id, info, event: 'disconnected' }])
    }

    const unsubConnect    = gamepadManager.onConnect(handleConnect)
    const unsubDisconnect = gamepadManager.onDisconnect(handleDisconnect)
    return () => {
      unsubConnect()
      unsubDisconnect()
    }
  }, [])

  const remove = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id))

  if (events.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {events.map((ev) => (
        <ControllerToast
          key={ev.id}
          info={ev.info}
          event={ev.event}
          onDone={() => remove(ev.id)}
        />
      ))}
    </div>
  )
}

// ── Gamepad button hint pill ──────────────────────────────────────────────────

type ButtonLabel = 'A' | 'B' | 'X' | 'Y' | '▲' | '✕' | '○' | '□' | 'LB' | 'RB' | '⊕' | '⊗'

interface ButtonHintProps {
  button: ButtonLabel
  label: string
  controllerType?: GamepadInfo['type']
}

function getButtonColor(button: ButtonLabel): string {
  switch (button) {
    case 'A': case '✕': return 'bg-green-500/20 text-green-300 border-green-500/40'
    case 'B': case '○': return 'bg-red-500/20 text-red-300 border-red-500/40'
    case 'X': case '□': return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    case 'Y': case '▲': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
    default:             return 'bg-white/10 text-white/70 border-white/20'
  }
}

export function ButtonHint({ button, label }: ButtonHintProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1 text-[10px] font-black border ${getButtonColor(button)}`}
      >
        {button}
      </span>
      <span className="text-[11px] font-semibold text-white/60">{label}</span>
    </span>
  )
}

// ── Bottom gamepad hint bar (shown in console mode) ───────────────────────────

interface GamepadHintBarProps {
  hints: Array<{ button: ButtonLabel; label: string }>
  visible: boolean
}

export function GamepadHintBar({ hints, visible }: GamepadHintBarProps) {
  if (!visible) return null
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/60 px-5 py-2.5 backdrop-blur-2xl shadow-2xl">
        {hints.map((h, i) => (
          <ButtonHint key={i} button={h.button} label={h.label} />
        ))}
      </div>
    </div>
  )
}
