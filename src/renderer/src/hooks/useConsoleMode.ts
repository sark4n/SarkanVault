/**
 * Console Mode: fullscreen, cursor-hiding, gamepad-only experience
 * similar to Steam Big Picture / Xbox Dashboard.
 */
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sarkanvault:console-mode'

export interface ConsoleModeState {
  enabled: boolean
  isFullscreen: boolean
  toggle: () => void
  enterFullscreen: () => void
  exitFullscreen: () => void
}

export function useConsoleMode(): ConsoleModeState {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Track real fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // When console mode is enabled, auto-enter fullscreen
  useEffect(() => {
    if (enabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else if (!enabled && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [enabled])

  // Apply body class for CSS targeting
  useEffect(() => {
    if (enabled) {
      document.body.classList.add('console-mode')
    } else {
      document.body.classList.remove('console-mode')
    }
  }, [enabled])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {})
  }, [])

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen().catch(() => {})
  }, [])

  return { enabled, isFullscreen, toggle, enterFullscreen, exitFullscreen }
}
