import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { PLAYER_COLORS } from '../core/colors'
import { createGame } from '../core/createGame'
import { newId } from '../core/ids'
import { getRecentPlayers, rememberPlayers } from '../core/recentPlayers'
import { gameStore } from '../core/store'
import type { GameDefinition } from '../games/types'
import { TopBar } from '../ui/TopBar'

interface Row {
  key: string
  name: string
}

export function NewGame({ def }: { def: GameDefinition }) {
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: def.minPlayers }, () => ({ key: newId(), name: '' })),
  )
  const [settings, setSettings] = useState(def.defaultSettings)
  const router = useRouter()
  // Read after mount so server and client first renders match.
  const [recent, setRecent] = useState<string[]>([])
  useEffect(() => setRecent(getRecentPlayers()), [])
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const used = new Set(rows.map((r) => r.name.trim().toLowerCase()))
  const suggestions = recent.filter((n) => !used.has(n.toLowerCase()))
  const named = rows.filter((r) => r.name.trim())
  const dupes = named.length !== new Set(named.map((r) => r.name.trim().toLowerCase())).size
  const countError = named.length >= def.minPlayers ? (def.playerCountError?.(named.length) ?? null) : null
  const canStart = named.length >= def.minPlayers && named.length <= def.maxPlayers && !dupes && !countError

  const addRow = (name = '') => {
    if (rows.length >= def.maxPlayers) return
    const key = newId()
    setRows((rs) => [...rs, { key, name }])
    if (!name) setTimeout(() => inputs.current[key]?.focus(), 0)
  }

  const useSuggestion = (name: string) => {
    const empty = rows.find((r) => !r.name.trim())
    if (empty) setRows((rs) => rs.map((r) => (r.key === empty.key ? { ...r, name } : r)))
    else addRow(name)
  }

  const move = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = i + dir
      if (j < 0 || j >= rs.length) return rs
      const next = [...rs]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const start = () => {
    if (!canStart) return
    const players = named.map((r, i) => ({ id: newId(), name: r.name.trim(), color: PLAYER_COLORS[i % PLAYER_COLORS.length] }))
    rememberPlayers(players.map((p) => p.name))
    const game = createGame(def.id, players, settings)
    gameStore.put(game)
    router.replace(`/game/${game.id}`)
  }

  return (
    <div className="screen">
      <TopBar title={`New ${def.name} game`} onBack={() => router.push('/')} />

      <section className="card">
        <h2 className="section-title">Players</h2>
        <ol className="player-inputs">
          {rows.map((r, i) => (
            <li key={r.key} style={{ '--player': PLAYER_COLORS[i % PLAYER_COLORS.length] } as React.CSSProperties}>
              <span className="dot" />
              <input
                ref={(el) => {
                  inputs.current[r.key] = el
                }}
                value={r.name}
                placeholder={`Player ${i + 1}`}
                autoCapitalize="words"
                autoComplete="off"
                enterKeyHint={i === rows.length - 1 ? 'done' : 'next'}
                onChange={(e) => setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, name: e.target.value } : x)))}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  const nextRow = rows[i + 1]
                  if (nextRow) inputs.current[nextRow.key]?.focus()
                  else e.currentTarget.blur()
                }}
              />
              <button className="icon-btn small" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button
                className="icon-btn small"
                aria-label="Remove player"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                disabled={rows.length <= 1}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
        {rows.length < def.maxPlayers && (
          <button className="btn secondary full" onClick={() => addRow()}>
            + Add player
          </button>
        )}
        {suggestions.length > 0 && (
          <div className="suggestions">
            <div className="muted small">Recent players</div>
            <div className="chips wrap">
              {suggestions.map((n) => (
                <button key={n} className="chip" onClick={() => useSuggestion(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
        {dupes && <p className="hint warn">Two players have the same name.</p>}
        {countError && <p className="hint warn">{countError}</p>}
      </section>

      {def.SettingsForm && (
        <section className="card">
          <h2 className="section-title">Settings</h2>
          <def.SettingsForm value={settings} onChange={setSettings} playerNames={named.map((r) => r.name.trim())} />
        </section>
      )}

      <div className="action-bar">
        <button className="btn primary big" onClick={start} disabled={!canStart}>
          {named.length < def.minPlayers ? `Add at least ${def.minPlayers} players` : 'Start game'}
        </button>
      </div>
    </div>
  )
}
