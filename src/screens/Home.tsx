import { useGames } from '../core/store'
import Link from 'next/link'
import type { GameRecord } from '../core/types'
import { GAMES, gameName, getGame } from '../games/registry'
import { relativeTime } from '../ui/format'

export function Home() {
  const games = useGames() ?? []
  const active = games.filter((g) => g.status === 'active')
  const finished = games.filter((g) => g.status === 'finished').slice(0, 10)

  return (
    <div className="screen">
      <header className="home-head">
        <h1>Scorekeeper</h1>
        <p className="muted">What are we playing?</p>
      </header>

      <div className="game-tiles">
        {GAMES.map((g) =>
          'comingSoon' in g ? (
            <div key={g.id} className="game-tile disabled" aria-disabled>
              <span className="game-tile-name">{g.name}</span>
              <span className="muted small">{g.tagline}</span>
            </div>
          ) : (
            <Link key={g.id} className="game-tile" href={`/new/${g.id}`}>
              <span className="game-tile-name">{g.name}</span>
              <span className="muted small">{g.tagline}</span>
            </Link>
          ),
        )}
      </div>

      {active.length > 0 && <GameList title="In progress" games={active} />}
      {finished.length > 0 && <GameList title="Recent" games={finished} />}
    </div>
  )
}

function GameList({ title, games }: { title: string; games: GameRecord[] }) {
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <ul className="game-list">
        {games.map((g) => {
          const def = getGame(g.type)
          return (
            <li key={g.id}>
              <Link className="card game-row" href={`/game/${g.id}`}>
                <div className="game-row-top">
                  <strong>{gameName(g.type)}</strong>
                  <span className="muted small">{relativeTime(g.updatedAt)}</span>
                </div>
                <div className="small">{g.players.map((p) => p.name).join(', ')}</div>
                {def && <div className="muted small">{def.summarize(g)}</div>}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
