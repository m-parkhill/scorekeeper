import { useState } from 'react'
import type { Player } from '../../core/types'
import { Stepper } from '../../ui/Stepper'
import {
  CARD_KEYS,
  cardLabel,
  cardValue,
  tallyCount,
  tallyPoints,
  wildLabel,
  type CardKey,
  type CardTally,
  type Rank,
  type WildRummyRound,
} from './rules'

interface Props {
  players: Player[]
  handNumber: number
  wild: Rank
  initial?: WildRummyRound
  onSave(data: WildRummyRound): void
  onCancel(): void
  onDelete?(): void
}

interface Draft {
  wentOut: boolean
  cards: CardTally
  /** Set when the scorekeeper typed a total instead of counting cards. */
  typed: number | null
}

const empty: Draft = { wentOut: false, cards: {}, typed: null }

function isSet(d: Draft) {
  return d.wentOut || d.typed !== null || tallyCount(d.cards) > 0
}

function points(d: Draft, wild: Rank) {
  if (d.wentOut) return 0
  if (d.typed !== null) return d.typed
  return tallyPoints(d.cards, wild)
}

/**
 * One player at a time, the way hands get counted at the table: whoever went
 * out taps "Went out"; everyone else lays down their leftover cards and the
 * scorekeeper taps them in. The pad knows this hand's wild rank.
 *
 * More than one player can go out: if someone goes out on their first turn,
 * everyone who hasn't played yet still gets one turn and may go out too.
 */
