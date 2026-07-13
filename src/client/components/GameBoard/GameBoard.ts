import type { Enemy } from "../../../types/Enemy"
import type { PlayerBoard } from "../../../types/Board"
import type { Card } from "../../../types/Card"
import type { Object } from "../../../types/Object"

import { enemyIcons, objectRevealedIcon, shrimpIcon } from "../../../helpers/game"

import { useTranslations } from "../../i18n/utils"

import type { Modal } from "../Modal/Modal"
import { Players } from "../../scripts/Players"

export class GameBoard extends HTMLElement {
  private currentBoard?: PlayerBoard
  private boardElement: HTMLOListElement
  private cards: { element: HTMLElement, clickHandler?: () => void }[][] = [] // 6x6
  private objectsElement: HTMLOListElement
  private enemiesElement: HTMLOListElement
  private actionsModal: Modal
  private restartButton: HTMLButtonElement
  private players = new Players()
  private audio = { win: new Audio("/sounds/win.mp3"), lose: new Audio("/sounds/lose.mp3") }
  private t = useTranslations(window.Astro.currentLocale)

  constructor() {
    super()
    this.boardElement = this.querySelector("[data-js=board]")!
    this.objectsElement = this.querySelector("[data-js=objects]")!
    this.enemiesElement = this.querySelector("[data-js=enemies]")!
    this.actionsModal = this.querySelector("#game-actions")!
    this.restartButton = this.querySelector("[data-js=restart]")!
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
    const { cards, turn, gameState, character, currentEnemy, shrimpCount, forbiddenObjects } = board

    // Update board
    this.boardElement.classList.toggle("board--draw", gameState === "draw")
    this.boardElement.classList.toggle("board--active", ["place", "move"].includes(gameState) && turn === character)

    // Update players token
    await this.players.update(this.cards.map(card => card.map(card => card.element)), board, this.currentBoard)

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
      if (gameState === "lost") {
        this.actionsModal.setTitle(this.t("Messages.game-lose"))
        if (shrimpCount === 0) {
          this.actionsModal.setContent(this.t("Messages.game-no-shrimp").replaceAll("{shrimpIcon}", shrimpIcon))
        } else {
          this.actionsModal.setContent(this.t("Messages.game-no-enemies").replaceAll("{enemyIcon}", enemyIcons.octopus))
        }
        this.audio.lose.play()
      } else {
        this.actionsModal.setTitle(this.t("Messages.game-win"))
        this.actionsModal.setContent("")
        this.audio.win.play()
      }
      this.actionsModal.open()
    } else {
      this.actionsModal.close()
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