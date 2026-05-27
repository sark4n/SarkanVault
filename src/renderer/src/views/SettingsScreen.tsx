import { Cloud, Cpu, Database, Download, FolderOpen, RefreshCw, Save, Search, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ConsoleId, EmulatorConfig, LibrarySnapshot, MetadataSettings } from '@shared/types'
import { getConsole, shortPath } from '@renderer/lib/format'

interface SettingsScreenProps {
  snapshot: LibrarySnapshot
  isBusy: boolean
  onDetect: () => Promise<void>
  onScan: () => Promise<void>
  onSave: (config: EmulatorConfig) => Promise<void>
  onSaveMetadataSettings: (settings: MetadataSettings) => Promise<void>
  onDownloadMissingCovers: (consoleId?: ConsoleId) => Promise<void>
  onChooseExecutable: () => Promise<string | undefined>
  onChooseFolder: () => Promise<string | undefined>
}

export function SettingsScreen({
  snapshot,
  isBusy,
  onDetect,
  onScan,
  onSave,
  onSaveMetadataSettings,
  onDownloadMissingCovers,
  onChooseExecutable,
  onChooseFolder
}: SettingsScreenProps): JSX.Element {
  const [drafts, setDrafts] = useState<Record<string, EmulatorConfig>>({})
  const [metadataDraft, setMetadataDraft] = useState<MetadataSettings>(() => createMetadataDraft(snapshot))
  const [selectedConsoleId, setSelectedConsoleId] = useState<ConsoleId>(snapshot.consoles[0].id)
  const selectedConsole = getConsole(snapshot.consoles, selectedConsoleId)
  const selectedDraft = drafts[selectedConsoleId]

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
                Faltantes para consola
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
              label="Nombre del emulador"
              value={selectedDraft.emulatorName}
              onChange={(value) => updateDraft(selectedConsoleId, { emulatorName: value })}
              placeholder="Snes9x, DuckStation, RetroArch..."
            />
            <PathField
              label="Ruta del ejecutable"
              value={selectedDraft.executablePath}
              onChange={(value) => updateDraft(selectedConsoleId, { executablePath: value })}
              onBrowse={chooseExecutable}
              placeholder="C:\\Emuladores\\Snes9x\\snes9x.exe"
            />
            <PathField
              label="Carpeta de ROMs"
              value={selectedDraft.romFolderPath}
              onChange={(value) => updateDraft(selectedConsoleId, { romFolderPath: value })}
              onBrowse={() => chooseFolder('romFolderPath')}
              placeholder="D:\\ROMs\\SNES"
            />
            <PathField
              label="Carpeta de carátulas"
              value={selectedDraft.coverFolderPath}
              onChange={(value) => updateDraft(selectedConsoleId, { coverFolderPath: value })}
              onBrowse={() => chooseFolder('coverFolderPath')}
              placeholder="D:\\ROMs\\SNES\\Caratulas"
            />
            <Field
              label="Extensiones de ROM soportadas"
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
              placeholder=".smc, .sfc, .zip"
            />
            <Field
              label="Argumentos de lanzamiento"
              value={selectedDraft.launchArguments}
              onChange={(value) => updateDraft(selectedConsoleId, { launchArguments: value })}
              placeholder='-L "{core}" "{rom}"'
              helper='Usa "{rom}" para la ruta del ROM y "{core}" para cores opcionales de RetroArch.'
            />
            <Field
              label="Ruta del core RetroArch"
              value={selectedDraft.retroArchCorePath}
              onChange={(value) => updateDraft(selectedConsoleId, { retroArchCorePath: value })}
              placeholder="C:\\RetroArch\\cores\\snes9x_libretro.dll"
            />

            <div className="flex flex-col gap-3 rounded-lg border border-white/8 bg-black/18 p-4 text-sm text-white/58 md:flex-row md:items-center md:justify-between">
              <span className="min-w-0 truncate">Carpeta de ROMs actual: {shortPath(selectedDraft.romFolderPath, 78)}</span>
              <button
                type="button"
                onClick={() => onSave(selectedDraft)}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-extrabold text-night transition hover:bg-mint"
              >
                <Save className="h-4 w-4" />
                Guardar consola
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
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
      softName: snapshot.metadataSettings.screenScraper.softName || 'RetroForge'
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
