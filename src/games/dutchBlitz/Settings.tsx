import type { SettingsFormProps } from '../types'
import type { DutchBlitzSettings } from './rules'

const PRESETS = [50, 75, 100]

export function DutchBlitzSettingsForm({ value, onChange }: SettingsFormProps<DutchBlitzSettings>) {
  return (
    <div className="field">
      <div className="field-label">Play to</div>
      <div className="segmented">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            className={value.targetScore === n ? 'selected' : ''}
            onClick={() => onChange({ ...value, targetScore: n })}
          >
            {n}
            {n === 75 && <span className="muted small"> standard</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
