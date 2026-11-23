# Scorekeeper

Phone-first scorekeeping for card games. Next.js (App Router). Scores are stored in the browser (localStorage) for now.

```sh
npm install
npm run dev      # http://localhost:3000, or the next free port; check the output
npm test         # scoring rules (vitest)
npm run build
npm start        # production server; also falls forward if the port is taken (scripts/start.mjs)
```

Deploys to Vercel with no configuration.

## Layout

- `src/app/` — routes: `/`, `/new/[gameType]`, `/game/[id]`. Thin client pages that render screens.
- `src/screens/` — Home, New game (player names), Game shell.
- `src/core/` — game-agnostic model and storage
  - `types.ts` — `GameRecord` / `Round` / `Player`. Game-specific data lives in `settings` and `round.data`.
  - `store.ts` — `GameStore` interface + localStorage implementation. Hooks return `null` while loading (server render / hydration).
  - `mutations.ts` — every change is a named, pure operation (addRound, updateRound, …).
  - `identity.ts` — per-device author id stamped on every write.
- `src/games/<game>/` — one self-contained module per game: `rules.ts` (pure scoring + tests), settings form, play screen. Registered in `src/games/registry.ts`.

## Adding a game

Create `src/games/<id>/` exporting a `GameDefinition` (see `games/types.ts`), and swap its `comingSoon` entry in the registry for it.

## Toward multi-device sync

Already in place: UUIDs on every entity, per-round records with `updatedAt`/`updatedBy`, mutations as discrete operations, and a storage interface with subscribe/notify. To sync: add route handlers under `src/app/api/` backed by a database, implement `GameStore` against them (keeping the local cache for offline use), merge rounds by id, and resolve same-round edits last-write-wins.
