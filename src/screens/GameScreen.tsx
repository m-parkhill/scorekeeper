import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { createGame } from '../core/createGame'
import * as m from '../core/mutations'
import { gameStore, useGame } from '../core/store'
import { getGame } from '../games/registry'
import type { GameActions } from '../games/types'
import { TopBar } from '../ui/TopBar'

export function GameScreen({ id }: { id: string }) {
  const router = useRouter()
  const game = useGame(id)
  const def = game ? getGame(game.type) : undefined

  const actions = useMemo<GameActions<unknown>>(
    () => ({
      addRound: (data) => gameStore.update(id, (g) => m.addRound(g, data)),
      updateRound: (roundId, data) => gameStore.update(id, (g) => m.updateRound(g, roundId, data)),
      deleteRound: (roundId) => gameStore.update(id, (g) => m.deleteRound(g, roundId)),
      finish: () => gameStore.update(id, (g) => m.setStatus(g, 'finished')),
      reopen: () => gameStore.update(id, (g) => m.setStatus(g, 'active')),
      rematch: () => {
        const g = gameStore.get(id)
        if (!g) return
        gameStore.update(id, (x) => (x.status === 'finished' ? x : m.setStatus(x, 'finished')))
        const next = createGame(g.type, g.players, g.settings)
        gameStore.put(next)
        router.push(`/game/${next.id}`)
      },
    }),
    [id, router],
  )

  if (game === null) {
    return (
      <div className="screen">
        <TopBar title="" onBack={() => router.push('/')} />
      </div>
    )
  }

  if (!game || !def) {
    return (
      <div className="screen">
        <TopBar title="Game not found" onBack={() => router.push('/')} />
        <p className="muted">This game may have been deleted.</p>
      </div>
    )
  }

  const remove = () => {
    if (confirm('Delete this game? This cannot be undone.')) {
      gameStore.remove(id)
      router.replace('/')
    }
  }

  return (
    <div className="screen">
      <TopBar
        title={def.name}
        onBack={() => router.push('/')}
        right={
          <details className="menu">
            <summary className="icon-btn" aria-label="Game menu">
              ⋯
            </summary>
            <div className="menu-pop" onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}>
              {game.status === 'active' ? (
                <button onClick={actions.finish}>End game</button>
              ) : (
                <button onClick={actions.reopen}>Reopen game</button>
              )}
              <button onClick={actions.rematch}>New game, same players</button>
              <button className="danger-text" onClick={remove}>
                Delete game
              </button>
            </div>
          </details>
        }
      />
      <def.Play game={game} actions={actions} />
    </div>
  )
}
