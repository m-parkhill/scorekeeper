/** Remembers player names used recently so setup is a couple of taps. */
const KEY = 'scorekeeper:v1:recentPlayers'
const MAX = 16

export function getRecentPlayers(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function rememberPlayers(names: string[]) {
  const seen = new Set<string>()
  const merged = [...names, ...getRecentPlayers()].filter((n) => {
    const k = n.trim().toLowerCase()
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
  try {
    localStorage.setItem(KEY, JSON.stringify(merged.slice(0, MAX)))
  } catch {
    /* ignore */
  }
}
