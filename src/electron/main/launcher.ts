import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { shell } from 'electron'
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

    if (game.consoleId === 'pc' && shouldDirectLaunchPcGame(config?.executablePath, config?.launchArguments, game)) {
      return this.launchPcGameDirectly(game)
    }

    if (!config?.executablePath) {
      return {
        ok: false,
        message:
          game.consoleId === 'pc'
            ? 'No launcher executable is configured for this PC game.'
            : 'No emulator executable is configured for this console.'
      }
    }

    if (!existsSync(config.executablePath)) {
      return { ok: false, message: 'The configured launcher executable was not found.' }
    }

    if (!game.launchUrl && !existsSync(game.romPath)) {
      return {
        ok: false,
        message:
          game.consoleId === 'pc'
            ? 'The PC game file or shortcut was not found. Try rescanning the library.'
            : 'The ROM file was not found. Try rescanning the library.'
      }
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

  private async launchPcGameDirectly(game: GameEntry): Promise<LaunchResult> {
    try {
      if (game.launchUrl) {
        await shell.openExternal(game.launchUrl)
      } else {
        if (!existsSync(game.romPath)) {
          return { ok: false, message: 'The PC game file or shortcut was not found. Try rescanning the library.' }
        }

        const openError = await shell.openPath(game.romPath)
        if (openError) {
          return { ok: false, message: openError }
        }
      }

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
        message: error instanceof Error ? error.message : 'Failed to launch the PC game.'
      }
    }
  }
}

function buildLaunchArgs(template: string, game: GameEntry, retroArchCorePath?: string): string[] {
  const normalizedTemplate = template.trim() || '"{rom}"'
  return splitCommandLine(normalizedTemplate)
    .map((arg) =>
      arg
        .replaceAll('{rom}', game.romPath)
        .replaceAll('{file}', game.romPath)
        .replaceAll('{launchUrl}', game.launchUrl ?? '')
        .replaceAll('{core}', retroArchCorePath ?? '')
    )
    .filter((arg) => arg.length > 0)
}

function shouldDirectLaunchPcGame(
  executablePath: string | undefined,
  launchArguments: string | undefined,
  game: GameEntry
): boolean {
  const args = launchArguments?.trim() || '"{rom}"'
  return !executablePath || Boolean(game.launchUrl) || args === '"{rom}"'
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
