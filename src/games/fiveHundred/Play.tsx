import { useState } from 'react'
import type { PlayProps } from '../types'
import { num, signed } from '../../ui/format'
import { HandForm } from './HandForm'
import {
  LOSE_SCORE,
  WIN_SCORE,
  bidLabel,
  contractMade,
  handScores,
  outcome,
  runningTotals,
  sides as getSides,
  type FiveHundredRound,
  type FiveHundredSettings,
} from './rules'

type Mode = { kind: 'board' } | { kind: 'new' } | { kind: 'edit'; roundId: string }

export function FiveHundredPlay({ game, actions }: PlayProps<FiveHundredSettings, FiveHundredRound>) {
  const [mode, setMode] = useState<Mode>({ kind: 'board' })
  const sides = getSides(game.players)
  const result = outcome(game)
  const finished = game.status === 'finished'
  const playerName = (id: string) => game.players.find((p) => p.id === id)?.name ?? '?'

  if (mode.kind !== 'board') {
    const idx = mode.kind === 'edit' ? game.rounds.findIndex((r) => r.id === mode.roundId) : game.rounds.length
    const editing = mode.kind === 'edit' ? game.rounds[idx] : undefined
    const back = () => setMode({ kind: 'board' })
    return (
      <HandForm
        key={editing?.id ?? 'new'}
        players={game.players}
        sides={sides}
        settings={game.settings}
        handNumber={idx + 1}
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
                if (confirm(`Delete hand ${idx + 1}?`)) {
                  actions.deleteRound(editing.id)
                  back()
                }
              }
            : undefined
        }
      />
    )
  }

  const running = runningTotals(game)
  const t = running[running.length - 1] ?? Object.fromEntries(sides.map((s) => [s.id, 0]))
  const ranked = [...sides].sort((a, b) => t[b.id] - t[a.id])
  const over = result.kind !== 'playing'

  return (
    <div className="board">
      {result.kind === 'won' && (
        <GameOver title={`🏆 ${result.side.name} ${result.side.playerIds.length > 1 ? 'win' : 'wins'}!`} sub={`Made their bid to reach ${t[result.side.id]}.`} finished={finished} actions={actions} />
      )}
      {result.kind === 'lost' && (
        <GameOver
          title={`🏆 ${result.winner.name} ${result.winner.playerIds.length > 1 ? 'win' : 'wins'}!`}
          sub={`${result.side.name} went out the back door at ${t[result.side.id]}.`}
          finished={finished}
          actions={actions}
        />
      )}

      <section className="card standings">
        <div className="standings-head">
          <span>Hand {game.rounds.length}</span>
          <span className="muted">
            Win at {WIN_SCORE} · out at {num(LOSE_SCORE)}
          </span>
        </div>
        <ol>
          {ranked.map((s, i) => {
            const total = t[s.id]
            return (
              <li key={s.id} style={{ '--player': s.color } as React.CSSProperties}>
                <span className="rank">{i + 1}</span>
                <div className="standing-main">
                  <div className="standing-line">
                    <span className="name">{s.name}</span>
                    <span className={`total ${total < 0 ? 'neg' : ''}`}>{num(total)}</span>
                  </div>
                  <div className="progress" aria-hidden>
                    <div className={`progress-fill ${total < 0 ? 'negative' : ''}`} style={{ width: `${Math.min(1, Math.abs(total) / WIN_SCORE) * 100}%` }} />
                  </div>
                  {!over && total >= WIN_SCORE && <div className="muted small">Must win a bid to go out</div>}
                </div>
              </li>
            )
          })}
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
                  <th>Bid</th>
                  {sides.map((s) => (
                    <th key={s.id} style={{ '--player': s.color } as React.CSSProperties}>
                      <span className="dot" /> {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {game.rounds.map((r, i) => {
                  const h = handScores(r.data, sides, game.settings)
                  const made = contractMade(r.data, sides)
                  return (
                    <tr key={r.id} onClick={() => setMode({ kind: 'edit', roundId: r.id })} className="tappable">
                      <th scope="row" className="bid-cell-row">
                        <span className={made ? 'pos' : 'neg'}>
                          {bidLabel(r.data.bid)} {made ? '✓' : '✗'}
                        </span>
                        <div className="cell-sub">
                          {i + 1}. {playerName(r.data.bidderId)}
                        </div>
                      </th>
                      {sides.map((s) => (
                        <td key={s.id}>
                          <div className={h[s.id] < 0 ? 'neg' : ''}>{h[s.id] === 0 ? '–' : signed(h[s.id])}</div>
                          <div className="cell-sub">{num(running[i][s.id])}</div>
                        </td>
                      ))}
                    </tr>
                  )
                })}
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
      ) : !over ? (
        <div className="action-bar">
          <button className="btn primary big" onClick={() => setMode({ kind: 'new' })}>
            Score hand {game.rounds.length + 1}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function GameOver({ title, sub, finished, actions }: { title: string; sub: string; finished: boolean; actions: PlayProps<unknown, unknown>['actions'] }) {
  return (
    <section className="banner win">
      <div className="banner-title">{title}</div>
      <div className="muted">{sub}</div>
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
  )
}
