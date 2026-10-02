/**
 * App-wide "data changed" signal. Anything that saves outside the page you're
 * looking at (e.g. the mobile quick-add button) fires it, and every mounted
 * useAsync loader refreshes — so totals and lists never show stale numbers.
 */
const EVENT = 'yodi-oya:data-changed'

export function notifyDataChanged() {
  window.dispatchEvent(new Event(EVENT))
}

export function onDataChanged(listener: () => void) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
