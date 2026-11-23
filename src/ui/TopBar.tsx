import type { ReactNode } from 'react'

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" aria-label="Back" onClick={onBack}>
          ‹
        </button>
      ) : (
        <span className="icon-btn-spacer" />
      )}
      <h1>{title}</h1>
      {right ?? <span className="icon-btn-spacer" />}
    </header>
  )
}
