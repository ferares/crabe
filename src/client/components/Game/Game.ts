import type { Response } from "../../../types/GameServer";

import { getLocalizedPath, useTranslations } from "../../i18n/utils";

import { GameServer } from "../../scripts/GameServer";

import type { GameBoard } from "../GameBoard/GameBoard";
import type { GameHeader } from "../GameHeader/GameHeader";
import type { Modal } from "../Modal/Modal";
import type { CrabeGameEnemyEvent, CrabeGameMoveEvent } from "../../../types/Events";

export class Game extends HTMLElement {
  private board: GameBoard
  private header: GameHeader
  private shareGameModal: Modal
  private shareGameButton: HTMLButtonElement
  private code: string
  private t = useTranslations(window.Astro.currentLocale)

  constructor() {
    super()
    const code = (new URLSearchParams(window.location.search)).get("room")
    if (!code) throw new Error("no room code found in url")
    this.code = code
    this.board = this.querySelector("crabe-game-board")!
    this.header = this.querySelector("crabe-game-header")!
    this.shareGameModal = this.querySelector("#share-game-modal")!
    this.shareGameButton = this.querySelector("[data-js=share]")!
  }

  connectedCallback() {
    GameServer.subscribe(this.handleMessage)
    GameServer.sendMessage({ action: "join", code: this.code })
    this.board.addEventListener("crabe:game:draw", this.handleDraw)
    this.board.addEventListener("crabe:game:enemy", this.handlePlaceEnemy)
    this.board.addEventListener("crabe:game:move", this.handleMovePlayers)
    this.board.addEventListener("crabe:game:restart", this.handleRestart)
    this.shareGameButton.addEventListener("click", this.handleShare)
  }

  disconnectedCallback() {
    GameServer.unsubscribe(this.handleMessage)
    this.board.removeEventListener("crabe:game:draw", this.handleDraw)
    this.board.removeEventListener("crabe:game:enemy", this.handlePlaceEnemy)
    this.board.removeEventListener("crabe:game:move", this.handleMovePlayers)
    this.board.removeEventListener("crabe:game:restart", this.handleRestart)
    this.shareGameButton.removeEventListener("click", this.handleShare)
  }

  private handleMessage = (response: Response) => {
    if (response.type === "join" || response.type === "update") {
      this.board.update(response.board)
      this.header.update(response.board)
      this.shareGameModal.toggle(response.board.new)
      if (response.type === "join") {
        this.board.updateForbiddenObjects(response.board)
      }
      if (!response.board.new && response.board.connectedPlayers < 2) {
        window.Crabe.setLoading(true, this.t("Messages.player-disconnected"))
        // TODO: Cancel button
      } else {
        window.Crabe.setLoading(false)
      }
    } else if (response.type === "start") {
      this.shareGameModal.close()
    } else if (response.type === "error") {
      console.error(response.text)
      if (response.code === 500) {
        window.Crabe.pushAlert({ type: "danger", content: this.t("Messages.error") })
      } else {
        if (response.code === 404) {
          window.Crabe.pushAlert({ type: "danger", content: this.t("Messages.game-not-found") })
        } else if (response.code === 409) {
          window.Crabe.pushAlert({ type: "danger", content: this.t("Messages.game-full") })
        }
        window.location.href = getLocalizedPath("home", window.Astro.currentLocale)
      }
    }
  }

  private handleShare = async () => {
    if (navigator?.share) {
      await navigator.share({ title: this.t("Messages.join-my-game"), text: "", url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      this.shareGameModal.pushAlert({ type: "info", content: this.t("Messages.copied-to-clipboard"), })
    }
  }

  private handleRestart = () => {
    GameServer.sendMessage({ action: "restart" })
  }

  private handlePlaceEnemy = (event: CrabeGameEnemyEvent) => {
    const { row, column } = event.detail
    GameServer.sendMessage({ action: "place", row, column })
  }

  private handleMovePlayers = (event: CrabeGameMoveEvent) => {
    const { row, column } = event.detail
    GameServer.sendMessage({ action: "move", row, column })
  }

  private handleDraw = () => {
    GameServer.sendMessage({ action: "draw" })
  }
}