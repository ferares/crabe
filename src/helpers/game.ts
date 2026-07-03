import { shuffle } from "./array"

import { type Board, type PlayerBoard } from "../types/Board"
import { type Card } from "../types/Card"
import { type Enemy } from "../types/Enemy"
import { type Player } from "../types/Player"
import { type Position } from "../types/Position"
import { type GameState } from "../types/GameState"

export const viewport = { width: 1024, viewportFit: "contain" }
export const forbiddenObjectsIcon = "☠️"
export const objectRevealedIcon = "🐚"
export const playersIcon = "🦀"
export const shrimpIcon = "🦐"
export const enemyIcons = { lobster: "🦞", octopus: "🐙" }
const objectIcons = ["📠", "🕶️", "🚽", "🩲", "🥫", "⚓", "👞", "🛹", "🪀", "🛢️", "🎸", "🏐"]

function getRandom(min: number, max: number, exclude?: number[]) {
  let num = Math.floor(Math.random() * (max - min + 1)) + min
  while (exclude?.includes(num)) {
    num = (num + 1) % (max + 1)
  }
  return num
}

function getObjectsCountColumns(board: Card[][]) {
  const objectCountColumns: number[] = [0, 0, 0, 0, 0, 0]
  for (const row of board) {
    let currentColumn = 0
    for (const card of row) {
      const objectCountCurrentColumn = objectCountColumns[currentColumn]
      if ((card.object) && (objectCountCurrentColumn !== undefined)) {
        objectCountColumns[currentColumn] = objectCountCurrentColumn + 1
      }
      currentColumn++
    }
  }
  return objectCountColumns
}

function generateEnemies(player: Player, generatedEnemies?: Enemy[]) {
  const enemies: Enemy[] = []
  const lobstersPos: number[] = []
  const excludePos: number[] = []
  if (generatedEnemies) {
    for (const lobster of generatedEnemies.filter((enemy) => enemy.isLobster)) {
      excludePos.push(lobster.row, (lobster.row + 6) % 12)
    }
  }
  for (let index = 0; index < 3; index++) {
    const lobsterPos = getRandom(0, 11, excludePos)
    lobstersPos.push(lobsterPos)
    excludePos.push(lobsterPos, (lobsterPos + 6) % 12)
  }
  for (let index = 0; index < 12; index++) {
    enemies.push({ isLobster: lobstersPos.includes(index), row: index % 6, player })
  }
  return shuffle(enemies)
}

function generateHiddenEnemiesIndexes() {
  const enemiesIndexes: number[] = []
  for (let index = 0; index < 4; index++) {
    enemiesIndexes.push(getRandom(0, 11, enemiesIndexes))
  }
  return enemiesIndexes
}

function cardHasEnemy(card: Card): boolean {
  return (!!card.enemy || (card.object?.revealed && !!card.object.enemy)) ?? false
}

function pathHasEnemy(cards: Card[][], origin: Position, destination: Position) {
  if ((origin.column === destination.column) && (origin.row === destination.row)) return false
  const card = cards[destination.row]?.[destination.column]
  if ((card) && (cardHasEnemy(card))) return true
  if (origin.row !== destination.row) {
    let loopStart = origin.row + 1
    let loopEnd = destination.row
    if (origin.row > destination.row) {
      loopStart = destination.row
      loopEnd = origin.row - 1
    }
    for (let row = loopStart; row <= loopEnd; row++) {
      const card = cards[row]?.[origin.column]
      if ((card) && (cardHasEnemy(card))) return true
    }
  } else {
    let loopStart = origin.column + 1
    let loopEnd = destination.column
    if (origin.column > destination.column) {
      loopStart = destination.column
      loopEnd = origin.column - 1
    }
    for (let column = loopStart; column <= loopEnd; column++) {
      const card = cards[origin.row]?.[column]
      if ((card) && (cardHasEnemy(card))) return true
    }
  }
  return false
}

function eatShrimp(amount: number, board: Board) {
  board.shrimpCount -= amount
  if (board.shrimpCount < 0) board.shrimpCount = 0
  if (board.shrimpCount === 0) updateGameState("lost", board)
}

