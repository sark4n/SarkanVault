import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { DetectionResult, EmulatorConfig } from '../../shared/types'
import { consoleCatalog } from './consoleCatalog'
import { createDefaultConfig } from './localStore'

export function detectEmulators(existingConfigs: EmulatorConfig[]): {
  configs: EmulatorConfig[]
  detections: DetectionResult[]
} {
  const pathDirectories = getPathDirectories()
  const knownRoots = getKnownRoots()
  const detections: DetectionResult[] = []

  const configs = consoleCatalog.map((consoleDef) => {
    const currentConfig = existingConfigs.find((config) => config.consoleId === consoleDef.id)
    const baseConfig = currentConfig ?? createDefaultConfig(consoleDef.id)

    if (baseConfig.executablePath && existsSync(baseConfig.executablePath)) {
      return baseConfig
    }

    for (const candidate of consoleDef.candidates) {
      const pathMatch = findInDirectories(candidate.executableNames, pathDirectories)

      if (pathMatch) {
        detections.push({
          consoleId: consoleDef.id,
          emulatorName: candidate.name,
          executablePath: pathMatch,
          confidence: 'high',
          source: 'path'
        })

        return {
          ...baseConfig,
          emulatorName: candidate.name,
          executablePath: pathMatch,
          launchArguments: candidate.defaultLaunchArguments ?? baseConfig.launchArguments,
          retroArchCorePath: findRetroArchCore(pathMatch, candidate.retroArchCoreNames) ?? baseConfig.retroArchCorePath
        }
      }

      const knownLocationMatch = findInKnownLocations(candidate.executableNames, candidate.installHints, knownRoots)

      if (knownLocationMatch) {
        detections.push({
          consoleId: consoleDef.id,
          emulatorName: candidate.name,
          executablePath: knownLocationMatch,
          confidence: 'medium',
          source: 'known-location'
        })

        return {
          ...baseConfig,
          emulatorName: candidate.name,
          executablePath: knownLocationMatch,
          launchArguments: candidate.defaultLaunchArguments ?? baseConfig.launchArguments,
          retroArchCorePath:
            findRetroArchCore(knownLocationMatch, candidate.retroArchCoreNames) ?? baseConfig.retroArchCorePath
        }
      }
    }

    return baseConfig
  })

  return { configs, detections }
}

function getPathDirectories(): string[] {
  return (process.env.PATH ?? '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getKnownRoots(): string[] {
  return [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
    process.env.LOCALAPPDATA,
    process.env.APPDATA,
    process.env.USERPROFILE ? join(process.env.USERPROFILE, 'Emulators') : undefined,
    process.env.USERPROFILE ? join(process.env.USERPROFILE, 'Games') : undefined,
    process.env.USERPROFILE ? join(process.env.USERPROFILE, 'Desktop') : undefined,
    process.env.USERPROFILE ? join(process.env.USERPROFILE, 'Downloads') : undefined
  ].filter(Boolean) as string[]
}

function findInDirectories(executableNames: string[], directories: string[]): string | undefined {
  for (const directory of directories) {
    for (const executableName of executableNames) {
      const possiblePath = join(directory, executableName)
      if (existsSync(possiblePath)) return possiblePath
    }
  }

  return undefined
}

function findInKnownLocations(
  executableNames: string[],
  installHints: string[],
  knownRoots: string[]
): string | undefined {
  for (const root of knownRoots) {
    for (const hint of installHints) {
      for (const executableName of executableNames) {
        const directPath = join(root, hint, executableName)
        const binPath = join(root, hint, 'bin', executableName)

        if (existsSync(directPath)) return directPath
        if (existsSync(binPath)) return binPath
      }
    }
  }

  return undefined
}

function findRetroArchCore(retroArchPath: string, coreNames?: string[]): string | undefined {
  if (!coreNames?.length) return undefined

  const coreDirectory = join(dirname(retroArchPath), 'cores')
  for (const coreName of coreNames) {
    const corePath = join(coreDirectory, coreName)
    if (existsSync(corePath)) return corePath
  }

  return undefined
}
