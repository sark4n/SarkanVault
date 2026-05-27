import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { GameEntry, LaunchResult } from '../../shared/types'
import { LocalStore } from './localStore'

export class GameLauncher {
  constructor(private readonly store: LocalStore) {}

  async launch(gameId: string): Promise<LaunchResult> {
    const game = await this.store.getGame(gameId)

    if (!game || game.source !== 'scan') {
      return {
        ok: false,
        message: 'This is sample library art. Configure a ROM folder and scan your library to launch games.'
      }
    }

    const config = await this.store.getEmulatorConfig(game.consoleId)

    if (!config?.executablePath) {
      return { ok: false, message: 'No emulator executable is configured for this console.' }
    }

    if (!existsSync(config.executablePath)) {
      return { ok: false, message: 'The configured emulator executable was not found.' }
    }

    if (!existsSync(game.romPath)) {
      return { ok: false, message: 'The ROM file was not found. Try rescanning the library.' }
    }

    const args = buildLaunchArgs(config.launchArguments, game, config.retroArchCorePath)

    try {
      const child = spawn(config.executablePath, args, {
        detached: true,
        stdio: 'ignore',
        cwd: config.executablePath.replace(/[\\/][^\\/]+$/, '')
      })
      child.unref()
      const launchedAt = new Date().toISOString()
      await this.store.touchLaunch(game.id)

      return {
        ok: true,
        message: `Launched ${game.title}.`,
        launchedAt
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to launch the game.'
      }
    }
  }
}

function buildLaunchArgs(template: string, game: GameEntry, retroArchCorePath?: string): string[] {
  const normalizedTemplate = template.trim() || '"{rom}"'
  return splitCommandLine(normalizedTemplate)
    .map((arg) => arg.replaceAll('{rom}', game.romPath).replaceAll('{core}', retroArchCorePath ?? ''))
    .filter((arg) => arg.length > 0)
}

function splitCommandLine(input: string): string[] {
  const args: string[] = []
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(input))) {
    args.push(match[1] ?? match[2] ?? match[3])
  }

  return args
}
