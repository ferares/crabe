import type { CrabeEventMap } from "../../types/Events.ts";

import type { Locale } from "../i18n/config.ts";

import { Dropdown } from "../components/Dropdown/Dropdown.ts";
import { LangMenu } from "../components/LangMenu/LangMenu.ts";
import { NewGameButton } from "../components/NewGameButton/NewGameButton.ts";
import { GameBoard } from "../components/GameBoard/GameBoard.ts";
import { Modal } from "../components/Modal/Modal.ts";
import { type Alert, Alerts } from "../components/Alerts/Alerts.ts";
import { Loader } from "../components/Loader/Loader.ts";
import { GameHeader } from "../components/GameHeader/GameHeader.ts";
import { Game } from "../components/Game/Game.ts";
import { Tutorial } from "../components/Tutorial/Tutorial.ts";

type EventDetail<T> = T extends CustomEvent<infer D> ? D : T extends Event ? void : never

type OptionalArg<D> = D extends void ? [] : [data: D]

declare global {
  interface Window {
    Crabe: Crabe,
    Astro: { currentLocale: Locale },
  }
  interface ElementEventMap extends CrabeEventMap { }
  interface DocumentEventMap extends CrabeEventMap { }
}

export class Crabe {
  ready = (fn: () => any) => {
    document.addEventListener("DOMContentLoaded", fn)
  }

  emitEvent = <T extends keyof HTMLElementEventMap>(element: Node, name: T, ...data: OptionalArg<EventDetail<HTMLElementEventMap[T]>>) => {
    element.dispatchEvent(new CustomEvent(name, { detail: data[0] }))
  }

  setLoading = (loading: boolean, message?: string) => {
    this.emitEvent(document, "crabe:loading", { loading, message })
  }

  pushAlert = (alert: Alert) => {
    document.querySelector<Alerts>("#main-alerts")?.push(alert)
  }
}

window.Crabe = new Crabe();

window.Crabe.ready(() => {
  customElements.define("crabe-loader", Loader);
  customElements.define("crabe-dropdown", Dropdown);
  customElements.define("crabe-modal", Modal);
  customElements.define("crabe-lang-menu", LangMenu);
  customElements.define("crabe-new-game-button", NewGameButton);
  customElements.define("crabe-game-header", GameHeader);
  customElements.define("crabe-game-board", GameBoard);
  customElements.define("crabe-game", Game);
  customElements.define("crabe-alerts", Alerts);
  customElements.define("crabe-tutorial", Tutorial);
})