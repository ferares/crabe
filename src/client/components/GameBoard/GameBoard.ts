import type { PlayerBoard } from "../../../types/Board"

import { useTranslations } from "../../i18n/utils"

import { createEnemy, enemyIcons, shrimpIcon } from "../../../helpers/game"
import { Players } from "../../../helpers/Players"
import { Card } from "../../../helpers/Card"

import type { Modal } from "../Modal/Modal"
import type { Update } from "../../../types/GameServer"

export class GameBoard extends HTMLElement {
  private currentBoard?: PlayerBoard
  private boardElement: HTMLOListElement
  private cards: Card[][] = [] // 6x6
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
    // Create cards
    const handlers = { placeEnemy: this.handlePlaceEnemy, movePlayers: this.handleMovePlayers }
    let row = -1
    for (let index = 0; index < cards.length; index++) {
      const card = cards[index]
      const column = index % 6
      if (column === 0) {
        row += 1
        this.cards[row] = []
      }
      this.cards[row][column] = new Card(card, { row, column }, handlers)
    }
  }

  connectedCallback() {
    this.restartButton.addEventListener("click", this.handleRestart)
    window.Crabe.setLoading(true)
  }

  disconnectedCallback() {
    this.restartButton.removeEventListener("click", this.handleRestart)
  }

  update = async (board: PlayerBoard, update: Update) => {
    const { cards, turn, gameState, character, currentEnemy, shrimpCount } = board

    // Update board
    this.boardElement.classList.toggle("board--draw", gameState === "draw")
    this.boardElement.classList.toggle("board--active", ["place", "move"].includes(gameState) && turn === character)

    // Update players
    await this.players.update(this.cards, board, this.currentBoard)

    // Animate enemy placement if that took place
    if (update.type === "place") {
      await this.cards[update.row][update.column].animateEnemy(update.enemy)
    }

    // Update cards
    for (const rows of this.cards) {
      for (const card of rows) {
        card.update(board)
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
        cardElement.appendChild(createEnemy(currentEnemy))
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

  private handleRestart = () => {
    window.Crabe.emitEvent(this, "crabe:game:restart")
    this.actionsModal.close()
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