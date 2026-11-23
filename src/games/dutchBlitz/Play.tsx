import { useState } from 'react'
import type { PlayProps } from '../types'
import { num, signed } from '../../ui/format'
import { RoundForm } from './RoundForm'
import { outcome, roundPoints, runningTotals, standings, type DutchBlitzRound, type DutchBlitzSettings } from './rules'

type Mode = { kind: 'board' } | { kind: 'new' } | { kind: 'edit'; roundId: string }

export function DutchBlitzPlay({ game, actions }: PlayProps<DutchBlitzSettings, DutchBlitzRound>) {
  const [mode, setMode] = useState<Mode>({ kind: 'board' })
  const target = game.settings.targetScore
  const result = outcome(game)
  const finished = game.status === 'finished'

  if (mode.kind !== 'board') {
    const idx = mode.kind === 'edit' ? game.rounds.findIndex((r) => r.id === mode.roundId) : game.rounds.length
    const editing = mode.kind === 'edit' ? game.rounds[idx] : undefined
    const back = () => setMode({ kind: 'board' })
    return (
      <RoundForm
        key={editing?.id ?? 'new'}
        players={game.players}
        roundNumber={idx + 1}
        initial={editing?.data}
        onCancel={back}
        onSave={(data) => {
          if (editing) actions.updateRound(editing.id, data)
          else actions.addRound(data)
          back()
        }}
        onDelete={
          editing
            ? () => {
                if (confirm(`Delete round ${idx + 1}?`)) {
                  actions.deleteRound(editing.id)
                  back()
                }
              }
            : undefined
        }
      />
    )
  }

  const rows = standings(game)
  const running = runningTotals(game)
  const maxTotal = Math.max(target, ...rows.map((r) => r.total))

  return (
    <div className="board">
      {result.kind === 'won' && (
        <section className="banner win">
          <div className="banner-title">🏆 {result.winner.name} wins!</div>
          <div className="banner-actions">
            {!finished && (
              <button className="btn secondary" onClick={actions.finish}>
                Finish game
              </button>
            )}
            <button className="btn primary" onClick={actions.rematch}>
              Rematch
            </button>
          </div>
        </section>
      )}
      {result.kind === 'tied' && (
        <section className="banner tie">
          <div className="banner-title">Tied at the top: {result.leaders.map((p) => p.name).join(' & ')}</div>
          <div className="muted">Play another round to break the tie.</div>
        </section>
      )}

      <section className="card standings">
        <div className="standings-head">
          <span>Round {game.rounds.length}</span>
          <span className="muted">Playing to {target}</span>
        </div>
        <ol>
          {rows.map(({ player, total, last }, i) => (
            <li key={player.id} style={{ '--player': player.color } as React.CSSProperties}>
              <span className="rank">{i + 1}</span>
              <div className="standing-main">
                <div className="standing-line">
                  <span className="name">{player.name}</span>
                  {last !== null && <span className={`delta ${last < 0 ? 'neg' : 'pos'}`}>{signed(last)}</span>}
                  <span className="total">{num(total)}</span>
                </div>
                <div className="progress" aria-hidden>
                  <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(1, total / maxTotal)) * 100}%` }} />
                  <div className="progress-target" style={{ left: `${(target / maxTotal) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {game.rounds.length > 0 && (
        <section className="card history">
          <h2 className="section-title">Rounds</h2>
          <p className="muted small">Tap a round to fix a mistake.</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th />
                  {game.players.map((p) => (
                    <th key={p.id} style={{ '--player': p.color } as React.CSSProperties}>
                      <span className="dot" /> {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {game.rounds.map((r, i) => (
                  <tr key={r.id} onClick={() => setMode({ kind: 'edit', roundId: r.id })} className="tappable">
                    <th scope="row">{i + 1}</th>
                    {game.players.map((p) => {
                      const e = r.data.byPlayer[p.id]
                      const pts = roundPoints(e)
                      return (
                        <td key={p.id}>
                          <div className={pts < 0 ? 'neg' : ''}>{signed(pts)}</div>
                          <div className="cell-sub">
                            {e ? `${e.center} / ${e.blitzLeft === 0 ? '★' : e.blitzLeft}` : ''} · {num(running[i][p.id])}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Each cell shows round points, then center cards / Blitz cards left (★ = blitzed) · running total.</p>
        </section>
      )}

      {result.kind === 'won' && !finished ? null : finished ? (
        <div className="action-bar">
          <button className="btn secondary" onClick={actions.reopen}>
            Reopen
          </button>
          <button className="btn primary" onClick={actions.rematch}>
            Rematch
          </button>
        </div>
      ) : (
        <div className="action-bar">
          <button className="btn primary big" onClick={() => setMode({ kind: 'new' })}>
            Score round {game.rounds.length + 1}
          </button>
        </div>
      )}
    </div>
  )
}
