import { type Card } from "./Card"
import { type Enemy } from "./Enemy"
import { type GameState } from "./GameState"
import { type Player } from "./Player"
import { type Position } from "./Position"

export type Board = {
  cards: Card[][]
  playersPos: Position
  enemies: { barco: Enemy[], sol: Enemy[] }
  gameState: GameState
  shrimpCount: number
  turn: Player
  currentEnemy?: Enemy
  freedCount: number
}

export type PlayerBoard = {
  character: Player
  cards: Card[][]
  playersPos: Position
  gameState: GameState
  shrimpCount: number
  turn: Player
  currentEnemy?: Enemy
  freedCount: number
  enemyCount: number
  connectedPlayers: number
  new: boolean
}