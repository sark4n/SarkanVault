import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ConsoleId,
  CoverSearchResponse,
  CoverSearchResult,
  EmulatorConfig,
  GameEntry,
  LibrarySnapshot,
  MetadataSettings,
} from '@shared/types'
import type { GamepadAction } from '@renderer/lib/gamepadManager'
import { AppShell } from '@renderer/components/AppShell'
import { Toast } from '@renderer/components/Toast'
import { retroApi } from '@renderer/lib/api'
import { useGamepad } from '@renderer/hooks/useGamepad'
import { saveFocusForView, restoreFocusForView, focusFirst } from '@renderer/lib/spatialNav'
import { ConsoleScreen } from '@renderer/views/ConsoleScreen'
import { GameDetailsScreen } from '@renderer/views/GameDetailsScreen'
import { HomeScreen } from '@renderer/views/HomeScreen'
import { SearchScreen } from '@renderer/views/SearchScreen'
import { SettingsScreen } from '@renderer/views/SettingsScreen'

type View =
  | { name: 'home' }
  | { name: 'console'; consoleId: ConsoleId }
  | { name: 'game'; gameId: string; returnTo?: ConsoleId }
  | { name: 'settings' }
  | { name: 'search' }

interface ToastState {
  message: string
  tone: 'success' | 'error' | 'info'
}

