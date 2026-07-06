import type { Enemy } from "../../../types/Enemy"
import type { PlayerBoard } from "../../../types/Board"
import type { Card } from "../../../types/Card"
import type { Object } from "../../../types/Object"

import { enemyIcons, objectRevealedIcon, playersIcon } from "../../../helpers/game"

import { useTranslations } from "../../i18n/utils"

const animationOptions: KeyframeAnimationOptions = {
  duration: 1000,
  easing: "ease-in-out",
  fill: "forwards",
}

export class GameBoard extends HTMLElement {
  private currentBoard?: PlayerBoard
  private boardElement: HTMLOListElement
  private cards: { element: HTMLElement, clickHandler?: () => void }[][] = [] // 6x6
  private objectsElement: HTMLOListElement
  private enemiesElement: HTMLOListElement
  private actionsElement: HTMLElement
  private restartButton: HTMLButtonElement
  private players: { icon: HTMLElement, wrapper: HTMLElement }
  private t = useTranslations(window.Astro.currentLocale)

  constructor() {
    super()
    this.boardElement = this.querySelector("[data-js=board]")!
    this.objectsElement = this.querySelector("[data-js=objects]")!
    this.enemiesElement = this.querySelector("[data-js=enemies]")!
    this.actionsElement = this.querySelector("[data-js=actions]")!
    this.restartButton = this.querySelector("[data-js=restart]")!
    this.players = GameBoard.createPlayers()
    const cards = this.querySelectorAll<HTMLElement>("[data-js=card]")
    let rowIndex = -1
    for (let index = 0; index < cards.length; index++) {
      const card = cards[index]
      const columnIndex = index % 6
      if (columnIndex === 0) {
        rowIndex += 1
        this.cards[rowIndex] = []
      }
      this.cards[rowIndex][columnIndex] = { element: card }
    }
  }

  connectedCallback() {
    this.restartButton.addEventListener("click", this.handleRestart)
    window.Crabe.setLoading(true)
  }

  disconnectedCallback() {
    this.restartButton.removeEventListener("click", this.handleRestart)
  }

  update = async (board: PlayerBoard) => {
    const { cards, turn, gameState, character, currentEnemy, forbiddenObjects } = board

    // Update board
    this.boardElement.classList.toggle("board--draw", gameState === "draw")
    this.boardElement.classList.toggle("board--active", ["place", "move"].includes(gameState) && turn === character)

    // Update players token
    await this.updatePlayers(board)

    this.updateCards(board)

    // Update forbidden objects
    this.objectsElement.textContent = ""
    for (const position of forbiddenObjects) {
      const card = cards[position.row][position.column]
      const item = document.createElement("li")
      item.title = this.t("Messages.object-enemy")
      const cardElement = document.createElement("span")
      cardElement.classList.add("card", "btn", "card--disabled", `card--enemy-${card.object?.enemy?.player}`, "card--object")
      cardElement.appendChild(this.createObject(card.object!))
      item.appendChild(cardElement)
      this.objectsElement.appendChild(item)
    }

    // Update enemy placement rows
    this.enemiesElement.textContent = ""
    this.enemiesElement.classList.toggle("enemy-rows--top", currentEnemy?.row === 5)
    for (let row = 0; row < 6; row++) {
      const item = document.createElement("li")
      if (currentEnemy?.row === row) {
        const cardElement = document.createElement("span")
        cardElement.title = this.t("Messages.place-enemy")
        cardElement.classList.add("card", "btn", "btn--enemy", "card--disabled", `card--enemy-${currentEnemy.player}}`)
        cardElement.appendChild(this.createEnemy(currentEnemy))
        item.appendChild(cardElement)
      }
      this.enemiesElement.appendChild(item)
    }
    if (gameState === "draw" && (turn === character)) {
      const item = document.createElement("li")
      const button = document.createElement("button")
      button.type = "button"
      button.classList.add("card", "card--draw")
      button.title = this.t("Messages.draw-card")
      button.addEventListener("click", this.handleDraw)
      button.innerHTML = `<span>${enemyIcons.lobster}</span><span>${enemyIcons.octopus}</span>`
      item.appendChild(button)
      this.enemiesElement.appendChild(item)
    }

    // Display restart prompt when game finishes
    if (["lost", "win"].includes(gameState)) {
      this.actionsElement.classList.add("show")
      this.restartButton.textContent = gameState === "lost" ? this.t("Messages.game-lose") : this.t("Messages.game-win")
    } else {
      this.actionsElement.classList.remove("show")
    }

    // Remove loading state after first load
    if (!this.currentBoard) {
      this.classList.remove("loading")
      window.Crabe.setLoading(false)
    }
    this.currentBoard = board
  }

