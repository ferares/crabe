import type { CrabeDropdownEvent } from "../../../types/Events.ts";

import { locales } from "../../i18n/config.ts";
import { getLocalizedPath, getRouteKeyFromPath } from "../../i18n/utils.ts";

import type { Dropdown } from "../Dropdown/Dropdown.ts";

/**
 * Custom element that manages a language selection dropdown.
 *
 * Toggles an `crabe-dropdown` open/closed via a button, and navigates
 * to the selected locale's root path when a locale option is chosen.
 * Listens for `crabe:dropdown` events on its dropdown to keep its open state in sync.
 *
 * @listens crabe:dropdown - Updates the open state when a the dropdown opens/closes on its own.
 */
export class LangMenu extends HTMLElement {
  private isOpen = false;
  private dropdown: Dropdown;
  private toggler: HTMLButtonElement;
  private localeButtons: NodeListOf<HTMLButtonElement>;
  private initialized = false;

  constructor() {
    super();
    this.dropdown = this.querySelector("crabe-dropdown")!;
    this.toggler = this.querySelector("[data-js=toggler]")!;
    this.localeButtons = this.querySelectorAll("[data-locale]");
  }

  connectedCallback() {
    this.dropdown.addEventListener("crabe:dropdown", this.dropdownEventHandler)
    this.toggler.addEventListener("click", this.toggleClickHandler);
    if (!this.initialized) {
      this.localeButtons.forEach((optionBtn) => {
        optionBtn.addEventListener("click", () => {
          const { locale } = optionBtn.dataset
          const currentPageKey = getRouteKeyFromPath(location.pathname);
          const targetUrl = new URL(getLocalizedPath(currentPageKey, locale), window.location.origin)
          targetUrl.search = window.location.search
          window.location.href = targetUrl.toString()
        });
      });
      this.initialized = true;
    }
  }

  disconnectedCallback() {
    this.dropdown.removeEventListener("crabe:dropdown", this.dropdownEventHandler)
    this.toggler.removeEventListener("click", this.toggleClickHandler);
  }

  /** Sync the open or closed state whenever the dropdown changes on its own. */
  private dropdownEventHandler = (event: CrabeDropdownEvent) => {
    if (event.detail.open !== this.isOpen) this.toggleClickHandler()
  }

  /** Toggles the dropdown open or closed on each button click. */
  private toggleClickHandler = () => {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.dropdown.open();
      this.toggler.classList.add("open");
      this.toggler.ariaExpanded = "true";
    } else {
      this.dropdown.close();
      this.toggler.classList.remove("open");
      this.toggler.ariaExpanded = "false";
    }
  };
}