import { newId } from './ids'

/**
 * Identity of whoever is entering scores on this device. Today there is one
 * scorekeeper, but every write is stamped with this id so that when syncing
 * and per-player entry arrive, history is already attributed.
 */
const KEY = 'scorekeeper:v1:device'

let cached: string | null = null

export function currentAuthorId(): string {
  if (cached) return cached
  try {
    cached = localStorage.getItem(KEY)
    if (!cached) {
      cached = newId()
      localStorage.setItem(KEY, cached)
    }
  } catch {
    cached = cached ?? newId()
  }
  return cached
}
