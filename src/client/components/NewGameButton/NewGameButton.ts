import type { Response } from "../../../types/GameServer"

import { getLocalizedPath } from "../../i18n/utils"

import { GameServer } from "../../scripts/GameServer"

export class NewGameButton extends HTMLElement {
  private button: HTMLButtonElement

  constructor() {
    super()
    this.button = this.querySelector("[data-js=button]")!
  }

  connectedCallback() {
    this.button.addEventListener("click", this.handleClick)
    GameServer.subscribe(this.handleResponse)
  }

  disconnectedCallback() {
    this.button.removeEventListener("click", this.handleClick)
    GameServer.unsubscribe(this.handleResponse)
  }

  private handleClick = () => {
    window.Crabe.setLoading(true)
    GameServer.sendMessage({ action: "create" })
  }

  private handleResponse = (response: Response) => {
    if (response.type === "create") {
      const targetUrl = new URL(getLocalizedPath("game"), window.location.origin);
      targetUrl.searchParams.set("room", response.code)
      window.location.href = targetUrl.toString()
    }
  }
}