/**
 * Spatial navigation engine for gamepad/keyboard navigation.
 * Supports: standard focus, carousel row awareness, and focus memory per screen.
 */

const FOCUSABLE_SELECTORS = [
  'button:not([disabled]):not([tabindex="-1"])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  '[data-focusable]',
].join(',')

function isVisible(el: Element): boolean {
  const rect = (el as HTMLElement).getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  // Allow elements that are horizontally scrolled within a carousel (don't cull by viewport X)
  if (rect.bottom < -20 || rect.top > window.innerHeight + 20) return false
  const style = window.getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0'
}

function getFocusableElements(root: Element = document.documentElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.closest('[aria-hidden="true"]') && isVisible(el)
  )
}

function getRect(el: HTMLElement): DOMRect {
  return el.getBoundingClientRect()
}

function center(rect: DOMRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/**
 * Weighted distance used for spatial navigation.
 * Primary: distance along the navigation axis.
 * Secondary (penalized): perpendicular offset.
 */
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
      return primary + secondary * 0.6
    }
    case 'left': {
      if (to.right > from.left + 8) return Infinity
      const primary = from.left - to.right
      const secondary = Math.abs(dy)
      return primary + secondary * 0.6
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

/**
 * Find the nearest scroll container that can scroll in the given axis.
 */
function findScrollContainer(el: HTMLElement, axis: 'x' | 'y'): HTMLElement | null {
  let node = el.parentElement
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node)
    const overflow = axis === 'x'
      ? style.overflowX
      : style.overflowY
    if (overflow === 'auto' || overflow === 'scroll') return node
    node = node.parentElement
  }
  return null
}

/**
 * Scroll a carousel so the focused element is roughly centered.
 */
function scrollCarouselToFocused(el: HTMLElement): void {
  const container = findScrollContainer(el, 'x')
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  const targetScrollLeft =
    container.scrollLeft +
    (elRect.left - containerRect.left) -
    (containerRect.width / 2 - elRect.width / 2)

  container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' })
}

/**
 * Scroll page so element is visible with some breathing room.
 */
function scrollPageToFocused(el: HTMLElement): void {
  const rect = el.getBoundingClientRect()
  const margin = 120

  if (rect.top < margin) {
    window.scrollBy({ top: rect.top - margin, behavior: 'smooth' })
  } else if (rect.bottom > window.innerHeight - margin) {
    window.scrollBy({ top: rect.bottom - window.innerHeight + margin, behavior: 'smooth' })
  }
}

export function focusInDirection(dir: 'up' | 'down' | 'left' | 'right'): boolean {
  const elements = getFocusableElements()
  const current = document.activeElement as HTMLElement | null

  if (!current || !elements.includes(current)) {
    return focusFirst()
  }

  const fromRect = getRect(current)

  // ── Carousel-aware horizontal navigation ─────────────────────────────────
  // If we're inside a horizontal scroll container and going left/right,
  // prefer elements in the SAME row (same scroll container) before jumping rows.
  if (dir === 'left' || dir === 'right') {
    const scrollContainer = findScrollContainer(current, 'x')
    if (scrollContainer) {
      const rowElements = getFocusableElements(scrollContainer)
      let bestInRow: HTMLElement | null = null
      let bestDistRow = Infinity

      for (const el of rowElements) {
        if (el === current) continue
        const toRect = getRect(el)
        const dist = weightedDistance(fromRect, toRect, dir)
        if (dist < bestDistRow) {
          bestDistRow = dist
          bestInRow = el
        }
      }

      if (bestInRow) {
        bestInRow.focus({ preventScroll: true })
        scrollCarouselToFocused(bestInRow)
        scrollPageToFocused(bestInRow)
        return true
      }
    }
  }

  // ── Standard spatial navigation ───────────────────────────────────────────
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
    best.focus({ preventScroll: true })
    scrollCarouselToFocused(best)
    scrollPageToFocused(best)
    return true
  }

  return false
}

export function focusFirst(): boolean {
  const elements = getFocusableElements()
  if (elements.length > 0) {
    elements[0].focus({ preventScroll: true })
    return true
  }
  return false
}

export function clickFocused(): void {
  const el = document.activeElement as HTMLElement | null
  if (el) el.click()
}

// ── Focus memory: remember last focused element per view ─────────────────────

const focusMemory = new Map<string, string>() // viewKey -> element data-id or selector

export function saveFocusForView(viewKey: string): void {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return
  // Try to identify element by data-game-id, data-focusable-id, or a label
  const id =
    el.getAttribute('data-game-id') ||
    el.getAttribute('data-focusable-id') ||
    el.getAttribute('title') ||
    el.textContent?.trim().slice(0, 40) ||
    ''
  if (id) focusMemory.set(viewKey, id)
}

export function restoreFocusForView(viewKey: string): boolean {
  const id = focusMemory.get(viewKey)
  if (!id) return false

  const elements = getFocusableElements()
  const match = elements.find(
    (el) =>
      el.getAttribute('data-game-id') === id ||
      el.getAttribute('data-focusable-id') === id ||
      el.getAttribute('title') === id ||
      el.textContent?.trim().startsWith(id)
  )

  if (match) {
    match.focus({ preventScroll: true })
    scrollCarouselToFocused(match)
    scrollPageToFocused(match)
    return true
  }
  return false
}
