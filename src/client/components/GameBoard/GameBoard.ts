import type { Enemy } from "../../../types/Enemy"
import type { PlayerBoard } from "../../../types/Board"
import type { Card } from "../../../types/Card"
import type { Object } from "../../../types/Object"
import type { Player } from "../../../types/Player"

import { enemyIcons, objectRevealedIcon, playersIcon } from "../../../helpers/game"

import { useTranslations } from "../../i18n/utils"

export class GameBoard extends HTMLElement {
  private boardElement: HTMLOListElement
  private objectsElement: HTMLOListElement
  private enemiesElement: HTMLOListElement
  private actionsElement: HTMLElement
  private restartButton: HTMLButtonElement
  private t = useTranslations(window.Astro.currentLocale)

  constructor() {
    super()
    this.boardElement = this.querySelector("[data-js=board]")!
    this.objectsElement = this.querySelector("[data-js=objects]")!
    this.enemiesElement = this.querySelector("[data-js=enemies]")!
    this.actionsElement = this.querySelector("[data-js=actions]")!
    this.restartButton = this.querySelector("[data-js=restart]")!
  }

  connectedCallback() {
    this.restartButton.addEventListener("click", this.handleRestart)
  }

  disconnectedCallback() {
    this.restartButton.removeEventListener("click", this.handleRestart)
  }

  update = (board: PlayerBoard) => {
    const { cards, turn, gameState, character, currentEnemy } = board

    // Display restart prompt when game finishes
    if (["lost", "win"].includes(gameState)) {
      this.actionsElement.classList.add("show")
      this.restartButton.textContent = gameState === "lost" ? this.t("Messages.game-lose") : this.t("Messages.game-win")
    } else {
      this.actionsElement.classList.remove("show")
    }

    // Update board
    this.boardElement.textContent = ""
    this.boardElement.classList.toggle("board--draw", gameState === "draw")
    this.boardElement.classList.toggle("board--active", ["place", "move"].includes(gameState) && turn === character)
    for (let rowIndex = 0; rowIndex < cards.length; rowIndex++) {
      const row = cards[rowIndex];
      for (let cardIndex = 0; cardIndex < row.length; cardIndex++) {
        const card = row[cardIndex];
        const cardElement = this.createCard(board, rowIndex, cardIndex, card)
        this.boardElement.appendChild(cardElement)
      }
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
  }

  updateForbiddenObjects = (board: PlayerBoard) => {
    const { forbiddenObjects, cards } = board
    for (const position of forbiddenObjects) {
      const card = cards[position.row][position.column]
      const item = document.createElement("li")
      item.title = this.t("Messages.object-enemy")
      const cardElement = document.createElement("span")
      cardElement.classList.add("card", "btn", "card--disabled", `card--enemy-${card.object?.enemy?.player}`)
      cardElement.appendChild(this.createObject(card.object!))
      item.appendChild(cardElement)
      this.objectsElement.appendChild(item)
    }
  }

  private createCard = (board: PlayerBoard, row: number, column: number, card: Card) => {
    const { cards, turn, currentEnemy, gameState, playersPos } = board
    let isActive = false;
    if (currentEnemy?.row === row && !card.object && !card.enemy) {
      isActive = true;
    } else if (gameState === "move") {
      if (turn === "barco") {
        isActive = playersPos.column === column;
      } else {
        isActive = playersPos.row === row;
      }
    }
    const hasPlayer = playersPos.column === column && playersPos.row === row
    const hasEnemy = !!(card.enemy?.player ?? (card.object?.revealed && card.object?.enemy?.player))
    const clickHandler = this.generateClickHandler(board, row, column, card)
    const cardElement = document.createElement("button")
    cardElement.type = "button"
    cardElement.classList.add("card")
    cardElement.classList.toggle("card--active", isActive)
    cardElement.classList.toggle("card--disabled", !clickHandler)
    cardElement.classList.toggle("card--player", hasPlayer)
    cardElement.classList.toggle("card--enemy", hasEnemy)
    cardElement.classList.toggle("card--object", !!card.object)
    cardElement.classList.toggle("card--object-revealed", !!card.object?.revealed)
    if (clickHandler) cardElement.addEventListener("click", clickHandler)
    if (card.object) {
      cardElement.appendChild(this.createObject(card.object))
    } else if (card.enemy) {
      cardElement.appendChild(this.createEnemy(card.enemy))
    }
    if (hasPlayer) {
      cardElement.appendChild(this.createPlayers(turn))
    }
    return cardElement
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

  private createPlayers = (turn: Player) => {
    const playersElement = document.createElement("span")
    playersElement.classList.add("players", `players--${turn}`)
    playersElement.textContent = playersIcon
    return playersElement
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