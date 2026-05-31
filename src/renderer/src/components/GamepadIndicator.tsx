import { useEffect, useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { GamepadInfo, gamepadManager } from '@renderer/lib/gamepadManager'

function ControllerIcon({ type }: { type: GamepadInfo['type'] }) {
  if (type === 'playstation') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M11.5 1C7.36 1 4 4.36 4 8.5v7l3-1V8.5C7 5.47 9.02 3 11.5 3S16 5.47 16 8.5v.88l3 1.04V8.5C19 4.36 15.64 1 11.5 1zm-.5 7v8.88l-3 1.04V8h3zm4 2.96V21l-3-1.04v-8.96l3 .96z" />
      </svg>
    )
  }
  if (type === 'xbox') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="8" cy="9" r="1.5" />
        <circle cx="16" cy="9" r="1.5" />
        <circle cx="8" cy="15" r="1.5" />
        <circle cx="16" cy="15" r="1.5" />
      </svg>
    )
  }
  return <Gamepad2 className="h-4 w-4" />
}

export function GamepadIndicator() {
  const [gamepads, setGamepads] = useState<GamepadInfo[]>(() => gamepadManager.getConnected())
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const unsubConnect = gamepadManager.onConnect(() => {
      setGamepads(gamepadManager.getConnected())
      setFlash(true)
      setTimeout(() => setFlash(false), 1200)
    })
    const unsubDisconnect = gamepadManager.onDisconnect(() => {
      setGamepads(gamepadManager.getConnected())
    })
    return () => { unsubConnect(); unsubDisconnect() }
  }, [])

  if (gamepads.length === 0) {
    return (
      <div title="Sin controlador" className="flex h-12 w-12 items-center justify-center rounded-lg text-white/20">
        <Gamepad2 className="h-5 w-5" />
      </div>
    )
  }

  const primary = gamepads[0]

  return (
    <div
      title={`${gamepads.length} controlador${gamepads.length > 1 ? 'es' : ''} conectado${gamepads.length > 1 ? 's' : ''}`}
      className={`relative flex h-12 w-12 items-center justify-center rounded-lg border transition-all duration-300 ${
        flash
          ? 'border-mint/60 bg-mint/20 text-mint'
          : 'border-white/10 bg-white/5 text-white/60'
      }`}
    >
      <ControllerIcon type={primary.type} />
      <span
        className={`absolute right-2 top-2 h-2 w-2 rounded-full ${flash ? 'bg-mint animate-ping' : 'bg-mint'}`}
      />
      {gamepads.length > 1 && (
        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-bold text-mint">
          {gamepads.length}
        </span>
      )}
    </div>
  )
}