function getPlayerCardData(cards: Card[][]): Card[][] {
  return cards.map((row) => row.map((card) => ({
    enemy: card.enemy,
    object: card.object ? {
      icon: card.object.icon,
      enemy: card.object.revealed ? card.object.enemy : undefined,
      revealed: card.object.revealed,
    } : undefined,
  })))
}

function getPlayerForbiddenObjects(player: Player, cards: Card[][]): Position[] {
  const postions: Position[] = []
  for (let row = 0; row < cards.length; row++) {
    const cardRow = cards[row]
    if (!cardRow) continue
    for (let column = 0; column < cardRow.length; column++) {
      const card = cardRow?.[column]
      if (card?.object?.enemy?.player === player) postions.push({ row, column })
    }
  }
  return postions
}

function updateGameState(state: GameState, board: Board) {
  if (["lost", "win"].includes(board.gameState)) return
  board.gameState = state
}

export function generateBoard(): Board | undefined {
  const cards: Card[][] = []
  const shuffledObjectIcons = shuffle(objectIcons)
  const playersPos: Position = { column: 0, row: 5 }
  const barcoEnemies = generateEnemies("barco")
  const solEnemies = generateEnemies("sol", barcoEnemies)
  const enemies: Record<Player, Enemy[]> = { barco: barcoEnemies, sol: solEnemies }
  const enemiesIndexes = generateHiddenEnemiesIndexes()
  let objectIconIndex: keyof typeof shuffledObjectIcons = 0
  for (let row = 0; row < 6; row++) {
    const excludeColumns: number[] = []
    const objectsCountColumns = getObjectsCountColumns(cards)
    objectsCountColumns.forEach((count, index) => (count >= 2) ? excludeColumns.push(index) : null)
    const object1Column = getRandom(0, 5, excludeColumns)
    if ((row === 4) && (objectsCountColumns.filter((count) => count === 1).length === 2) && (objectsCountColumns[object1Column] === 1)) {
      excludeColumns.push(objectsCountColumns.findIndex((count, index) => (count === 1 && index !== object1Column)))
    }
    const object2Column = getRandom(0, 5, [object1Column, ...excludeColumns])
    const objectsColumns = [object1Column, object2Column]
    const columns: Card[] = []
    for (let column = 0; column < 6; column++) {
      const card: Card = {}
      if (objectsColumns.includes(column)) {
        const icon = shuffledObjectIcons[objectIconIndex]
        if (!icon) continue
        card.object = { icon, revealed: false }
        const enemyIndex = enemiesIndexes.indexOf(objectIconIndex)
        if ((enemyIndex > -1) && (card.object)) {
          const player = enemyIndex < 2 ? "barco" : "sol"
          card.object.enemy = { isLobster: false, player, row }
        }
        objectIconIndex++
      }
      columns.push(card)
    }
    cards.push(columns)
  }
  if (!cards[5]) return
  for (let index = 0; index < cards[5].length; index++) {
    if (!cards[5][index]?.object) {
      playersPos.column = index
      break
    }
  }
  const gameState = "draw"
  const shrimpCount = 5
  const turn = "barco"
  const currentEnemy = undefined
  const freedCount = 0
  return { cards, playersPos, enemies, gameState, shrimpCount, turn, currentEnemy, freedCount }
}

export function getPlayerBoardData(player: Player, connectedPlayers: number, newBoard: boolean, board: Board): PlayerBoard {
  const enemyCount = board.enemies[player].length
  return {
    character: player,
    cards: getPlayerCardData(board.cards),
    playersPos: board.playersPos,
    forbiddenObjects: getPlayerForbiddenObjects(player, board.cards),
    gameState: board.gameState,
    shrimpCount: board.shrimpCount,
    turn: board.turn,
    currentEnemy: board.currentEnemy,
    freedCount: board.freedCount,
    enemyCount,
    connectedPlayers,
    new: newBoard,
  }
}

export function drawEnemy(board: Board) {
  board.currentEnemy = board.enemies[board.turn].pop()
  updateGameState(board.currentEnemy ? "place" : "lost", board)
}

