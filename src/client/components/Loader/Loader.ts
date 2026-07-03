import type { CrabeLoadingEvent } from "../../../types/Events";

/**
 * Custom element that displays a loading overlay with an optional message.
 *
 * Listens for `crabe:loading` events on `document` to show or hide itself,
 * toggling visibility and updating ARIA attributes for accessibility.
 *
 * @listens crabe:loading - Shows the loader when `loading` is true, hides it otherwise.
 */
export class Loader extends HTMLElement {
  private messageElement: HTMLElement;

  constructor() {
    super();
    this.messageElement = this.querySelector(
      "[data-js=message]",
    ) as HTMLElement;
  }

  connectedCallback() {
    document.addEventListener("crabe:loading", this.loadingEventHandler);
  }

  disconnectedCallback() {
    document.removeEventListener("crabe:loading", this.loadingEventHandler);
  }

  /**
   * Shows or hides the loader in response to an `crabe:loading` event.
   * When shown, renders the provided message (if any) and marks the element
   * as visible to assistive technologies.
   */
  private loadingEventHandler = (event: CrabeLoadingEvent) => {
    const { loading, message } = event.detail;
    this.classList.toggle("active", loading);
    this.setAttribute("aria-hidden", String(!loading));
    this.messageElement.innerHTML = message ?? "";
  };
}