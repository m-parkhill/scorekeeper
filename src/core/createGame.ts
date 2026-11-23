import { currentAuthorId } from './identity'
import { newId } from './ids'
import type { GameRecord, GameTypeId, Player } from './types'

export function createGame<S>(type: GameTypeId, players: Player[], settings: S): GameRecord<S> {
  const now = Date.now()
  return {
    id: newId(),
    type,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: currentAuthorId(),
    status: 'active',
    players,
    settings,
    rounds: [],
  }
}
