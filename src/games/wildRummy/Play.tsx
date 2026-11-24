import { useState } from 'react'
import type { PlayProps } from '../types'
import { HandForm } from './HandForm'
import { HAND_COUNT, RANKS, outcome, runningTotals, standings, wildForHand, wildLabel, type WildRummyRound, type WildRummySettings } from './rules'

type Mode = { kind: 'board' } | { kind: 'new' } | { kind: 'edit'; roundId: string }

export function WildRummyPlay({ game, actions }: PlayProps<WildRummySettings, WildRummyRound>) {
  const [mode, setMode] = useState<Mode>({ kind: 'board' })
  const result = outcome(game)
  const finished = game.status === 'finished'

  if (mode.kind !== 'board') {
    const idx = mode.kind === 'edit' ? game.rounds.findIndex((r) => r.id === mode.roundId) : game.rounds.length
    const editing = mode.kind === 'edit' ? game.rounds[idx] : undefined
    const back = () => setMode({ kind: 'board' })
    return (
      <HandForm
        key={editing?.id ?? 'new'}
        players={game.players}
        handNumber={idx + 1}
        wild={editing?.data.wild ?? wildForHand(idx)}
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
                if (confirm(`Delete hand ${idx + 1}? Later hands keep their wild ranks.`)) {
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
  const leader = rows[0]?.total ?? 0

  return (
    <div className="board">
      {result.kind === 'done' && (
        <section className="banner win">
          <div className="banner-title">
            🏆 {result.winners.map((p) => p.name).join(' & ')} {result.winners.length > 1 ? 'tie' : 'wins'} with {result.score}
          </div>
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

      <section className="card">
        {result.kind === 'playing' && (
          <div className="next-hand">
            <div className="wild-card" aria-hidden>
              {result.wild}
            </div>
            <div>
              <div className="muted small">
                Hand {result.nextHand} of {HAND_COUNT}
              </div>
              <div className="next-hand-title">{wildLabel(result.wild)} are wild</div>
            </div>
          </div>
        )}
        <ol className="hand-strip" aria-label="Hands">
          {RANKS.map((r, i) => (
            <li
              key={r}
              className={i < game.rounds.length ? 'done' : result.kind === 'playing' && i === game.rounds.length ? 'current' : ''}
            >
              {r}
            </li>
          ))}
        </ol>
      </section>

      <section className="card standings">
        <div className="standings-head">
          <span>Standings</span>
          <span className="muted">Low score wins</span>
        </div>
        <ol>
          {rows.map(({ player, total, last }, i) => (
            <li key={player.id} style={{ '--player': player.color } as React.CSSProperties}>
              <span className="rank">{i + 1}</span>
              <div className="standing-main">
                <div className="standing-line">
                  <span className="name">{player.name}</span>
                  {last !== null && <span className="delta muted">{last === 0 ? 'out' : `+${last}`}</span>}
                  <span className="total">{total}</span>
                </div>
                {i > 0 && game.rounds.length > 0 && <div className="muted small">{total - leader} behind</div>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {game.rounds.length > 0 && (
        <section className="card history">
          <h2 className="section-title">Hands</h2>
          <p className="muted small">Tap a hand to fix a mistake.</p>
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
                    <th scope="row">
                      {i + 1}
                      <div className="cell-sub">★{r.data.wild}</div>
                    </th>
                    {game.players.map((p) => {
                      const e = r.data.byPlayer[p.id]
                      return (
                        <td key={p.id}>
                          <div>{e?.wentOut ? <span className="pos">out</span> : (e?.points ?? 0)}</div>
                          <div className="cell-sub">{running[i][p.id]}</div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Each cell shows points for the hand, then the running total.</p>
        </section>
      )}

      {finished ? (
        <div className="action-bar">
          <button className="btn secondary" onClick={actions.reopen}>
            Reopen
          </button>
          <button className="btn primary" onClick={actions.rematch}>
            Rematch
          </button>
        </div>
      ) : result.kind === 'playing' ? (
        <div className="action-bar">
          <button className="btn primary big" onClick={() => setMode({ kind: 'new' })}>
            Score hand {result.nextHand} · {wildLabel(result.wild)} wild
          </button>
        </div>
      ) : null}
    </div>
  )
}