export function placeEnemy(row: number, column: number, board: Board) {
  if (!board.currentEnemy) return
  const targetCard = board.cards[row]?.[column]
  if (!targetCard) return
  targetCard.enemy = { isLobster: board.currentEnemy.isLobster, player: board.turn, row }
  if ((board.playersPos.row === row) && (board.playersPos.column === column)) {
    eatShrimp(1, board)
  }
  board.currentEnemy = undefined
  updateGameState("move", board)
}

export function movePlayer(row: number, column: number, board: Board) {
  const card = board.cards[row]?.[column]
  if (!card) return
  if (pathHasEnemy(board.cards, board.playersPos, { row, column })) {
    eatShrimp(1, board)
  }
  if (card.object) {
    if (!card.object.revealed) {
      card.object.revealed = true
      if (card.object.enemy) {
        board.enemies[card.object.enemy.player].pop()
        eatShrimp(2, board)
      } else {
        board.freedCount += 1
        if (board.freedCount === 8) {
          updateGameState("win", board)
        }
      }
    }
  }
  board.playersPos = { column, row }
  board.turn = board.turn === "barco" ? "sol" : "barco"
  updateGameState("draw", board)
}

export function getTutorialBoard(): Board {
  return {
    cards: [
      [
        { object: { icon: objectIcons[8], revealed: false, enemy: { isLobster: false, player: "sol", row: 3 } } },
        {},
        {},
        {},
        {},
        { object: { icon: objectIcons[1], revealed: false } },
      ],
      [
        { object: { icon: objectIcons[2], revealed: false } },
        { object: { icon: objectIcons[3], revealed: false } },
        {},
        {},
        {},
        {},
      ],
      [
        {},
        { object: { icon: objectIcons[4], revealed: false } },
        { object: { icon: objectIcons[5], revealed: false } },
        {},
        {},
        {},
      ],
      [
        {},
        {},
        {},
        {},
        { object: { icon: objectIcons[6], revealed: false } },
        { object: { icon: objectIcons[7], revealed: false } },
      ],
      [
        {},
        {},
        {},
        { object: { icon: objectIcons[0], revealed: false, enemy: { isLobster: false, player: "sol", row: 4 } } },
        { object: { icon: objectIcons[9], revealed: false, enemy: { isLobster: false, player: "barco", row: 4 } } },
        {},
      ],
      [
        {},
        {},
        { object: { icon: objectIcons[10], revealed: false, enemy: { isLobster: false, player: "barco", row: 5 } } },
        { object: { icon: objectIcons[11], revealed: false } },
        {},
        {},
      ],
    ],
    playersPos: { column: 0, row: 5 },
    enemies: {
      barco: [
        { isLobster: true, row: 2, player: "barco" },
        { isLobster: false, row: 4, player: "barco" },
        { isLobster: true, row: 4, player: "barco" },
        { isLobster: false, row: 1, player: "barco" },
        { isLobster: false, row: 2, player: "barco" },
        { isLobster: false, row: 5, player: "barco" },
        { isLobster: false, row: 3, player: "barco" },
        { isLobster: false, row: 1, player: "barco" },
        { isLobster: false, row: 0, player: "barco" },
        { isLobster: true, row: 5, player: "barco" },
        { isLobster: false, row: 3, player: "barco" },
        { isLobster: false, row: 0, player: "barco" },
      ],
      sol: [
        { isLobster: true, row: 1, player: "sol" },
        { isLobster: false, row: 2, player: "sol" },
        { isLobster: false, row: 5, player: "sol" },
        { isLobster: false, row: 5, player: "sol" },
        { isLobster: false, row: 0, player: "sol" },
        { isLobster: false, row: 4, player: "sol" },
        { isLobster: false, row: 3, player: "sol" },
        { isLobster: true, row: 2, player: "sol" },
        { isLobster: true, row: 3, player: "sol" },
        { isLobster: false, row: 0, player: "sol" },
        { isLobster: false, row: 4, player: "sol" },
        { isLobster: false, row: 1, player: "sol" },
      ],
    },
    gameState: "draw",
    shrimpCount: 5,
    turn: "barco",
    freedCount: 0,
  }
}