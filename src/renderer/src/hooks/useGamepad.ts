import { useEffect, useState, useCallback, useRef } from 'react'
import { gamepadManager, GamepadAction, GamepadInfo } from '@renderer/lib/gamepadManager'
import { focusInDirection, clickFocused, focusFirst } from '@renderer/lib/spatialNav'

export interface UseGamepadOptions {
  onAction?: (action: GamepadAction) => void
}

export interface GamepadState {
  connected: GamepadInfo[]
  isActive: boolean
}

const MOUSE_INACTIVE_TIMEOUT = 3000

export function useGamepad(options: UseGamepadOptions = {}): GamepadState {
  const [connected, setConnected] = useState<GamepadInfo[]>(() => gamepadManager.getConnected())
  const [isActive, setIsActive] = useState(false)
  const mouseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { onAction } = options

  const activateGamepadMode = useCallback(() => {
    setIsActive(true)
    document.body.classList.add('gamepad-mode')

    // Hide cursor after inactivity
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current)
    mouseTimerRef.current = setTimeout(() => {
      document.documentElement.classList.add('cursor-hidden')
    }, MOUSE_INACTIVE_TIMEOUT)
  }, [])

  const deactivateGamepadMode = useCallback(() => {
    setIsActive(false)
    document.body.classList.remove('gamepad-mode')
    document.documentElement.classList.remove('cursor-hidden')
    if (mouseTimerRef.current) {
      clearTimeout(mouseTimerRef.current)
      mouseTimerRef.current = null
    }
  }, [])

  const handleAction = useCallback(
    (action: GamepadAction) => {
      activateGamepadMode()

      switch (action) {
        case 'up':    focusInDirection('up');    break
        case 'down':  focusInDirection('down');  break
        case 'left':  focusInDirection('left');  break
        case 'right': focusInDirection('right'); break
        case 'select':
          // If nothing is focused, focus the first element; otherwise click it
          if (!document.activeElement || document.activeElement === document.body) {
            focusFirst()
          } else {
            clickFocused()
          }
          break
        default:
          break
      }

      onAction?.(action)
    },
    [activateGamepadMode, onAction]
  )

  useEffect(() => {
    gamepadManager.start()

    const unsubAction     = gamepadManager.onAction(handleAction)
    const unsubConnect    = gamepadManager.onConnect(() => setConnected(gamepadManager.getConnected()))
    const unsubDisconnect = gamepadManager.onDisconnect(() => setConnected(gamepadManager.getConnected()))

    const handleMouseMove = () => {
      deactivateGamepadMode()
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      unsubAction()
      unsubConnect()
      unsubDisconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current)
    }
  }, [handleAction, deactivateGamepadMode])

  return { connected, isActive }
}
