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

// Standard Gamepad API button mapping (Xbox layout as baseline)
// 0=A/Cross, 1=B/Circle, 2=X/Square, 3=Y/Triangle
// 4=LB, 5=RB, 6=LT, 7=RT, 8=Select/Back, 9=Start/Menu
// 12=DPad Up, 13=DPad Down, 14=DPad Left, 15=DPad Right, 16=Home
const BUTTON_MAP: Record<number, GamepadAction> = {
  0:  'select',
  1:  'back',
  2:  'favorite',
  3:  'options',
  4:  'lb',
  5:  'rb',
  8:  'search',
  9:  'menu',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
  16: 'menu',
}

const REPEAT_INITIAL_DELAY = 400
const REPEAT_RATE = 100
const STICK_THRESHOLD = 0.45

// Axis mapping: axes[0]=Left X, axes[1]=Left Y, axes[2]=Right X, axes[3]=Right Y
// Some controllers map D-Pad to axes[6]/axes[7]
const DPAD_AXIS_X = 6
const DPAD_AXIS_Y = 7

function detectType(id: string): GamepadInfo['type'] {
  const lower = id.toLowerCase()
  if (lower.includes('xbox') || lower.includes('xinput') || lower.includes('045e')) return 'xbox'
  if (
    lower.includes('playstation') ||
    lower.includes('dualshock') ||
    lower.includes('dualsense') ||
    lower.includes('054c') ||
    lower.includes('ps3') ||
    lower.includes('ps4') ||
    lower.includes('ps5')
  )
    return 'playstation'
  return 'generic'
}

class GamepadManager {
  private actionHandlers = new Set<ActionHandler>()
  private connectHandlers = new Set<ConnectionHandler>()
  private disconnectHandlers = new Set<ConnectionHandler>()

  private connectedGamepads = new Map<number, GamepadInfo>()
  private buttonStates = new Map<string, boolean>()
  private buttonTimers = new Map<string, { firstAt: number; lastRepeatAt: number }>()

  // Left stick state (separate from D-Pad buttons)
  private stickActive = { up: false, down: false, left: false, right: false }
  private stickTimer = { up: 0, down: 0, left: 0, right: 0 }
  private stickLastRepeat = { up: 0, down: 0, left: 0, right: 0 }

  private rafId: number | null = null
  private started = false

  start() {
    if (this.started) return
    this.started = true

    window.addEventListener('gamepadconnected', (e) => this.handleConnect(e.gamepad))
    window.addEventListener('gamepaddisconnected', (e) => this.handleDisconnect(e.gamepad))

    // Detect already-connected pads (browser may have them before the event fires)
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

  isAnyConnected(): boolean {
    return this.connectedGamepads.size > 0
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
      if (!gp || !gp.connected) continue

      // ── Buttons ────────────────────────────────────────────
      for (let i = 0; i < gp.buttons.length; i++) {
        const action = BUTTON_MAP[i]
        if (!action) continue
        const key = `${gp.index}:b${i}`
        const pressed = gp.buttons[i].pressed

        if (pressed) {
          if (!this.buttonStates.get(key)) {
            // Fresh press
            this.buttonStates.set(key, true)
            this.buttonTimers.set(key, { firstAt: now, lastRepeatAt: now })
            this.emit(action)
          } else {
            // Key-repeat for directional buttons only
            const isDirectional = action === 'up' || action === 'down' || action === 'left' || action === 'right'
            if (isDirectional) {
              const timer = this.buttonTimers.get(key)!
              if (now - timer.firstAt > REPEAT_INITIAL_DELAY && now - timer.lastRepeatAt > REPEAT_RATE) {
                timer.lastRepeatAt = now
                this.emit(action)
              }
            }
          }
        } else {
          this.buttonStates.set(key, false)
          this.buttonTimers.delete(key)
        }
      }

      // ── Left Stick ─────────────────────────────────────────
      const lx = gp.axes[0] ?? 0
      const ly = gp.axes[1] ?? 0

      this.processStick('left',  lx < -STICK_THRESHOLD, now)
      this.processStick('right', lx >  STICK_THRESHOLD, now)
      this.processStick('up',    ly < -STICK_THRESHOLD, now)
      this.processStick('down',  ly >  STICK_THRESHOLD, now)

      // ── D-Pad on axes (some generic/arcade controllers) ────
      if (gp.axes.length > DPAD_AXIS_Y) {
        const dx = gp.axes[DPAD_AXIS_X] ?? 0
        const dy = gp.axes[DPAD_AXIS_Y] ?? 0
        // Only emit if not already covered by button map (avoid double fires)
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          // These axis-based d-pad values come in as -1/0/1
          const dkey = `${gp.index}:daxis`
          if (!this.buttonStates.get(dkey + 'l') && dx < -0.5) { this.buttonStates.set(dkey + 'l', true); this.emit('left') }
          if (!this.buttonStates.get(dkey + 'r') && dx >  0.5) { this.buttonStates.set(dkey + 'r', true); this.emit('right') }
          if (!this.buttonStates.get(dkey + 'u') && dy < -0.5) { this.buttonStates.set(dkey + 'u', true); this.emit('up') }
          if (!this.buttonStates.get(dkey + 'd') && dy >  0.5) { this.buttonStates.set(dkey + 'd', true); this.emit('down') }
        } else {
          const dkey = `${gp.index}:daxis`
          this.buttonStates.set(dkey + 'l', false)
          this.buttonStates.set(dkey + 'r', false)
          this.buttonStates.set(dkey + 'u', false)
          this.buttonStates.set(dkey + 'd', false)
        }
      }
    }
  }

  private processStick(dir: 'up' | 'down' | 'left' | 'right', active: boolean, now: number) {
    if (active) {
      if (!this.stickActive[dir]) {
        this.stickActive[dir] = true
        this.stickTimer[dir] = now
        this.stickLastRepeat[dir] = now
        this.emit(dir)
      } else if (now - this.stickTimer[dir] > REPEAT_INITIAL_DELAY) {
        if (now - this.stickLastRepeat[dir] > REPEAT_RATE) {
          this.stickLastRepeat[dir] = now
          this.emit(dir)
        }
      }
    } else {
      this.stickActive[dir] = false
    }
  }
}

export const gamepadManager = new GamepadManager()
