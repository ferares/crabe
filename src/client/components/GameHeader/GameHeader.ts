import type { PlayerBoard } from "../../../types/Board"
import type { Player } from "../../../types/Player"
import type { GameState } from "../../../types/GameState"

import { useTranslations } from "../../i18n/utils"

export class GameHeader extends HTMLElement {
  private titleElement: HTMLElement
  private freedElement: HTMLElement
  private shrimpsElement: HTMLElement
  private EnemiesElement: HTMLElement
  private t = useTranslations(window.Astro.currentLocale)

  constructor() {
    super()
    this.titleElement = this.querySelector("[data-js=title]")!
    this.freedElement = this.querySelector("[data-js=freed]")!
    this.shrimpsElement = this.querySelector("[data-js=shrimps]")!
    this.EnemiesElement = this.querySelector("[data-js=enemies]")!
  }

  update = (board: PlayerBoard) => {
    const { cards, turn, gameState, character, freedCount, shrimpCount, enemyCount } = board
    this.titleElement.textContent = this.generateTitle(turn, character, gameState)
    this.freedElement.textContent = freedCount.toString()
    this.shrimpsElement.textContent = shrimpCount.toString()
    this.EnemiesElement.textContent = enemyCount.toString()
  }

  private generateTitle = (turn: Player, character: Player, gameState: GameState) => {
    let title = ""
    if (turn !== character) {
      title = this.t("Messages.waiting-for-player")
    } else {
      title = this.t("Messages.your-turn")
      if (gameState === "draw") {
        title += `: ${this.t("Messages.draw-card")}`
      } else if (gameState === "place") {
        title += `: ${this.t("Messages.place-card")}`
      } else if (gameState === "move") {
        title += `: ${this.t("Messages.move-crabs")}`
      }
    }
    return title
  }
}