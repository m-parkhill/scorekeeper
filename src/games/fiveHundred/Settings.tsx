import type { SettingsFormProps } from '../types'
import { SLAM_SCORE, type FiveHundredSettings } from './rules'

export function FiveHundredSettingsForm({ value, onChange, playerNames }: SettingsFormProps<FiveHundredSettings>) {
  const n = playerNames.length
  const teams = n === 4 || n === 6 ? [0, 1].map((t) => playerNames.filter((_, i) => i % 2 === t)) : null

  return (
    <>
      <div className="field">
        <div className="field-label">Sides</div>
        {teams ? (
          <div className="teams-preview">
            {teams.map((members, t) => (
              <div key={t} className="team-line">
                <span className="muted small">Team {t + 1}</span> {members.join(' & ')}
              </div>
            ))}
            <p className="hint small">Partners sit across from each other. List players in seating order (use ↑ to reorder).</p>
          </div>
        ) : (
          <p className="hint">{n === 2 || n === 3 ? 'Everyone plays for themselves.' : 'Play with 2 or 3 players solo, or 4 or 6 in two teams.'}</p>
        )}
      </div>

      <div className="field">
        <label className="toggle">
          <input type="checkbox" checked={value.slamBonus} onChange={(e) => onChange({ ...value, slamBonus: e.target.checked })} />
          <span>
            <strong>Slam bonus</strong>
            <span className="muted small">
              {' '}
              Taking all 10 tricks on a bid worth under {SLAM_SCORE} scores {SLAM_SCORE}.
            </span>
          </span>
        </label>
      </div>
    </>
  )
}
