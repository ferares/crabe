import type { CrabeGameEnemyEvent, CrabeGameMoveEvent } from "../../../types/Events";

import { getLocalizedPath, useTranslations } from "../../i18n/utils";

import { drawEnemy, enemyIcons, forbiddenObjectsIcon, getPlayerBoardData, getTutorialBoard, movePlayer, objectRevealedIcon, placeEnemy, playersIcon, shrimpIcon } from "../../../helpers/game";

import type { GameBoard } from "../GameBoard/GameBoard";
import type { GameHeader } from "../GameHeader/GameHeader";
import type { Modal } from "../Modal/Modal";
import type { Update } from "../../../types/GameServer";

export class Tutorial extends HTMLElement {
  private boardElement: GameBoard
  private header: GameHeader
  private modal: Modal
  private modalButton: HTMLButtonElement
  private card: HTMLElement
  private cardTitle: HTMLElement
  private cardContent: HTMLElement
  private cardButton: HTMLButtonElement
  private board = getTutorialBoard()
  private t = useTranslations(window.Astro.currentLocale)
  private step = -1

  constructor() {
    super()
    this.boardElement = this.querySelector("crabe-game-board")!
    this.header = this.querySelector("crabe-game-header")!
    this.modal = this.querySelector("#tutorial-modal")!
    this.modalButton = this.querySelector("[data-js=modal-button]")!
    this.card = this.querySelector("[data-js=tutorial-card]")!
    this.cardTitle = this.querySelector("[data-js=card-title]")!
    this.cardContent = this.querySelector("[data-js=card-content]")!
    this.cardButton = this.querySelector("[data-js=card-button]")!
  }

  connectedCallback() {
    this.boardElement.addEventListener("crabe:game:draw", this.handleDraw)
    this.boardElement.addEventListener("crabe:game:enemy", this.handlePlaceEnemy)
    this.boardElement.addEventListener("crabe:game:move", this.handleMovePlayers)
    this.boardElement.update(getPlayerBoardData("barco", 2, false, this.board), { type: "status" })
    this.modalButton.addEventListener("click", () => this.nextStep())
    this.cardButton.addEventListener("click", () => this.nextStep())
    this.boardElement.update(getPlayerBoardData("barco", 2, false, this.board), { type: "status" })
    this.header.update(getPlayerBoardData("barco", 2, false, this.board))
    this.nextStep()
  }

  disconnectedCallback() {
    this.boardElement.removeEventListener("crabe:game:draw", this.handleDraw)
    this.boardElement.removeEventListener("crabe:game:enemy", this.handlePlaceEnemy)
    this.boardElement.removeEventListener("crabe:game:move", this.handleMovePlayers)
    this.modalButton.removeEventListener("click", () => this.nextStep())
    this.cardButton.removeEventListener("click", () => this.nextStep())
  }

  private nextStep = async () => {
    this.step++
    if (this.step === 0) {
      let content = this.t("Pages.Tutorial.t1")
      content += this.t("Pages.Tutorial.m1").replaceAll("{objectRevealedIcon}", objectRevealedIcon).replaceAll("{enemyIcon}", enemyIcons.octopus)
      this.modalButton.textContent = this.t("Labels.continue")
      this.modal.setContent(content)
      this.modal.open()
    } else if (this.step === 1) {
      let content = this.t("Pages.Tutorial.t2")
      content += this.t("Pages.Tutorial.m2")
      this.modal.setContent(content)
    } else if (this.step === 2) {
      this.modal.close()
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t3")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m3")
      this.cardButton.classList.add("hide")
      this.cardButton.classList.add("hide")
      this.card.classList.add("show")
    } else if (this.step === 3) {
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t4")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m4")
    } else if (this.step === 4) {
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t5")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m5")
      this.cardButton.classList.remove("hide")
    } else if (this.step === 5) {
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t6")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m6").replaceAll("{objectIcon}", this.board.cards[0][0].object?.icon ?? "")
      this.cardButton.classList.add("hide")
    } else if (this.step === 6) {
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t7")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m7").replaceAll("{objectIcon}", this.board.cards[0][0].object?.icon ?? "").replaceAll("{shrimpIcon}", shrimpIcon).replaceAll("{playersIcon}", playersIcon)
      this.cardButton.classList.remove("hide")
    } else if (this.step === 7) {
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t8")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m8")
      drawEnemy(this.board)
      await this.render({ type: "status" })
    } else if (this.step === 8) {
      this.card.classList.remove("show")
      const row = 4
      const column = 0
      placeEnemy(row, column, this.board)
      await this.render({ type: "place", row, column })
      this.card.classList.add("show")
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t9")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m9")
    } else if (this.step === 9) {
      this.card.classList.remove("show")
      this.cardButton.classList.add("hide")
      const row = 0
      const column = 5
      movePlayer(row, column, this.board)
      await this.render({ type: "move", row, column })
      this.nextStep()
    } else if (this.step === 10) {
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t10")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m10").replaceAll("{objectIcon}", this.board.cards[0][0].object?.icon ?? "").replaceAll("{objectRevealedIcon}", objectRevealedIcon)
      this.card.classList.add("show")
      this.cardButton.classList.remove("hide")
    } else if (this.step === 11) {
      this.card.setAttribute("data-step", this.step.toString())
      this.cardTitle.textContent = this.t("Pages.Tutorial.t11")
      this.cardContent.innerHTML = this.t("Pages.Tutorial.m11").replaceAll("{shrimpIcon}", shrimpIcon)
    } else if (this.step === 12) {
      this.card.classList.remove("show")
      let content = this.t("Pages.Tutorial.t12")
      content += this.t("Pages.Tutorial.m12").replaceAll("{forbiddenObjectsIcon}", forbiddenObjectsIcon)
      this.modalButton.textContent = this.t("Labels.finish-tutorial")
      this.modalButton.addEventListener("click", () => this.nextStep())
      this.modal.setContent(content)
      this.modal.open()
    } else if (this.step === 13) {
      window.location.href = getLocalizedPath("home", window.Astro.currentLocale)
    }
  }

  private handlePlaceEnemy = async (event: CrabeGameEnemyEvent) => {
    const { row, column } = event.detail
    if (this.step !== 3) return
    placeEnemy(row, column, this.board)
    await this.render({ type: "place", row, column })
    this.nextStep()
  }

  private handleMovePlayers = async (event: CrabeGameMoveEvent) => {
    const { row, column } = event.detail
    if ((this.step !== 5) || (row !== 0) || (column !== 0)) return
    movePlayer(0, 0, this.board)
    await this.render({ type: "move", row, column })
    this.nextStep()
  }

  private handleDraw = async () => {
    if (this.step !== 2) return
    drawEnemy(this.board)
    await this.render({ type: "status" })
    this.nextStep()
  }

  private render = async (update: Update) => {
    await this.boardElement.update(getPlayerBoardData("barco", 2, false, this.board), update)
    this.header.update(getPlayerBoardData("barco", 2, false, this.board))
  }
}