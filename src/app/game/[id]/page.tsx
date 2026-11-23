'use client'

import { useParams } from 'next/navigation'
import { GameScreen } from '../../../screens/GameScreen'

export default function Page() {
  const { id } = useParams<{ id: string }>()
  return <GameScreen key={id} id={id} />
}
