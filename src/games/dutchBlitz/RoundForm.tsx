import { useState } from 'react'
import type { Player } from '../../core/types'
import { Stepper } from '../../ui/Stepper'
import { signed } from '../../ui/format'
import { BLITZ_PILE_SIZE, roundPoints, type DutchBlitzRound } from './rules'

interface Props {
  players: Player[]
  roundNumber: number
  initial?: DutchBlitzRound
  onSave(data: DutchBlitzRound): void
  onCancel(): void
  onDelete?(): void
}

interface Draft {
  center: number
  blitzLeft: number | null
}

/**
 * Mirrors how a Dutch Blitz round is actually counted at the table:
 * each player counts what's left in their Blitz pile (0–10, tap a chip),
 * then the center cards are sorted by back and counted (stepper or type).
 */
export function RoundForm({ players, roundNumber, initial, onSave, onCancel, onDelete }: Props) {
  const [draft, setDraft] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      players.map((p) => {
        const e = initial?.byPlayer[p.id]
        return [p.id, { center: e?.center ?? 0, blitzLeft: e?.blitzLeft ?? null }]
      }),
    ),
  )

  const set = (id: string, patch: Partial<Draft>) => setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }))

  const missing = players.filter((p) => draft[p.id].blitzLeft === null)
  const nobodyBlitzed = missing.length === 0 && players.every((p) => draft[p.id].blitzLeft! > 0)

  const save = () => {
    if (missing.length) return
    onSave({
      byPlayer: Object.fromEntries(
        players.map((p) => [p.id, { center: draft[p.id].center, blitzLeft: draft[p.id].blitzLeft! }]),
      ),
    })
  }

  return (
    <div className="round-form">
      <p className="hint">
        {initial ? 'Editing' : 'Scoring'} round {roundNumber}. For each player, tap how many cards are left in their Blitz pile, then
        enter how many of their cards made it to the center.
      </p>

      {players.map((p) => {
        const d = draft[p.id]
        const pts = d.blitzLeft === null ? null : roundPoints({ center: d.center, blitzLeft: d.blitzLeft })
        return (
          <section key={p.id} className="card player-entry" style={{ '--player': p.color } as React.CSSProperties}>
            <div className="player-entry-head">
              <span className="dot" />
              <h2>{p.name}</h2>
              <span className={`round-pts ${pts === null ? 'pending' : pts < 0 ? 'neg' : 'pos'}`}>
                {pts === null ? '—' : signed(pts)}
              </span>
            </div>

            <div className="field">
              <div className="field-label">
                Left in Blitz pile <span className="muted">−2 each</span>
              </div>
              <div className="chips" role="radiogroup" aria-label={`${p.name} Blitz pile cards left`}>
                {Array.from({ length: BLITZ_PILE_SIZE + 1 }, (_, n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={d.blitzLeft === n}
                    className={`chip ${d.blitzLeft === n ? 'selected' : ''} ${n === 0 ? 'blitz' : ''}`}
                    onClick={() => set(p.id, { blitzLeft: n })}
                  >
                    {n === 0 ? 'Blitz!' : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <div className="field-label">
                Cards in center <span className="muted">+1 each</span>
              </div>
              <Stepper label={`${p.name} cards in center`} value={d.center} onChange={(n) => set(p.id, { center: n })} max={120} />
            </div>
          </section>
        )
      })}

      {nobodyBlitzed && <p className="hint warn">No one has 0 left in their Blitz pile. That's fine if the round stalled out.</p>}

      {onDelete && (
        <button className="btn danger-text" onClick={onDelete}>
          Delete this round
        </button>
      )}

      <div className="action-bar">
        <button className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" onClick={save} disabled={missing.length > 0}>
          {missing.length ? `Set Blitz pile for ${missing.length === 1 ? missing[0].name : `${missing.length} players`}` : 'Save round'}
        </button>
      </div>
    </div>
  )
}
