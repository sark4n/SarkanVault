export type GamepadAction =
  | 'up' | 'down' | 'left' | 'right'
  | 'select' | 'back' | 'favorite' | 'options'
  | 'menu' | 'search'
  | 'lb' | 'rb'

export interface GamepadInfo {
  index: number
  id: string
  type: 'xbox' | 'playstation' | 'generic'
}

type ActionHandler = (action: GamepadAction) => void
type ConnectionHandler = (info: GamepadInfo) => void

const BUTTON_MAP: Record<number, GamepadAction> = {
  0: 'select',
  1: 'back',
  2: 'favorite',
  3: 'options',
  4: 'lb',
  5: 'rb',
  8: 'search',
  9: 'menu',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
  16: 'menu',
}

const REPEAT_INITIAL_DELAY = 400
const REPEAT_RATE = 120
const STICK_THRESHOLD = 0.5

function detectType(id: string): GamepadInfo['type'] {
  const lower = id.toLowerCase()
  if (lower.includes('xbox') || lower.includes('xinput') || lower.includes('045e')) return 'xbox'
  if (lower.includes('playstation') || lower.includes('dualshock') || lower.includes('dualsense') || lower.includes('054c')) return 'playstation'
  return 'generic'
}

class GamepadManager {
  private actionHandlers = new Set<ActionHandler>()
  private connectHandlers = new Set<ConnectionHandler>()
  private disconnectHandlers = new Set<ConnectionHandler>()

  private connectedGamepads = new Map<number, GamepadInfo>()
  private buttonStates = new Map<string, boolean>()
  private buttonTimers = new Map<string, { firstAt: number; lastRepeatAt: number }>()

  private stickDirections = { up: false, down: false, left: false, right: false }
  private stickTimers = { up: 0, down: 0, left: 0, right: 0 }

  private rafId: number | null = null
  private started = false

  start() {
    if (this.started) return
    this.started = true

    window.addEventListener('gamepadconnected', (e) => this.handleConnect(e.gamepad))
    window.addEventListener('gamepaddisconnected', (e) => this.handleDisconnect(e.gamepad))

    for (const gp of navigator.getGamepads()) {
      if (gp) this.handleConnect(gp)
    }

    this.poll()
  }

  stop() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.started = false
  }

  onAction(fn: ActionHandler) {
    this.actionHandlers.add(fn)
    return () => this.actionHandlers.delete(fn)
  }

  onConnect(fn: ConnectionHandler) {
    this.connectHandlers.add(fn)
    return () => this.connectHandlers.delete(fn)
  }

  onDisconnect(fn: ConnectionHandler) {
    this.disconnectHandlers.add(fn)
    return () => this.disconnectHandlers.delete(fn)
  }

  getConnected(): GamepadInfo[] {
    return Array.from(this.connectedGamepads.values())
  }

  private handleConnect(gp: Gamepad) {
    const info: GamepadInfo = { index: gp.index, id: gp.id, type: detectType(gp.id) }
    this.connectedGamepads.set(gp.index, info)
    this.connectHandlers.forEach((fn) => fn(info))
  }

  private handleDisconnect(gp: Gamepad) {
    const info = this.connectedGamepads.get(gp.index)
    if (info) {
      this.connectedGamepads.delete(gp.index)
      this.disconnectHandlers.forEach((fn) => fn(info))
    }
  }

  private emit(action: GamepadAction) {
    this.actionHandlers.forEach((fn) => fn(action))
  }

  private poll() {
    this.rafId = requestAnimationFrame(() => this.poll())
    const now = performance.now()

    for (const gp of navigator.getGamepads()) {
      if (!gp) continue

      for (let i = 0; i < gp.buttons.length; i++) {
        const action = BUTTON_MAP[i]
        if (!action) continue
        const key = `${gp.index}:b${i}`
        const pressed = gp.buttons[i].pressed

        if (pressed) {
          if (!this.buttonStates.get(key)) {
            this.buttonStates.set(key, true)
            this.buttonTimers.set(key, { firstAt: now, lastRepeatAt: now })
            this.emit(action)
          } else {
            const timer = this.buttonTimers.get(key)!
            if (now - timer.firstAt > REPEAT_INITIAL_DELAY) {
              if (now - timer.lastRepeatAt > REPEAT_RATE) {
                timer.lastRepeatAt = now
                if (action === 'up' || action === 'down' || action === 'left' || action === 'right') {
                  this.emit(action)
                }
              }
            }
          }
        } else {
          this.buttonStates.set(key, false)
          this.buttonTimers.delete(key)
        }
      }

      const ax = gp.axes[0] ?? 0
      const ay = gp.axes[1] ?? 0

      this.processStick('left', ay < -STICK_THRESHOLD, now)
      this.processStick('right', ay > STICK_THRESHOLD, now)
      this.processStick('up', ax < -STICK_THRESHOLD, now)
      this.processStick('down', ax > STICK_THRESHOLD, now)
    }
  }

  private processStick(dir: 'up' | 'down' | 'left' | 'right', active: boolean, now: number) {
    const action: GamepadAction = dir
    if (active) {
      if (!this.stickDirections[dir]) {
        this.stickDirections[dir] = true
        this.stickTimers[dir] = now
        this.emit(action)
      } else if (now - this.stickTimers[dir] > REPEAT_INITIAL_DELAY) {
        if (now - this.stickTimers[dir] > REPEAT_RATE) {
          this.stickTimers[dir] = now - (REPEAT_INITIAL_DELAY - REPEAT_RATE)
          this.emit(action)
        }
      }
    } else {
      this.stickDirections[dir] = false
    }
  }
}

export const gamepadManager = new GamepadManager()
