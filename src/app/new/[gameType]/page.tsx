'use client'

import { notFound, useParams } from 'next/navigation'
import { getGame } from '../../../games/registry'
import { NewGame } from '../../../screens/NewGame'

export default function Page() {
  const { gameType } = useParams<{ gameType: string }>()
  const def = getGame(gameType)
  if (!def) notFound()
  return <NewGame key={def.id} def={def} />
}
