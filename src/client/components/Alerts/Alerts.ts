export type Alert = { type: "info" | "success" | "danger", content: string, timeout?: number }

export type ScreenReaderAlert = { type: "assertive" | "polite", content: string }

export class Alerts extends HTMLElement {
  private alertTemplate: HTMLTemplateElement
  private alerts: Alert[] = []
  private running = false

  constructor() {
    super()
    this.alertTemplate = this.querySelector("[data-js=template]")!
  }

  private show = (alert: Alert) => {
    return new Promise<void>(resolve => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      const alertElement = this.render(alert)
      this.appendChild(alertElement)
      const dismiss = () => {
        clearTimeout(timeoutId)
        alertElement.addEventListener("transitionend", () => {
          alertElement.remove()
          resolve()
        }, { once: true })
        alertElement.classList.add("dismissed")
      }
      alertElement.querySelector<HTMLButtonElement>("[data-js=close]")!
        .addEventListener("click", dismiss, { once: true })
      if (alert.timeout) {
        timeoutId = setTimeout(dismiss, alert.timeout)
      }
    })
  }

  private drain = async () => {
    this.running = true
    while (this.alerts.length > 0) {
      await this.show(this.alerts.shift()!)
    }
    this.running = false
  }

  render = (alert: Alert) => {
    const alertElement = this.alertTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
    alertElement.classList.add(`alert-${alert.type}`)
    alertElement.querySelector("[data-js=content]")!.innerHTML = alert.content
    return alertElement
  }

  push = (alert: Alert) => {
    this.alerts.push(alert)
    if (!this.running) this.drain()
  }
}