  private updateCards = (board: PlayerBoard) => {
    const { cards, turn, currentEnemy, gameState, playersPos } = board
    for (let rowIndex = 0; rowIndex < cards.length; rowIndex++) {
      const row = cards[rowIndex];
      for (let cardIndex = 0; cardIndex < row.length; cardIndex++) {
        const cardData = cards[rowIndex][cardIndex]
        let isActive = false;
        if (currentEnemy?.row === rowIndex && !cardData.object && !cardData.enemy) {
          isActive = true;
        } else if (gameState === "move") {
          if (turn === "barco") {
            isActive = playersPos.column === cardIndex;
          } else {
            isActive = playersPos.row === rowIndex;
          }
        }
        const enemyPlayer = cardData.enemy?.player ?? (cardData.object?.revealed && cardData.object?.enemy?.player)
        const card = this.cards[rowIndex][cardIndex]
        const cardElement = card.element
        if (card.clickHandler) cardElement.removeEventListener("click", card.clickHandler)
        card.clickHandler = this.generateClickHandler(board, rowIndex, cardIndex, cardData)
        cardElement.textContent = ""
        cardElement.classList.toggle("card--active", isActive)
        cardElement.classList.toggle("card--disabled", !card.clickHandler)
        cardElement.classList.remove("card--enemy-barco")
        cardElement.classList.remove("card--enemy-sol")
        cardElement.classList.toggle(`card--enemy-${enemyPlayer}`, !!enemyPlayer)
        cardElement.classList.toggle("card--object", !!cardData.object)
        cardElement.classList.toggle("card--object-revealed", !!cardData.object?.revealed)
        if (card.clickHandler) cardElement.addEventListener("click", card.clickHandler)
        if (cardData.object) {
          cardElement.appendChild(this.createObject(cardData.object))
        } else if (cardData.enemy) {
          cardElement.appendChild(this.createEnemy(cardData.enemy))
        }
      }
    }
  }

  private generateClickHandler = (board: PlayerBoard, row: number, column: number, card: Card) => {
    const { turn, currentEnemy, gameState, playersPos, character } = board
    let clickHandler: undefined | (() => void) = undefined;
    if (turn === character) {
      if (currentEnemy?.row === row && !card.object && !card.enemy) {
        clickHandler = () => this.handlePlaceEnemy(row, column);
      } else if (gameState === "move") {
        if (turn === "barco") {
          if (playersPos.column === column)
            clickHandler = () => this.handleMovePlayers(row, column);
        } else {
          if (playersPos.row === row)
            clickHandler = () => this.handleMovePlayers(row, column);
        }
      }
    }
    return clickHandler
  }

  private createObject = (object: Object) => {
    const objectElement = document.createElement("span")
    objectElement.classList.add("object")
    objectElement.classList.toggle("object", object.revealed)
    if (!object.revealed) {
      objectElement.textContent = object.icon
    } else if (object.enemy) {
      objectElement.appendChild(this.createEnemy(object.enemy))
    } else {
      objectElement.textContent = objectRevealedIcon
    }
    return objectElement
  }

  private createEnemy = (enemy: Enemy) => {
    const enemyElement = document.createElement("span")
    enemyElement.classList.add("enemy", `enemy--${enemy.player}`)
    enemyElement.textContent = enemy.isLobster ? enemyIcons.lobster : enemyIcons.octopus
    return enemyElement
  }

  private updatePlayers = (board: PlayerBoard) => {
    const { turn, playersPos: { column, row } } = board

    // Figure out rotation and background color animation
    const first = this.players.wrapper.getBoundingClientRect();
    let animations: { icon: Keyframe[], wrapper: Keyframe[] } = { icon: [], wrapper: [] }
    if (this.currentBoard) {
      if (this.currentBoard.turn !== board.turn) {
        animations.icon = [
          { transform: "rotate(0deg)", backgroundColor: "var(--color-barco)" },
          { transform: "rotate(90deg)", backgroundColor: "var(--color-sol)" },
        ]
        if (board.turn === "barco") animations.icon.reverse()
      }
    }

    // Update players element's classes and position
    this.players.wrapper.classList.remove("players--barco", "players--sol")
    this.players.wrapper.classList.add(`players--${turn}`)
    this.cards[row][column].element.parentElement?.appendChild(this.players.wrapper)

    // Figure out movement animation
    if (this.currentBoard) {
      const last = this.players.wrapper.getBoundingClientRect();
      if (first && last) {
        const deltaX = first.right - last.right;
        const deltaY = first.top - last.top;
        if (deltaX !== 0 || deltaY !== 0) {
          animations.wrapper = [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" },
          ]
        }
      }
    }
    // Animate
    return new Promise<void>((resolve) => {
      if (!animations.icon.length && !animations.wrapper.length) return resolve()
      requestAnimationFrame(() => {
        this.players.icon.animate(animations.icon, animationOptions);
        this.players.wrapper.animate(animations.wrapper, animationOptions).addEventListener("finish", () => {
          resolve()
          if (this.currentBoard && this.currentBoard.shrimpCount > board.shrimpCount) {
            this.players.wrapper.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 150, iterations: 4, easing: "ease-in-out" })
          }
        });
      })
    })
  }

  private static createPlayers = () => {
    const wrapper = document.createElement("span")
    wrapper.classList.add("players")
    const icon = document.createElement("span")
    icon.classList.add("players-icon")
    icon.textContent = playersIcon
    wrapper.appendChild(icon)
    return { icon, wrapper }
  }

  private handleRestart = () => {
    window.Crabe.emitEvent(this, "crabe:game:restart")
  }

  private handlePlaceEnemy = (row: number, column: number) => {
    window.Crabe.emitEvent(this, "crabe:game:enemy", { row, column })
  }

  private handleMovePlayers = (row: number, column: number) => {
    window.Crabe.emitEvent(this, "crabe:game:move", { row, column })
  }

  private handleDraw = () => {
    window.Crabe.emitEvent(this, "crabe:game:draw")
  }
}