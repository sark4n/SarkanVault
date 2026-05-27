import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ConsoleId,
  CoverSearchResponse,
  CoverSearchResult,
  EmulatorConfig,
  GameEntry,
  LibrarySnapshot,
  MetadataSettings
} from '@shared/types'
import { AppShell } from '@renderer/components/AppShell'
import { Toast } from '@renderer/components/Toast'
import { retroApi } from '@renderer/lib/api'
import { ConsoleScreen } from '@renderer/views/ConsoleScreen'
import { GameDetailsScreen } from '@renderer/views/GameDetailsScreen'
import { HomeScreen } from '@renderer/views/HomeScreen'
import { SettingsScreen } from '@renderer/views/SettingsScreen'

type View =
  | { name: 'home' }
  | { name: 'console'; consoleId: ConsoleId }
  | { name: 'game'; gameId: string; returnTo?: ConsoleId }
  | { name: 'settings' }

interface ToastState {
  message: string
  tone: 'success' | 'error' | 'info'
}

export default function App(): JSX.Element {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot>()
  const [view, setView] = useState<View>({ name: 'home' })
  const [isBusy, setIsBusy] = useState(false)
  const [toast, setToast] = useState<ToastState>()

  const showToast = useCallback((message: string, tone: ToastState['tone'] = 'info') => {
    setToast({ message, tone })
  }, [])

  const refreshSnapshot = useCallback(async () => {
    const nextSnapshot = await retroApi.getSnapshot()
    setSnapshot(nextSnapshot)
  }, [])

  useEffect(() => {
    refreshSnapshot().catch((error) => {
      showToast(error instanceof Error ? error.message : 'Failed to load the local library.', 'error')
    })
  }, [refreshSnapshot, showToast])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(undefined), 5200)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const selectedGame = useMemo(() => {
    if (!snapshot || view.name !== 'game') return undefined
    return snapshot.games.find((game) => game.id === view.gameId)
  }, [snapshot, view])

  const withBusy = useCallback(
    async (task: () => Promise<void>) => {
      setIsBusy(true)
      try {
        await task()
      } finally {
        setIsBusy(false)
      }
    },
    []
  )

  const handleScan = useCallback(async () => {
    await withBusy(async () => {
      const result = await retroApi.scanLibrary()
      setSnapshot(result.snapshot)
      showToast(`Scan complete. Found ${result.summary.totalGames} local games.`, 'success')
    }).catch((error) => {
      showToast(error instanceof Error ? error.message : 'Library scan failed.', 'error')
    })
  }, [showToast, withBusy])

  const handleDetect = useCallback(async () => {
    await withBusy(async () => {
      const result = await retroApi.detectEmulators()
      setSnapshot(result.snapshot)
      const message = result.detections.length
        ? `Detected ${result.detections.length} emulator configuration${result.detections.length === 1 ? '' : 's'}.`
        : 'No installed emulators were detected automatically. You can still configure paths manually.'
      showToast(message, result.detections.length ? 'success' : 'info')
    }).catch((error) => {
      showToast(error instanceof Error ? error.message : 'Emulator detection failed.', 'error')
    })
  }, [showToast, withBusy])

  const handleSaveEmulator = useCallback(
    async (config: EmulatorConfig) => {
      await withBusy(async () => {
        const nextSnapshot = await retroApi.saveEmulator(config)
        setSnapshot(nextSnapshot)
        showToast('Console configuration saved.', 'success')
      }).catch((error) => {
        showToast(error instanceof Error ? error.message : 'Could not save configuration.', 'error')
      })
    },
    [showToast, withBusy]
  )

  const handleSaveMetadataSettings = useCallback(
    async (settings: MetadataSettings) => {
      await withBusy(async () => {
        const nextSnapshot = await retroApi.saveMetadataSettings(settings)
        setSnapshot(nextSnapshot)
        showToast('Online cover settings saved.', 'success')
      }).catch((error) => {
        showToast(error instanceof Error ? error.message : 'Could not save online cover settings.', 'error')
      })
    },
    [showToast, withBusy]
  )

  const handleLaunchGame = useCallback(
    async (game: GameEntry) => {
      const result = await retroApi.launchGame(game.id)
      setSnapshot(result.snapshot)
      showToast(result.result.message, result.result.ok ? 'success' : 'error')
    },
    [showToast]
  )

  const handleToggleFavorite = useCallback(
    async (game: GameEntry) => {
      const nextSnapshot = await retroApi.toggleFavorite(game.id)
      setSnapshot(nextSnapshot)
      showToast(game.favorite ? 'Removed from favorites.' : 'Added to favorites.', 'success')
    },
    [showToast]
  )

  const handleSearchCovers = useCallback(
    async (game: GameEntry, query?: string): Promise<CoverSearchResponse> => {
      const response = await retroApi.searchCovers(game.id, query)
      if (response.warnings[0]) showToast(response.warnings[0], 'info')
      return response
    },
    [showToast]
  )

  const handleDownloadCover = useCallback(
    async (game: GameEntry, cover: CoverSearchResult) => {
      await withBusy(async () => {
        const response = await retroApi.downloadCover(game.id, cover)
        setSnapshot(response.snapshot)
        showToast(response.result.message, response.result.ok ? 'success' : 'error')
      })
    },
    [showToast, withBusy]
  )

  const handleDownloadMissingCovers = useCallback(
    async (consoleId?: ConsoleId) => {
      await withBusy(async () => {
        const response = await retroApi.downloadMissingCovers(consoleId, 30)
        setSnapshot(response.snapshot)
        showToast(
          `Cover search complete. Downloaded ${response.summary.downloaded}, skipped ${response.summary.skipped}, failed ${response.summary.failed}.`,
          response.summary.failed ? 'info' : 'success'
        )
      }).catch((error) => {
        showToast(error instanceof Error ? error.message : 'Missing cover download failed.', 'error')
      })
    },
    [showToast, withBusy]
  )

  const openGame = useCallback(
    (game: GameEntry) => {
      setView({ name: 'game', gameId: game.id, returnTo: view.name === 'console' ? view.consoleId : undefined })
    },
    [view]
  )

  if (!snapshot) {
    return (
      <div className="grid min-h-screen place-items-center bg-night text-white">
        <div className="rounded-lg border border-white/8 bg-white/[0.045] p-8 text-center shadow-card">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-mint" />
          <p className="text-sm font-bold uppercase text-white/54">Loading RetroForge</p>
        </div>
      </div>
    )
  }

  const activeView = view.name === 'game' ? 'console' : view.name

  return (
    <AppShell
      snapshot={snapshot}
      activeView={activeView}
      isBusy={isBusy}
      onHome={() => setView({ name: 'home' })}
      onSettings={() => setView({ name: 'settings' })}
      onScan={handleScan}
    >
      {view.name === 'home' ? (
        <HomeScreen
          snapshot={snapshot}
          onOpenConsole={(consoleId) => setView({ name: 'console', consoleId })}
          onOpenGame={openGame}
          onLaunchGame={handleLaunchGame}
        />
      ) : null}

      {view.name === 'console' ? (
        <ConsoleScreen
          consoleId={view.consoleId}
          snapshot={snapshot}
          onOpenGame={openGame}
          onLaunchGame={handleLaunchGame}
          onOpenSettings={() => setView({ name: 'settings' })}
        />
      ) : null}

      {view.name === 'game' && selectedGame ? (
        <GameDetailsScreen
          game={selectedGame}
          snapshot={snapshot}
          onBack={() => (view.returnTo ? setView({ name: 'console', consoleId: view.returnTo }) : setView({ name: 'home' }))}
          onLaunch={handleLaunchGame}
          onToggleFavorite={handleToggleFavorite}
          onSearchCovers={handleSearchCovers}
          onDownloadCover={handleDownloadCover}
          onRevealPath={(filePath) => {
            void retroApi.revealPath(filePath)
          }}
        />
      ) : null}

      {view.name === 'settings' ? (
        <SettingsScreen
          snapshot={snapshot}
          isBusy={isBusy}
          onDetect={handleDetect}
          onScan={handleScan}
          onSave={handleSaveEmulator}
          onSaveMetadataSettings={handleSaveMetadataSettings}
          onDownloadMissingCovers={handleDownloadMissingCovers}
          onChooseExecutable={retroApi.chooseExecutable}
          onChooseFolder={retroApi.chooseFolder}
        />
      ) : null}

      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(undefined)} />
    </AppShell>
  )
}
