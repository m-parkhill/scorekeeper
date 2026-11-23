import { currentAuthorId } from './identity'
import { newId } from './ids'
import type { GameRecord, GameStatus, Round } from './types'

/**
 * All changes to a game go through these pure functions. Keeping mutations as
 * small, named operations (rather than "replace the whole game") means a sync
 * layer can later ship them as an operation log.
 */

function touch<S, R>(g: GameRecord<S, R>): GameRecord<S, R> {
  return { ...g, updatedAt: Date.now(), updatedBy: currentAuthorId() }
}

export function addRound<S, R>(g: GameRecord<S, R>, data: R): GameRecord<S, R> {
  const now = Date.now()
  const round: Round<R> = { id: newId(), createdAt: now, updatedAt: now, updatedBy: currentAuthorId(), data }
  return touch({ ...g, rounds: [...g.rounds, round] })
}

export function updateRound<S, R>(g: GameRecord<S, R>, roundId: string, data: R): GameRecord<S, R> {
  return touch({
    ...g,
    rounds: g.rounds.map((r) =>
      r.id === roundId ? { ...r, data, updatedAt: Date.now(), updatedBy: currentAuthorId() } : r,
    ),
  })
}

export function deleteRound<S, R>(g: GameRecord<S, R>, roundId: string): GameRecord<S, R> {
  return touch({ ...g, rounds: g.rounds.filter((r) => r.id !== roundId) })
}

export function setStatus<S, R>(g: GameRecord<S, R>, status: GameStatus): GameRecord<S, R> {
  return touch({ ...g, status })
}
