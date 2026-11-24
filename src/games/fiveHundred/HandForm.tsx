import { useState } from 'react'
import type { Player } from '../../core/types'
import { signed } from '../../ui/format'
import {
  NO_TRICK_VALUE,
  OPEN_NO_TRICK_VALUE,
  SUITS,
  SUIT_SYMBOL,
  TOTAL_TRICKS,
  TRICK_LEVELS,
  bidLabel,
  bidValue,
  handScores,
  sideOf,
  type Bid,
  type FiveHundredRound,
  type FiveHundredSettings,
  type Side,
} from './rules'

interface Props {
  players: Player[]
  sides: Side[]
  settings: FiveHundredSettings
  handNumber: number
  initial?: FiveHundredRound
  onSave(data: FiveHundredRound): void
  onCancel(): void
  onDelete?(): void
}

const sameBid = (a: Bid | null, b: Bid) =>
  !!a && a.kind === b.kind && (a.kind !== 'suit' || (b.kind === 'suit' && a.tricks === b.tricks && a.suit === b.suit))

/**
 * Follows the order things are known at the table: who won the bid, what the
 * bid was (picked straight off the scoring table), then how many tricks each
 * side took when the hand is played out.
 */
export function HandForm({ players, sides, settings, handNumber, initial, onSave, onCancel, onDelete }: Props) {
  const [bidderId, setBidderId] = useState<string | null>(initial?.bidderId ?? null)
  const [bid, setBid] = useState<Bid | null>(initial?.bid ?? null)
  const [tricks, setTricks] = useState<Record<string, number>>(initial?.tricks ?? {})
  const [noTrickMade, setNoTrickMade] = useState<boolean | null>(initial?.noTrickMade ?? null)

  const bidder = bidderId ? sideOf(sides, bidderId) : null
  // Side order for trick entry: bidder first, then defenders; the last one is the remainder.
  const order = bidder ? [bidder, ...sides.filter((s) => s.id !== bidder.id)] : []
  const entered = order.slice(0, -1)
  const last = order[order.length - 1]
  const used = entered.reduce((n, s) => n + (tricks[s.id] ?? 0), 0)
  const allEntered = entered.every((s) => tricks[s.id] !== undefined) && used <= TOTAL_TRICKS
  const fullTricks = bidder && allEntered ? { ...Object.fromEntries(entered.map((s) => [s.id, tricks[s.id]])), [last.id]: TOTAL_TRICKS - used } : null

  const draft: FiveHundredRound | null =
    bidderId && bid
      ? bid.kind === 'suit'
        ? fullTricks && { bidderId, bid, tricks: fullTricks }
        : noTrickMade !== null
          ? { bidderId, bid, noTrickMade }
          : null
      : null
  const preview = draft ? handScores(draft, sides, settings) : null

  const setSideTricks = (sideId: string, n: number) => {
    // Keep later entries valid when an earlier side's count changes.
    const next: Record<string, number> = {}
    let remaining = TOTAL_TRICKS
    for (const s of entered) {
      const v = s.id === sideId ? n : tricks[s.id]
      if (v === undefined) continue
      if (v > remaining) break
      next[s.id] = v
      remaining -= v
    }
    setTricks(next)
  }

  const chooseBidder = (id: string) => {
    if (bidder && sideOf(sides, id).id !== bidder.id) setTricks({})
    setBidderId(id)
  }

  return (
    <div className="round-form">
      <div className="hand-banner">
        <span>Hand {handNumber} {initial ? '(editing)' : ''}</span>
        {bid && <span className="bid-pill">{bidLabel(bid)} · {bidValue(bid)}</span>}
      </div>

      <section className="card">
        <h2 className="section-title">Who won the bid?</h2>
        <div className="chips wrap">
          {players.map((p) => (
            <button
              key={p.id}
              className={`chip player-chip ${bidderId === p.id ? 'selected' : ''}`}
              style={{ '--player': p.color } as React.CSSProperties}
              onClick={() => chooseBidder(p.id)}
              aria-pressed={bidderId === p.id}
            >
              <span className="dot" /> {p.name}
            </button>
          ))}
        </div>
        {bidder && bidder.playerIds.length > 1 && <p className="hint small team-hint">Playing for {bidder.name}</p>}
      </section>

      <section className="card">
        <h2 className="section-title">Bid</h2>
        <div className="bid-table" role="grid" aria-label="Bid">
          <span />
          {SUITS.map((s) => (
            <span key={s} className={`bid-head suit-${s}`}>
              {SUIT_SYMBOL[s]}
            </span>
          ))}
          {TRICK_LEVELS.map((t) => (
            <Row key={t} tricks={t} bid={bid} onPick={setBid} />
          ))}
        </div>
        <div className="no-trick-row">
          {([{ kind: 'no-trick' }, { kind: 'open-no-trick' }] as Bid[]).map((b) => (
            <button key={b.kind} className={`bid-cell wide ${sameBid(bid, b) ? 'selected' : ''}`} onClick={() => setBid(b)} aria-pressed={sameBid(bid, b)}>
              {bidLabel(b)} <span className="bid-val">{b.kind === 'no-trick' ? NO_TRICK_VALUE : OPEN_NO_TRICK_VALUE}</span>
            </button>
          ))}
        </div>
      </section>

      {bidder && bid && (
        <section className="card">
          <h2 className="section-title">Result</h2>
          {bid.kind === 'suit' ? (
            <>
              {entered.map((s, i) => {
                const max = TOTAL_TRICKS - entered.slice(0, i).reduce((n, x) => n + (tricks[x.id] ?? 0), 0)
                return (
                  <div className="field" key={s.id}>
                    <div className="field-label">
                      Tricks taken by {s.name}
                      {i === 0 && <span className="muted"> needs {bid.tricks}</span>}
                    </div>
                    <div className="chips" role="radiogroup" aria-label={`Tricks taken by ${s.name}`}>
                      {Array.from({ length: TOTAL_TRICKS + 1 }, (_, n) => (
                        <button
                          key={n}
                          role="radio"
                          aria-checked={tricks[s.id] === n}
                          disabled={n > max}
                          className={`chip ${tricks[s.id] === n ? 'selected' : ''} ${i === 0 && n >= bid.tricks ? 'makes' : ''}`}
                          onClick={() => setSideTricks(s.id, n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {fullTricks && (
                <p className="hint">
                  {last.name} took {fullTricks[last.id]}.
                </p>
              )}
            </>
          ) : (
            <div className="segmented">
              <button className={noTrickMade === true ? 'selected' : ''} onClick={() => setNoTrickMade(true)}>
                Made it
              </button>
              <button className={noTrickMade === false ? 'selected' : ''} onClick={() => setNoTrickMade(false)}>
                Took a trick
              </button>
            </div>
          )}
        </section>
      )}

      {preview && (
        <section className="card preview">
          {sides.map((s) => (
            <div key={s.id} className="preview-line" style={{ '--player': s.color } as React.CSSProperties}>
              <span className="dot" />
              <span className="name">{s.name}</span>
              <span className={`round-pts ${preview[s.id] < 0 ? 'neg' : preview[s.id] > 0 ? 'pos' : ''}`}>{signed(preview[s.id])}</span>
            </div>
          ))}
        </section>
      )}

      {onDelete && (
        <button className="btn danger-text" onClick={onDelete}>
          Delete this hand
        </button>
      )}

      <div className="action-bar">
        <button className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" disabled={!draft} onClick={() => draft && onSave(draft)}>
          {!bidderId ? 'Pick the bidder' : !bid ? 'Pick the bid' : !draft ? 'Enter the result' : 'Save hand'}
        </button>
      </div>
    </div>
  )
}

function Row({ tricks, bid, onPick }: { tricks: number; bid: Bid | null; onPick(b: Bid): void }) {
  return (
    <>
      <span className="bid-level">{tricks}</span>
      {SUITS.map((suit) => {
        const b: Bid = { kind: 'suit', tricks, suit }
        const sel = sameBid(bid, b)
        return (
          <button key={suit} className={`bid-cell ${sel ? 'selected' : ''}`} onClick={() => onPick(b)} aria-pressed={sel} aria-label={`${bidLabel(b)}, ${bidValue(b)} points`}>
            {bidValue(b)}
          </button>
        )
      })}
    </>
  )
}
