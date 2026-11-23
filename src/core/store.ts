import { useSyncExternalStore } from 'react'
import type { GameRecord } from './types'

/**
 * Storage boundary. The UI only talks to `GameStore`, so swapping the
 * localStorage implementation for one backed by a server (or a local cache
 * that syncs with one) doesn't touch any screens.
 *
 * Reads are synchronous snapshots of an in-memory cache; a remote-backed
 * store would update that cache as data arrives and call the listeners.
 */
export interface GameStore {
  list(): GameRecord[]
  get(id: string): GameRecord | undefined
  put(game: GameRecord): void
  update(id: string, fn: (g: GameRecord) => GameRecord): void
  remove(id: string): void
  subscribe(listener: () => void): () => void
}

const STORAGE_KEY = 'scorekeeper:v1:games'

class LocalStorageGameStore implements GameStore {
  private games: Record<string, GameRecord> = {}
  private snapshot: GameRecord[] = []
  private listeners = new Set<() => void>()

  constructor() {
    // Next.js pre-renders on the server, where there is no localStorage.
    if (typeof window === 'undefined') return
    this.load()
    // Keep multiple tabs in sync — a small preview of real sync.
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        this.load()
        this.emit()
      }
    })
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      this.games = raw ? JSON.parse(raw) : {}
    } catch {
      this.games = {}
    }
    this.rebuild()
  }

  private rebuild() {
    this.snapshot = Object.values(this.games).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.games))
    } catch (err) {
      console.error('Failed to save games', err)
    }
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }

  private commit() {
    this.rebuild()
    this.persist()
    this.emit()
  }

  list = () => this.snapshot
  get = (id: string) => this.games[id]

  put(game: GameRecord) {
    this.games = { ...this.games, [game.id]: game }
    this.commit()
  }

  update(id: string, fn: (g: GameRecord) => GameRecord) {
    const g = this.games[id]
    if (!g) return
    this.games = { ...this.games, [id]: fn(g) }
    this.commit()
  }

  remove(id: string) {
    const { [id]: _removed, ...rest } = this.games
    this.games = rest
    this.commit()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const gameStore: GameStore = new LocalStorageGameStore()

/*
 * Hooks return `null` while loading: during server rendering and the first
 * client render (hydration), before local data is available. A remote-backed
 * store would also report `null` until its first fetch completes.
 */
const serverSnapshot = () => null

export function useGames(): GameRecord[] | null {
  return useSyncExternalStore(gameStore.subscribe, gameStore.list, serverSnapshot)
}

/** `null` = still loading, `undefined` = no such game. */
export function useGame(id: string): GameRecord | undefined | null {
  return useSyncExternalStore(gameStore.subscribe, () => gameStore.get(id), serverSnapshot)
}
