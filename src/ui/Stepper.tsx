import { useEffect, useState } from 'react'

interface Props {
  value: number
  onChange(n: number): void
  min?: number
  max?: number
  label: string
}

/** Big −/+ buttons with a typeable number in the middle. */
export function Stepper({ value, onChange, min = 0, max = 999, label }: Props) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  return (
    <div className="stepper">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - 1))} disabled={value <= min}>
        −
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        pattern="[0-9]*"
        value={text}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          setText(digits)
          if (digits !== '') onChange(clamp(parseInt(digits, 10)))
        }}
        onBlur={() => setText(String(value))}
      />
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + 1))} disabled={value >= max}>
        +
      </button>
    </div>
  )
}
