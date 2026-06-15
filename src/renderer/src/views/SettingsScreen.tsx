import { Cloud, Cpu, Database, Download, FolderOpen, Image, RefreshCw, Save, Search, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ConsoleId, EmulatorConfig, LibrarySnapshot, MetadataSettings } from '@shared/types'
import { getConsole, shortPath } from '@renderer/lib/format'

interface SettingsScreenProps {
  snapshot: LibrarySnapshot
  isBusy: boolean
  showHidden: boolean
  onDetect: () => Promise<void>
  onScan: () => Promise<void>
  onSave: (config: EmulatorConfig) => Promise<void>
  onSaveMetadataSettings: (settings: MetadataSettings) => Promise<void>
  onToggleShowHidden: () => void
  onDownloadMissingCovers: (consoleId?: ConsoleId) => Promise<void>
  onChooseExecutable: () => Promise<string | undefined>
  onChooseImage: () => Promise<string | undefined>
  onChooseFolder: () => Promise<string | undefined>
}

export function SettingsScreen({
  snapshot,
  isBusy,
  showHidden,
  onDetect,
  onScan,
  onSave,
  onSaveMetadataSettings,
  onToggleShowHidden,
  onDownloadMissingCovers,
  onChooseExecutable,
  onChooseImage,
  onChooseFolder
}: SettingsScreenProps): JSX.Element {
  const [drafts, setDrafts] = useState<Record<string, EmulatorConfig>>({})
  const [metadataDraft, setMetadataDraft] = useState<MetadataSettings>(() => createMetadataDraft(snapshot))
  const [selectedConsoleId, setSelectedConsoleId] = useState<ConsoleId>(snapshot.consoles[0].id)
  const selectedConsole = getConsole(snapshot.consoles, selectedConsoleId)
  const selectedDraft = drafts[selectedConsoleId]
  const isPc = selectedConsoleId === 'pc'

  useEffect(() => {
    setDrafts(Object.fromEntries(snapshot.emulators.map((config) => [config.consoleId, config])))
  }, [snapshot.emulators])

  useEffect(() => {
    setMetadataDraft(createMetadataDraft(snapshot))
  }, [snapshot.metadataSettings])

  const configuredCount = useMemo(
    () => snapshot.emulators.filter((config) => config.executablePath || config.romFolderPath).length,
    [snapshot.emulators]
  )

  const updateDraft = (consoleId: ConsoleId, patch: Partial<EmulatorConfig>): void => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [consoleId]: {
        ...currentDrafts[consoleId],
        ...patch
      }
    }))
  }

  const chooseExecutable = async (): Promise<void> => {
    const filePath = await onChooseExecutable()
    if (filePath) updateDraft(selectedConsoleId, { executablePath: filePath })
  }

  const chooseFolder = async (field: 'romFolderPath' | 'coverFolderPath'): Promise<void> => {
    const folderPath = await onChooseFolder()
    if (folderPath) updateDraft(selectedConsoleId, { [field]: folderPath })
  }

  const chooseConsoleImage = async (): Promise<void> => {
    const imagePath = await onChooseImage()
    if (imagePath) updateDraft(selectedConsoleId, { consoleImageUrl: imagePath })
  }

  if (!selectedDraft) {
    return <div className="rounded-lg border border-white/8 bg-white/[0.045] p-8 text-white/70">Cargando configuración...</div>
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] p-7 shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(92,242,196,0.16),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(255,79,139,0.14),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase text-white/44">Configuración local</p>
            <h1 className="mt-3 font-display text-5xl font-bold text-white md:text-7xl">Configuración de Biblioteca</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/62">
              Detecta los emuladores instalados, asigna carpetas de ROMs, indica carpetas de carátulas en tu arte local y luego escanea.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onDetect}
              disabled={isBusy}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-white/12 bg-white/8 px-5 text-sm font-bold text-white transition hover:bg-white/14 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Detectar emuladores
            </button>
            <button
              type="button"
              onClick={onScan}
              disabled={isBusy}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-5 text-sm font-extrabold text-night transition hover:bg-mint disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
              Escanear biblioteca
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SetupStat icon={<Cpu className="h-5 w-5" />} label="Sistemas configurados" value={`${configuredCount}/${snapshot.consoles.length}`} />
        <SetupStat icon={<Database className="h-5 w-5" />} label="Juegos escaneados" value={String(snapshot.stats.totalGames)} />
        <SetupStat icon={<Settings2 className="h-5 w-5" />} label="Modo de datos" value={metadataDraft.steamGridDb.enabled || metadataDraft.screenScraper.enabled ? 'Híbrido' : 'JSON Offline'} />
      </section>

      <section className="rounded-lg border border-white/8 bg-white/[0.045] p-6 shadow-card">
        <p className="text-xs font-extrabold uppercase text-white/42">Opciones de biblioteca</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">Visibilidad de Juegos</h2>
        <p className="mt-2 text-sm text-white/54">Controla qué juegos se muestran en tu biblioteca.</p>
        
        <div className="mt-5 flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] p-4">
          <div>
            <p className="font-bold text-white">Mostrar juegos ocultos</p>
            <p className="mt-1 text-sm text-white/50">Visualiza los juegos que has ocultado de tu biblioteca</p>
          </div>
          <button
            type="button"
            onClick={onToggleShowHidden}
            className={`inline-flex h-10 w-16 items-center rounded-full transition ${
              showHidden
                ? 'bg-mint/20 border border-mint/40'
                : 'bg-white/8 border border-white/12'
            }`}
          >
            <div
              className={`h-8 w-8 rounded-full bg-white transition-transform ${
                showHidden ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] shadow-card backdrop-blur-2xl">
        <div className="border-b border-white/8 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase text-white/42">Carátulas online</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-white">Proveedores de Arte</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/54">
                Las búsquedas se ejecutan solo cuando se solicitan y las imágenes descargadas se almacenan en tus carpetas de carátulas locales.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onDownloadMissingCovers(selectedConsoleId)}
                disabled={isBusy}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-white/12 bg-white/8 px-4 text-sm font-bold text-white transition hover:bg-white/14 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Faltantes para plataforma
              </button>
              <button
                type="button"
                onClick={() => onDownloadMissingCovers()}
                disabled={isBusy}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-extrabold text-night transition hover:bg-mint disabled:opacity-50"
              >
                <Cloud className="h-4 w-4" />
                Faltantes para todas
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-2">
          <div className="rounded-lg border border-white/8 bg-black/18 p-5">
            <ProviderToggle
              title="SteamGridDB"
              enabled={metadataDraft.steamGridDb.enabled}
              onChange={(enabled) =>
                setMetadataDraft((draft) => ({
                  ...draft,
                  steamGridDb: { ...draft.steamGridDb, enabled }
                }))
              }
            />
            <Field
              label={snapshot.metadataSettings.steamGridDb.hasApiKey ? 'Clave API (guardada)' : 'Clave API'}
              value={metadataDraft.steamGridDb.apiKey}
              onChange={(apiKey) =>
                setMetadataDraft((draft) => ({
                  ...draft,
                  steamGridDb: { ...draft.steamGridDb, apiKey }
                }))
              }
              placeholder={snapshot.metadataSettings.steamGridDb.hasApiKey ? 'Dejar en blanco para mantener la clave guardada' : 'Clave API de SteamGridDB'}
              type="password"
            />
          </div>

          <div className="rounded-lg border border-white/8 bg-black/18 p-5">
            <ProviderToggle
              title="ScreenScraper"
              enabled={metadataDraft.screenScraper.enabled}
              onChange={(enabled) =>
                setMetadataDraft((draft) => ({
                  ...draft,
                  screenScraper: { ...draft.screenScraper, enabled }
                }))
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Usuario"
                value={metadataDraft.screenScraper.userName}
                onChange={(userName) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    screenScraper: { ...draft.screenScraper, userName }
                  }))
                }
                placeholder="Usuario de ScreenScraper"
              />
              <Field
                label={snapshot.metadataSettings.screenScraper.hasPassword ? 'Contraseña (guardada)' : 'Contraseña'}
                value={metadataDraft.screenScraper.password}
                onChange={(password) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    screenScraper: { ...draft.screenScraper, password }
                  }))
                }
                placeholder={snapshot.metadataSettings.screenScraper.hasPassword ? 'Dejar en blanco para mantener la contraseña guardada' : 'Contraseña'}
                type="password"
              />
              <Field
                label="ID de Desarrollador"
                value={metadataDraft.screenScraper.devId}
                onChange={(devId) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    screenScraper: { ...draft.screenScraper, devId }
                  }))
                }
                placeholder="ID de Desarrollador"
              />
              <Field
                label={snapshot.metadataSettings.screenScraper.hasDevPassword ? 'Contraseña Dev (guardada)' : 'Contraseña Dev'}
                value={metadataDraft.screenScraper.devPassword}
                onChange={(devPassword) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    screenScraper: { ...draft.screenScraper, devPassword }
                  }))
                }
                placeholder={snapshot.metadataSettings.screenScraper.hasDevPassword ? 'Dejar en blanco para mantener el secreto guardad' : 'Contraseña de Desarrollador'}
                type="password"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/8 p-6 md:flex-row md:items-center md:justify-between">
          <label className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/6 px-4 text-sm font-bold text-white/72">
            Preferido
            <select
              value={metadataDraft.preferProvider}
              onChange={(event) =>
                setMetadataDraft((draft) => ({
                  ...draft,
                  preferProvider: event.target.value === 'screenscraper' ? 'screenscraper' : 'steamgriddb'
                }))
              }
              className="bg-transparent text-sm font-bold text-white outline-none"
            >
              <option value="steamgriddb">SteamGridDB</option>
              <option value="screenscraper">ScreenScraper</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => onSaveMetadataSettings(metadataDraft)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-extrabold text-night transition hover:bg-mint"
          >
            <Save className="h-4 w-4" />
            Guardar configuración de arte
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-white/8 bg-white/[0.045] p-3 backdrop-blur-2xl">
          {snapshot.consoles.map((consoleDef) => {
            const config = drafts[consoleDef.id]
            const active = consoleDef.id === selectedConsoleId
            return (
              <button
                key={consoleDef.id}
                type="button"
                onClick={() => setSelectedConsoleId(consoleDef.id)}
                className={`mb-2 flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition ${
                  active ? 'border-white/22 bg-white/14' : 'border-white/6 bg-white/[0.035] hover:bg-white/8'
                }`}
              >
                <span>
                  <span className="block text-sm font-extrabold text-white">{consoleDef.name}</span>
                  <span className="mt-1 block truncate text-xs text-white/46">
                    {config?.emulatorName || 'Ningún emulador seleccionado'}
                  </span>
                </span>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: config?.romFolderPath ? consoleDef.accent : 'rgba(255,255,255,0.22)' }}
                />
              </button>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] shadow-card backdrop-blur-2xl">
          <div
            className="border-b border-white/8 p-6"
            style={{
              background: `linear-gradient(135deg, ${selectedConsole.colorFrom}22, ${selectedConsole.colorTo}16)`
            }}
          >
            <p className="text-xs font-extrabold uppercase text-white/42">{selectedConsole.manufacturer}</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white">{selectedConsole.name}</h2>
            <p className="mt-2 text-sm text-white/54">{selectedConsole.description}</p>
          </div>

          <div className="grid gap-6 p-6">
            <Field
              label={isPc ? 'Nombre del lanzador' : 'Nombre del emulador'}
              value={selectedDraft.emulatorName}
              onChange={(value) => updateDraft(selectedConsoleId, { emulatorName: value })}
              placeholder={isPc ? 'Lanzamiento directo, Steam, GOG Galaxy...' : 'Snes9x, DuckStation, RetroArch...'}
            />
            <PathField
              label={isPc ? 'Ruta del launcher (opcional)' : 'Ruta del ejecutable'}
              value={selectedDraft.executablePath}
              onChange={(value) => updateDraft(selectedConsoleId, { executablePath: value })}
              onBrowse={chooseExecutable}
              placeholder={isPc ? 'Puedes dejarlo vacio para abrir juegos directamente' : 'C:\\Emuladores\\Snes9x\\snes9x.exe'}
            />
            <PathField
              label={isPc ? 'Carpeta de juegos o accesos directos' : 'Carpeta de ROMs'}
              value={selectedDraft.romFolderPath}
              onChange={(value) => updateDraft(selectedConsoleId, { romFolderPath: value })}
              onBrowse={() => chooseFolder('romFolderPath')}
              placeholder={isPc ? 'D:\\Juegos o D:\\Juegos\\Accesos directos' : 'D:\\ROMs\\SNES'}
            />
            <PathField
              label="Carpeta de carátulas"
              value={selectedDraft.coverFolderPath}
              onChange={(value) => updateDraft(selectedConsoleId, { coverFolderPath: value })}
              onBrowse={() => chooseFolder('coverFolderPath')}
              placeholder={isPc ? 'D:\\Juegos\\Caratulas' : 'D:\\ROMs\\SNES\\Caratulas'}
            />
            <PathField
              label={isPc ? 'Imagen de la plataforma' : 'Imagen de la consola'}
              value={selectedDraft.consoleImageUrl || ''}
              onChange={(value) => updateDraft(selectedConsoleId, { consoleImageUrl: value })}
              onBrowse={chooseConsoleImage}
              placeholder={isPc ? 'Selecciona una imagen para mostrar en PC' : 'Selecciona una imagen para mostrar en el tile de consola'}
            />
            <Field
              label={isPc ? 'Extensiones de lanzamiento soportadas' : 'Extensiones de ROM soportadas'}
              value={selectedDraft.supportedExtensions.join(', ')}
              onChange={(value) =>
                updateDraft(selectedConsoleId, {
                  supportedExtensions: value
                    .split(',')
                    .map((extension) => extension.trim())
                    .filter(Boolean)
                    .map((extension) => (extension.startsWith('.') ? extension : `.${extension}`))
                })
              }
              placeholder={isPc ? '.exe, .lnk, .url, .bat, .cmd, .acf' : '.smc, .sfc, .zip'}
            />
            <Field
              label={isPc ? 'Argumentos de lanzamiento (avanzado)' : 'Argumentos de lanzamiento'}
              value={selectedDraft.launchArguments}
              onChange={(value) => updateDraft(selectedConsoleId, { launchArguments: value })}
              placeholder='-L "{core}" "{rom}"'
              helper={
                isPc
                  ? 'Para PC puedes dejar el launcher vacio. Si configuras uno, usa "{rom}" para el archivo y "{launchUrl}" para URLs de tiendas.'
                  : 'Usa "{rom}" para la ruta del ROM y "{core}" para cores opcionales de RetroArch.'
              }
            />
            {!isPc ? (
              <Field
                label="Ruta del core RetroArch"
                value={selectedDraft.retroArchCorePath}
                onChange={(value) => updateDraft(selectedConsoleId, { retroArchCorePath: value })}
                placeholder="C:\\RetroArch\\cores\\snes9x_libretro.dll"
              />
            ) : null}

            <div className="flex flex-col gap-3 rounded-lg border border-white/8 bg-black/18 p-4 text-sm text-white/58 md:flex-row md:items-center md:justify-between">
              <span className="min-w-0 truncate">
                {isPc ? 'Carpeta de juegos actual' : 'Carpeta de ROMs actual'}: {shortPath(selectedDraft.romFolderPath, 78)}
              </span>
              <button
                type="button"
                onClick={() => onSave(selectedDraft)}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-extrabold text-night transition hover:bg-mint"
              >
                <Save className="h-4 w-4" />
                {isPc ? 'Guardar PC' : 'Guardar consola'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Console Mode Section */}
      <ConsoleModeSettings />

    </div>
  )
}

// ── Console Mode Settings ─────────────────────────────────────────────────────

function ConsoleModeSettings(): JSX.Element {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('sarkanvault:console-mode') === 'true' } catch { return false }
  })

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    try { localStorage.setItem('sarkanvault:console-mode', String(next)) } catch {}
    if (next && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else if (!next && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-white/8 bg-white/[0.045] shadow-card">
      <div className="border-b border-white/8 px-7 py-5">
        <h2 className="font-display text-xl font-bold text-white">Modo Consola</h2>
        <p className="mt-1 text-sm text-white/54">
          Experiencia de pantalla completa similar a Steam Big Picture. Ideal para televisores y navegación 100% con joystick.
        </p>
      </div>
      <div className="p-7 space-y-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="font-semibold text-white">Activar Modo Consola</p>
            <p className="mt-1 text-sm text-white/54">
              Inicia en pantalla completa, oculta el cursor tras unos segundos de inactividad y optimiza la UI para control.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center shrink-0">
            <input type="checkbox" checked={enabled} onChange={toggle} className="peer sr-only" aria-label="Activar Modo Consola" />
            <span className="h-7 w-12 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-mint" />
            <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-night" />
          </label>
        </div>

        <div className="rounded-xl border border-white/8 bg-black/20 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">Mapa de botones</p>
          <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded bg-green-500/20 text-[10px] font-black text-green-300 border border-green-500/40">A</span> Seleccionar / Confirmar</div>
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded bg-red-500/20 text-[10px] font-black text-red-300 border border-red-500/40">B</span> Volver / Cancelar</div>
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 text-[10px] font-black text-blue-300 border border-blue-500/40">X</span> Favorito</div>
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded bg-yellow-500/20 text-[10px] font-black text-yellow-300 border border-yellow-500/40">Y</span> Opciones adicionales</div>
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-8 items-center justify-center rounded bg-white/10 text-[10px] font-black text-white/70 border border-white/20">LB</span> Menú principal / Inicio</div>
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-8 items-center justify-center rounded bg-white/10 text-[10px] font-black text-white/70 border border-white/20">RB</span> Buscar</div>
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-14 items-center justify-center rounded bg-white/10 text-[10px] font-black text-white/70 border border-white/20">Start</span> Abrir menú</div>
            <div className="flex items-center gap-2"><span className="inline-flex h-6 w-14 items-center justify-center rounded bg-white/10 text-[10px] font-black text-white/70 border border-white/20">Select</span> Buscar</div>
          </div>
          <p className="text-xs text-white/40 pt-1">El stick izquierdo y el D-Pad navegan la interfaz. Se admiten controles Xbox, PlayStation, USB genéricos y arcades.</p>
        </div>
      </div>
    </section>
  )
}

interface SetupStatProps {
  icon: React.ReactNode
  label: string
  value: string
}

function SetupStat({ icon, label, value }: SetupStatProps): JSX.Element {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.045] p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2 text-white/48">
        {icon}
        <span className="text-xs font-extrabold uppercase">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  type?: 'text' | 'password'
}

function Field({ label, value, onChange, placeholder, helper, type = 'text' }: FieldProps): JSX.Element {
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase text-white/44">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/28 focus:border-mint/70"
      />
      {helper ? <span className="mt-2 block text-xs text-white/42">{helper}</span> : null}
    </label>
  )
}

interface ProviderToggleProps {
  title: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}

function ProviderToggle({ title, enabled, onChange }: ProviderToggleProps): JSX.Element {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h3 className="font-display text-2xl font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs font-semibold uppercase text-white/42">{enabled ? 'Habilitado' : 'Deshabilitado'}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span className="h-7 w-12 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-mint" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-night" />
      </label>
    </div>
  )
}

function createMetadataDraft(snapshot: LibrarySnapshot): MetadataSettings {
  return {
    steamGridDb: {
      enabled: snapshot.metadataSettings.steamGridDb.enabled,
      apiKey: ''
    },
    screenScraper: {
      enabled: snapshot.metadataSettings.screenScraper.enabled,
      userName: snapshot.metadataSettings.screenScraper.userName,
      password: '',
      devId: snapshot.metadataSettings.screenScraper.devId,
      devPassword: '',
      softName: snapshot.metadataSettings.screenScraper.softName || 'Sarkan Vault'
    },
    preferProvider: snapshot.metadataSettings.preferProvider
  }
}

interface PathFieldProps extends FieldProps {
  onBrowse: () => void
}

function PathField({ label, value, onChange, onBrowse, placeholder }: PathFieldProps): JSX.Element {
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase text-white/44">{label}</span>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/28 focus:border-mint/70"
        />
        <button
          type="button"
          onClick={onBrowse}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/7 text-white transition hover:bg-white/14"
          title={`Explorar ${label}`}
        >
          <FolderOpen className="h-5 w-5" />
        </button>
      </div>
    </label>
  )
}
