const CREDITS_UPDATED = 'credits-updated'

export function emitCreditsUpdated() {
  window.dispatchEvent(new Event(CREDITS_UPDATED))
}

export function onCreditsUpdated(handler: () => void) {
  window.addEventListener(CREDITS_UPDATED, handler)
  return () => window.removeEventListener(CREDITS_UPDATED, handler)
}