export function HandForm({ players, handNumber, wild, initial, onSave, onCancel, onDelete }: Props) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      players.map((p) => {
        const e = initial?.byPlayer[p.id]
        if (!e) return [p.id, empty]
        if (e.wentOut) return [p.id, { ...empty, wentOut: true }]
        if (e.cards) return [p.id, { ...empty, cards: e.cards }]
        return [p.id, { ...empty, typed: e.points }]
      }),
    ),
  )
  const [current, setCurrent] = useState(players[0].id)
  const d = drafts[current]
  const player = players.find((p) => p.id === current)!
  const idx = players.indexOf(player)

  const set = (id: string, next: Draft) => setDrafts((all) => ({ ...all, [id]: next }))
  const nextPending = (from: Record<string, Draft>) => {
    for (let i = 1; i <= players.length; i++) {
      const p = players[(idx + i) % players.length]
      if (!isSet(from[p.id])) return p
    }
    return null
  }

  const addCard = (k: CardKey) => set(current, { wentOut: false, typed: null, cards: { ...d.cards, [k]: (d.cards[k] ?? 0) + 1 } })
  const removeCard = (k: CardKey) => {
    const n = (d.cards[k] ?? 0) - 1
    const cards = { ...d.cards }
    if (n > 0) cards[k] = n
    else delete cards[k]
    set(current, { ...d, cards })
  }
  const markOut = () => {
    const next = { ...drafts, [current]: { ...empty, wentOut: !d.wentOut } }
    setDrafts(next)
    if (!d.wentOut) {
      const p = nextPending(next)
      if (p) setCurrent(p.id)
    }
  }

  const missing = players.filter((p) => !isSet(drafts[p.id]))
  const outCount = players.filter((p) => drafts[p.id].wentOut).length
  const pending = nextPending(drafts)

  const save = () => {
    if (missing.length) return
    onSave({
      wild,
      byPlayer: Object.fromEntries(
        players.map((p) => {
          const x = drafts[p.id]
          const entry = x.wentOut
            ? { points: 0, wentOut: true }
            : x.typed !== null
              ? { points: x.typed }
              : { points: tallyPoints(x.cards, wild), cards: x.cards }
          return [p.id, entry]
        }),
      ),
    })
  }

  const tallied = CARD_KEYS.filter((k) => d.cards[k])

  return (
    <div className="round-form">
      <div className="hand-banner">
        <span>
          Hand {handNumber} {initial ? '(editing)' : ''}
        </span>
        <span className="wild-pill">★ {wildLabel(wild)} wild</span>
      </div>

      <div className="player-tabs" role="tablist">
        {players.map((p) => {
          const x = drafts[p.id]
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === current}
              className={`player-tab ${p.id === current ? 'selected' : ''}`}
              style={{ '--player': p.color } as React.CSSProperties}
              onClick={() => setCurrent(p.id)}
            >
              <span className="dot" />
              <span className="player-tab-name">{p.name}</span>
              <span className="player-tab-pts">{isSet(x) ? (x.wentOut ? 'out' : points(x, wild)) : '·'}</span>
            </button>
          )
        })}
      </div>

      <section className="card player-entry" style={{ '--player': player.color } as React.CSSProperties}>
        <div className="player-entry-head">
          <span className="dot" />
          <h2>{player.name}</h2>
          <span className={`round-pts ${isSet(d) ? '' : 'pending'}`}>{isSet(d) ? points(d, wild) : '—'}</span>
        </div>

        <button className={`btn full went-out ${d.wentOut ? 'selected' : ''}`} onClick={markOut} aria-pressed={d.wentOut}>
          {d.wentOut ? '✓ Went out · 0 points' : 'Went out (0 points)'}
        </button>

        {d.typed === null ? (
          <>
            <div className="field-label pad-label">
              Cards left in hand <span className="muted">tap each card</span>
            </div>
            <div className="pad">
              {CARD_KEYS.map((k) => {
                const isWild = k === wild || k === 'JOKER'
                const count = d.cards[k] ?? 0
                return (
                  <button
                    key={k}
                    className={`pad-key ${isWild ? 'wild' : ''} ${k === 'JOKER' ? 'joker' : ''}`}
                    onClick={() => addCard(k)}
                    aria-label={`Add ${cardLabel(k)}${k === wild ? ' (wild)' : ''}, ${cardValue(k, wild)} points`}
                  >
                    <span className="pad-rank">{k === 'JOKER' ? 'Jkr' : k}</span>
                    <span className="pad-value">{isWild ? '★20' : cardValue(k, wild)}</span>
                    {count > 0 && <span className="pad-count">{count}</span>}
                  </button>
                )
              })}
            </div>
            {tallied.length > 0 && (
              <div className="tally">
                {tallied.map((k) => (
                  <button key={k} className="chip tally-chip" onClick={() => removeCard(k)} aria-label={`Remove one ${cardLabel(k)}`}>
                    {cardLabel(k)}
                    {d.cards[k]! > 1 && ` ×${d.cards[k]}`} <span className="muted">✕</span>
                  </button>
                ))}
                <span className="muted small">
                  {tallyCount(d.cards)} card{tallyCount(d.cards) === 1 ? '' : 's'} · tap to remove
                </span>
              </div>
            )}
            <button className="link-btn" onClick={() => set(current, { ...empty, typed: tallyPoints(d.cards, wild) })}>
              Type a total instead
            </button>
          </>
        ) : (
          <>
            <div className="field-label pad-label">Points in hand</div>
            <Stepper label={`${player.name} points`} value={d.typed} onChange={(n) => set(current, { ...empty, typed: n })} max={500} />
            <button className="link-btn" onClick={() => set(current, { ...empty })}>
              Count cards instead
            </button>
          </>
        )}
      </section>

      {missing.length === 0 && outCount === 0 && <p className="hint warn">Nobody is marked as going out. Did someone go out?</p>}

      {onDelete && (
        <button className="btn danger-text" onClick={onDelete}>
          Delete this hand
        </button>
      )}

      <div className="action-bar">
        <button className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        {missing.length === 0 ? (
          <button className="btn primary" onClick={save}>
            Save hand
          </button>
        ) : (
          <button className="btn primary" onClick={() => pending && setCurrent(pending.id)} disabled={!isSet(d) || !pending}>
            {isSet(d) && pending ? `Next: ${pending.name}` : `${missing.length} left to score`}
          </button>
        )}
      </div>
    </div>
  )
}
