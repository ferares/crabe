import type { Alert, Alerts } from "../Alerts/Alerts";

/**
 * Custom element that wraps a native `<dialog>` with animated show/hide behavior.
 *
 * Content and title are set programmatically via {@link setContent}.
 * Closing is triggered by the close button or clicking the backdrop.
 */
export class Modal extends HTMLElement {
  private content: HTMLElement;
  private body: HTMLElement;
  private titleElement: HTMLElement;
  private dialog: HTMLDialogElement;
  private closeBtn: HTMLButtonElement | null;
  private alerts: Alerts
  private closeable: boolean

  constructor() {
    super();
    this.content = this.querySelector("[data-js=content]")!;
    this.body = this.querySelector("[data-js=body]")!;
    this.titleElement = this.querySelector("[data-js=title]")!;
    this.dialog = this.querySelector("[data-js=dialog]")!;
    this.closeBtn = this.querySelector("[data-js=close]");
    this.alerts = this.querySelector(`#${this.id}-alerts`)!;
    this.closeable = this.dataset["closeable"] === "true"
  }

  connectedCallback() {
    this.dialog.addEventListener("click", this.outsideClickHandler);
    this.dialog.addEventListener("keydown", this.keyDownHandler);
    this.closeBtn?.addEventListener("click", this.close);
  }

  disconnectedCallback() {
    this.dialog.removeEventListener("click", this.outsideClickHandler);
    this.dialog.removeEventListener("keydown", this.keyDownHandler);
    this.closeBtn?.removeEventListener("click", this.close);
  }

  private keyDownHandler = (event: KeyboardEvent) => {
    if ((!this.closeable) && (event.key === "Escape")) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  /** Closes the modal when the user clicks the `<dialog>` backdrop. */
  private outsideClickHandler = (event: PointerEvent) => {
    if (!this.closeable) return
    if (event.target === this.dialog) {
      this.close();
    }
  };

  /**
   * Sets the modal's body content.
   *
   * @param content - HTML string to inject into the modal body.
   */
  setContent = (content: string) => {
    this.body.innerHTML = content;
  };

  /**
   * Sets the modal's title heading.
   *
   * @param title - Title.
   */
  setTitle = (title: string) => {
    this.titleElement.textContent = title;
  };

  pushAlert = (alert: Alert) => {
    this.alerts.push(alert)
  }

  open = () => {
    this.dialog.showModal();
    this.content.scrollTo({ top: 0 })
  };

  close = () => {
    this.dialog.close();
  };

  toggle = (open: boolean) => {
    if (open) {
      this.open();
    } else {
      this.close();
    }
  };
}