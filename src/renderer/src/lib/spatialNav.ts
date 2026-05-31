const FOCUSABLE_SELECTORS = [
  'button:not([disabled]):not([tabindex="-1"])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  '[data-focusable]',
].join(',')

function getVisible(el: Element): boolean {
  const rect = (el as HTMLElement).getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  if (rect.bottom < 0 || rect.top > window.innerHeight) return false
  if (rect.right < 0 || rect.left > window.innerWidth) return false
  const style = window.getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0'
}

function getFocusableElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.closest('[aria-hidden="true"]') && getVisible(el)
  )
}

function getRect(el: HTMLElement) {
  return el.getBoundingClientRect()
}

function center(rect: DOMRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function weightedDistance(
  from: DOMRect,
  to: DOMRect,
  dir: 'up' | 'down' | 'left' | 'right'
): number {
  const fc = center(from)
  const tc = center(to)
  const dx = tc.x - fc.x
  const dy = tc.y - fc.y

  switch (dir) {
    case 'right': {
      if (to.left < from.right - 8) return Infinity
      const primary = to.left - from.right
      const secondary = Math.abs(dy)
      return primary + secondary * 0.5
    }
    case 'left': {
      if (to.right > from.left + 8) return Infinity
      const primary = from.left - to.right
      const secondary = Math.abs(dy)
      return primary + secondary * 0.5
    }
    case 'down': {
      if (to.top < from.bottom - 8) return Infinity
      const primary = to.top - from.bottom
      const secondary = Math.abs(dx)
      return primary + secondary * 0.5
    }
    case 'up': {
      if (to.bottom > from.top + 8) return Infinity
      const primary = from.top - to.bottom
      const secondary = Math.abs(dx)
      return primary + secondary * 0.5
    }
  }
}

export function focusInDirection(dir: 'up' | 'down' | 'left' | 'right'): boolean {
  const elements = getFocusableElements()
  const current = document.activeElement as HTMLElement | null

  if (!current || !elements.includes(current)) {
    const first = elements[0]
    if (first) { first.focus({ preventScroll: false }); return true }
    return false
  }

  const fromRect = getRect(current)
  let best: HTMLElement | null = null
  let bestDist = Infinity

  for (const el of elements) {
    if (el === current) continue
    const toRect = getRect(el)
    const dist = weightedDistance(fromRect, toRect, dir)
    if (dist < bestDist) {
      bestDist = dist
      best = el
    }
  }

  if (best) {
    best.focus({ preventScroll: false })
    best.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    return true
  }
  return false
}

export function focusFirst(): void {
  const elements = getFocusableElements()
  if (elements.length > 0) elements[0].focus({ preventScroll: false })
}

export function clickFocused(): void {
  const el = document.activeElement as HTMLElement | null
  if (el) el.click()
}