export default function App(): JSX.Element {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot>()
  const [view, setView] = useState<View>({ name: 'home' })
  const [isBusy, setIsBusy] = useState(false)
  const [toast, setToast] = useState<ToastState>()
  const [transitionKey, setTransitionKey] = useState(0)
  const prevViewName = useRef<string>(view.name)
  const viewRef = useRef<View>(view)
  const snapshotRef = useRef<LibrarySnapshot | undefined>(snapshot)

  useEffect(() => { viewRef.current = view }, [view])
  useEffect(() => { snapshotRef.current = snapshot }, [snapshot])

  const showToast = useCallback((message: string, tone: ToastState['tone'] = 'info') => {
    setToast({ message, tone })
  }, [])

  const refreshSnapshot = useCallback(async () => {
    const next = await retroApi.getSnapshot()
    setSnapshot(next)
  }, [])

  useEffect(() => {
    refreshSnapshot().catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al cargar la biblioteca.', 'error')
    })
  }, [refreshSnapshot, showToast])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(undefined), 5200)
    return () => window.clearTimeout(id)
  }, [toast])

  // ── View transitions with focus memory ────────────────────────────────────
  useEffect(() => {
    if (prevViewName.current !== view.name) {
      // Save focus for the view we're leaving
      saveFocusForView(prevViewName.current)

      prevViewName.current = view.name
      setTransitionKey((k) => k + 1)

      // After the new view renders, try to restore or focus first element
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const restored = restoreFocusForView(view.name)
          if (!restored && document.body.classList.contains('gamepad-mode')) {
            focusFirst()
          }
        })
      })
    }
  }, [view.name])

  const withBusy = useCallback(async (task: () => Promise<void>) => {
    setIsBusy(true)
    try { await task() } finally { setIsBusy(false) }
  }, [])

  const handleScan = useCallback(async () => {
    await withBusy(async () => {
      const result = await retroApi.scanLibrary()
      setSnapshot(result.snapshot)
      showToast(`Escaneo completado. ${result.summary.totalGames} juegos encontrados.`, 'success')
    }).catch((err) => showToast(err instanceof Error ? err.message : 'Error al escanear.', 'error'))
  }, [showToast, withBusy])

  const handleDetect = useCallback(async () => {
    await withBusy(async () => {
      const result = await retroApi.detectEmulators()
      setSnapshot(result.snapshot)
      const n = result.detections.length
      showToast(
        n ? `Se detectaron ${n} emulador${n > 1 ? 'es' : ''}.` : 'No se detectaron emuladores automáticamente.',
        n ? 'success' : 'info'
      )
    }).catch((err) => showToast(err instanceof Error ? err.message : 'Error al detectar.', 'error'))
  }, [showToast, withBusy])

  const handleSaveEmulator = useCallback(async (config: EmulatorConfig) => {
    await withBusy(async () => {
      const next = await retroApi.saveEmulator(config)
      setSnapshot(next)
      showToast('Configuración guardada.', 'success')
    }).catch((err) => showToast(err instanceof Error ? err.message : 'Error al guardar.', 'error'))
  }, [showToast, withBusy])

  const handleSaveMetadataSettings = useCallback(async (settings: MetadataSettings) => {
    await withBusy(async () => {
      const next = await retroApi.saveMetadataSettings(settings)
      setSnapshot(next)
      showToast('Configuración de carátulas guardada.', 'success')
    }).catch((err) => showToast(err instanceof Error ? err.message : 'Error al guardar.', 'error'))
  }, [showToast, withBusy])

  const handleLaunchGame = useCallback(async (game: GameEntry) => {
    const result = await retroApi.launchGame(game.id)
    setSnapshot(result.snapshot)
    showToast(result.result.message, result.result.ok ? 'success' : 'error')
  }, [showToast])

  const handleToggleFavorite = useCallback(async (game: GameEntry) => {
    const next = await retroApi.toggleFavorite(game.id)
    setSnapshot(next)
    showToast(game.favorite ? 'Eliminado de favoritos.' : 'Añadido a favoritos.', 'success')
  }, [showToast])

  const handleSearchCovers = useCallback(async (game: GameEntry, query?: string): Promise<CoverSearchResponse> => {
    const response = await retroApi.searchCovers(game.id, query)
    if (response.warnings[0]) showToast(response.warnings[0], 'info')
    return response
  }, [showToast])

  const handleDownloadCover = useCallback(async (game: GameEntry, cover: CoverSearchResult) => {
    await withBusy(async () => {
      const response = await retroApi.downloadCover(game.id, cover)
      setSnapshot(response.snapshot)
      showToast(response.result.message, response.result.ok ? 'success' : 'error')
    })
  }, [showToast, withBusy])

  const handleDownloadMissingCovers = useCallback(async (consoleId?: ConsoleId) => {
    await withBusy(async () => {
      const response = await retroApi.downloadMissingCovers(consoleId, 30)
      setSnapshot(response.snapshot)
      showToast(
        `Carátulas: ${response.summary.downloaded} descargadas, ${response.summary.skipped} omitidas, ${response.summary.failed} fallidas.`,
        response.summary.failed ? 'info' : 'success'
      )
    }).catch((err) => showToast(err instanceof Error ? err.message : 'Error al descargar.', 'error'))
  }, [showToast, withBusy])

  const openGame = useCallback((game: GameEntry) => {
    setView((v) => ({
      name: 'game',
      gameId: game.id,
      returnTo: v.name === 'console' ? (v as { consoleId: ConsoleId }).consoleId : undefined,
    }))
  }, [])

  const goBack = useCallback(() => {
    const v = viewRef.current
    if (v.name === 'game') {
      if ('returnTo' in v && v.returnTo) setView({ name: 'console', consoleId: v.returnTo })
      else setView({ name: 'home' })
    } else if (v.name === 'console' || v.name === 'settings' || v.name === 'search') {
      setView({ name: 'home' })
    }
  }, [])

  const toggleFocusedFavorite = useCallback(async () => {
    const snap = snapshotRef.current
    if (!snap) return
    const focused = document.activeElement
    const gameId = focused?.closest('[data-game-id]')?.getAttribute('data-game-id')
    if (!gameId) return
    const game = snap.games.find((g) => g.id === gameId)
    if (game) await handleToggleFavorite(game)
  }, [handleToggleFavorite])

  // ── Gamepad global actions ─────────────────────────────────────────────────
  useGamepad({
    onAction: useCallback(
      (action: GamepadAction) => {
        switch (action) {
          case 'back':     goBack();                       break
          case 'menu':     setView({ name: 'home' });      break
          case 'search':   setView({ name: 'search' });    break
          case 'favorite': void toggleFocusedFavorite();   break
          case 'lb':       setView({ name: 'home' });      break
          case 'rb':       setView({ name: 'search' });    break
          default: break
        }
      },
      [goBack, toggleFocusedFavorite]
    ),
  })

  const selectedGame = useMemo(() => {
    if (!snapshot || view.name !== 'game') return undefined
    return snapshot.games.find((g) => g.id === view.gameId)
  }, [snapshot, view])

  if (!snapshot) {
    return (
      <div className="grid min-h-screen place-items-center bg-night text-white">
        <div className="rounded-xl border border-white/8 bg-white/[0.045] p-8 text-center shadow-card">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-mint" />
          <p className="text-sm font-bold uppercase tracking-widest text-white/54">
            Cargando Sarkan Vault
          </p>
        </div>
      </div>
    )
  }

  const activeView = view.name === 'game' ? 'console' : view.name

  let viewContent: React.ReactNode = null

  if (view.name === 'home') {
    viewContent = (
      <HomeScreen
        snapshot={snapshot}
        onOpenConsole={(id) => setView({ name: 'console', consoleId: id })}
        onOpenGame={openGame}
        onLaunchGame={handleLaunchGame}
      />
    )
  } else if (view.name === 'search') {
    viewContent = (
      <SearchScreen
        snapshot={snapshot}
        onOpenGame={openGame}
        onLaunchGame={handleLaunchGame}
      />
    )
  } else if (view.name === 'console') {
    viewContent = (
      <ConsoleScreen
        consoleId={view.consoleId}
        snapshot={snapshot}
        onOpenGame={openGame}
        onLaunchGame={handleLaunchGame}
        onOpenSettings={() => setView({ name: 'settings' })}
      />
    )
  } else if (view.name === 'game' && selectedGame) {
    viewContent = (
      <GameDetailsScreen
        game={selectedGame}
        snapshot={snapshot}
        onBack={goBack}
        onLaunch={handleLaunchGame}
        onToggleFavorite={handleToggleFavorite}
        onSearchCovers={handleSearchCovers}
        onDownloadCover={handleDownloadCover}
        onRevealPath={(path) => { void retroApi.revealPath(path) }}
      />
    )
  } else if (view.name === 'settings') {
    viewContent = (
      <SettingsScreen
        snapshot={snapshot}
        isBusy={isBusy}
        onDetect={handleDetect}
        onScan={handleScan}
        onSave={handleSaveEmulator}
        onSaveMetadataSettings={handleSaveMetadataSettings}
        onDownloadMissingCovers={handleDownloadMissingCovers}
        onChooseExecutable={retroApi.chooseExecutable}
        onChooseImage={retroApi.chooseImage}
        onChooseFolder={retroApi.chooseFolder}
      />
    )
  }

  return (
    <AppShell
      snapshot={snapshot}
      activeView={activeView}
      isBusy={isBusy}
      onHome={() => setView({ name: 'home' })}
      onSearch={() => setView({ name: 'search' })}
      onSettings={() => setView({ name: 'settings' })}
      onScan={handleScan}
    >
      <div key={transitionKey} className="animate-view-in">
        {viewContent}
      </div>
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(undefined)} />
    </AppShell>
  )
}
