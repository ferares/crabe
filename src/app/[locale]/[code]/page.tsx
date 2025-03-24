import { viewport } from "@/helpers/game"

import GameComponent from "@/components/Game"

export { viewport }

interface GameProps { params: Promise<{ code: string }> }
export default async function Game({ params }: GameProps) {
  const { code } = await params
  return (
    <main className="content">
      <GameComponent code={code} />
    </main>
  )
}
