/**
 * Custom element that manages a simple dropdown.
 *
 * Emits `crabe:dropdown` events when its state changes between open and closed.
 *
 * @fires crabe:dropdown - Updates the open state when a the dropdown opens/closes on its own.
 */
export class Dropdown extends HTMLElement {
  disconnectedCallback() {
    document.removeEventListener("click", this.outsideClickHandler);
    document.removeEventListener("keydown", this.keydownHandler);
  }

  /** Closes the dropdown when the user clicks outside of it */
  private outsideClickHandler = (event: PointerEvent) => {
    const target = event.target as HTMLElement;
    const clickOnMenuBtn = document
      .querySelector(`[aria-controls="${this.id}"]`)
      ?.contains(target);
    if (!this.contains(target) && !clickOnMenuBtn) {
      this.close();
    }
  };

  private keydownHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") this.close()
  }

  open = () => {
    this.classList.add("show");
    this.ariaHidden = "false";
    document.addEventListener("click", this.outsideClickHandler);
    document.addEventListener("keydown", this.keydownHandler);
    window.Crabe.emitEvent(this, "crabe:dropdown", { open: true })
  }

  close = () => {
    this.classList.remove("show");
    this.ariaHidden = "true";
    document.removeEventListener("click", this.outsideClickHandler);
    document.removeEventListener("keydown", this.keydownHandler);
    window.Crabe.emitEvent(this, "crabe:dropdown", { open: false })
  }
}