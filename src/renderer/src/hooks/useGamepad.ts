import { useEffect, useState, useCallback } from 'react'
import { gamepadManager, GamepadAction, GamepadInfo } from '@renderer/lib/gamepadManager'
import { focusInDirection, clickFocused } from '@renderer/lib/spatialNav'

export interface UseGamepadOptions {
  onAction?: (action: GamepadAction) => void
}

export interface GamepadState {
  connected: GamepadInfo[]
  isActive: boolean
}

export function useGamepad(options: UseGamepadOptions = {}): GamepadState {
  const [connected, setConnected] = useState<GamepadInfo[]>(() => gamepadManager.getConnected())
  const [isActive, setIsActive] = useState(false)

  const { onAction } = options

  const handleAction = useCallback((action: GamepadAction) => {
    setIsActive(true)
    document.body.classList.add('gamepad-mode')

    switch (action) {
      case 'up': focusInDirection('up'); break
      case 'down': focusInDirection('down'); break
      case 'left': focusInDirection('left'); break
      case 'right': focusInDirection('right'); break
      case 'select': clickFocused(); break
      default:
        break
    }

    onAction?.(action)
  }, [onAction])

  useEffect(() => {
    gamepadManager.start()

    const unsubAction = gamepadManager.onAction(handleAction)
    const unsubConnect = gamepadManager.onConnect((info) => {
      setConnected(gamepadManager.getConnected())
    })
    const unsubDisconnect = gamepadManager.onDisconnect((info) => {
      setConnected(gamepadManager.getConnected())
    })

    const handleMouseMove = () => {
      setIsActive(false)
      document.body.classList.remove('gamepad-mode')
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      unsubAction()
      unsubConnect()
      unsubDisconnect()
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleAction])

  return { connected, isActive }
}
