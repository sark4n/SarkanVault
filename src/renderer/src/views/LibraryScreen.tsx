import type { ConsoleId, LibrarySnapshot } from '@shared/types'
import { getEmulator } from '@renderer/lib/format'
import { ConsoleTile } from '@renderer/components/ConsoleTile'

interface LibraryScreenProps {
  snapshot: LibrarySnapshot
  onOpenConsole: (consoleId: ConsoleId) => void
}

export function LibraryScreen({ snapshot, onOpenConsole }: LibraryScreenProps): JSX.Element {
  const totalGames = snapshot.games.length
  const configuredCount = snapshot.emulators.filter(e => e.executablePath || e.romFolderPath).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-white">Biblioteca</h2>
        <p className="mt-1 text-sm text-white/54">
          {configuredCount} consola{configuredCount !== 1 ? 's' : ''} configurada{configuredCount !== 1 ? 's' : ''} · {totalGames} juego{totalGames !== 1 ? 's' : ''} en total
        </p>
      </div>

      {snapshot.consoles.length > 0 ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))' }}
        >
          {snapshot.consoles.map((consoleDef) => (
            <ConsoleTile
              key={consoleDef.id}
              consoleDef={consoleDef}
              games={snapshot.games.filter(g => g.consoleId === consoleDef.id)}
              config={getEmulator(snapshot.emulators, consoleDef.id)}
              onOpen={() => onOpenConsole(consoleDef.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-white/40 text-sm">No hay consolas configuradas todavía.</p>
          <p className="text-white/25 text-xs">Ve a Configuración para agregar emuladores.</p>
        </div>
      )}
    </div>
  )
}
