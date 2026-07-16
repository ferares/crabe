import type { PlayerBoard } from "../types/Board"
import type { Position } from "../types/Position"
import type { Card as CardData } from "../types/Card"

import { animate, createEnemy, createObject } from "./game"
import type { Enemy } from "../types/Enemy"

type Handlers = {
  placeEnemy: (row: number, column: number) => void,
  movePlayers: (row: number, column: number) => void,
}

export class Card {
  private element: HTMLElement
  private clickHandler?: () => void
  private handlers: Handlers
  public readonly position: Position

  constructor(element: HTMLElement, position: Position, handlers: Handlers) {
    this.element = element
    this.position = position
    this.handlers = handlers
  }

  update = (board: PlayerBoard) => {
    const { cards, turn, currentEnemy, gameState, playersPos } = board
    const { row, column } = this.position
    const cardData = cards[row][column]

    const enemyPlayer = cardData.enemy?.player ?? (cardData.object?.revealed && cardData.object?.enemy?.player)
    let isActive = false;
    if (currentEnemy?.row === row && !cardData.object && !cardData.enemy) {
      isActive = true;
    } else if (gameState === "move") {
      if (turn === "barco") {
        isActive = playersPos.column === column;
      } else {
        isActive = playersPos.row === row;
      }
    }

    if (this.clickHandler) this.element.removeEventListener("click", this.clickHandler)
    this.clickHandler = this.generateClickHandler(board, row, column, cardData)
    if (this.clickHandler) this.element.addEventListener("click", this.clickHandler)

    this.element.textContent = ""
    this.element.classList.toggle("card--active", isActive)
    this.element.classList.toggle("card--disabled", !this.clickHandler)
    this.element.classList.remove("card--enemy-barco")
    this.element.classList.remove("card--enemy-sol")
    this.element.classList.toggle(`card--enemy-${enemyPlayer}`, !!enemyPlayer)
    this.element.classList.toggle("card--forbidden", !!cardData.object?.enemy)
    this.element.classList.toggle("card--object", !!cardData.object)
    this.element.classList.toggle("card--object-revealed", !!cardData.object?.revealed)

    if (cardData.object) {
      this.element.appendChild(createObject(cardData.object))
    } else if (cardData.enemy) {
      const enemy = createEnemy(cardData.enemy)
      this.element.appendChild(enemy)
    }
  }

  movePlayers = (players: HTMLElement) => {
    this.element.parentElement?.appendChild(players)
  }

  animateEnemy = async (enemy?: Enemy) => {
    if (!enemy) return
    const enemyElement = createEnemy(enemy)
    this.element.textContent = ""
    this.element.appendChild(enemyElement)
    this.element.classList.remove("card--enemy-barco")
    this.element.classList.remove("card--enemy-sol")
    this.element.classList.add(`card--enemy-${enemy.player}`)
    return Promise.all([
      animate(enemyElement, [{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: "ease-in-out" }),
      animate(this.element, [{ backgroundColor: "var(--color-card)" }, { backgroundColor: "var(--color-danger)" }], { duration: 1000, easing: "ease-in-out" }),
    ])
  }

  private generateClickHandler = (board: PlayerBoard, row: number, column: number, card: CardData) => {
    const { turn, currentEnemy, gameState, playersPos, character } = board
    let clickHandler: undefined | (() => void) = undefined;
    if (turn === character) {
      if (currentEnemy?.row === row && !card.object && !card.enemy) {
        clickHandler = () => this.handlers.placeEnemy(row, column);
      } else if (gameState === "move") {
        if (turn === "barco") {
          if (playersPos.column === column)
            clickHandler = () => this.handlers.movePlayers(row, column);
        } else {
          if (playersPos.row === row)
            clickHandler = () => this.handlers.movePlayers(row, column);
        }
      }
    }
    return clickHandler
  }
}