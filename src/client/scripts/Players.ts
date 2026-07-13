import type { PlayerBoard } from "../../types/Board"

import { playersIcon } from "../../helpers/game"
import type { Player } from "../../types/Player"

const animationOptions: KeyframeAnimationOptions = {
  duration: 1000,
  easing: "ease-in-out",
  fill: "forwards",
}

export class Players {
  private icon: HTMLElement
  private wrapper: HTMLElement
  private audio = { hurt: new Audio("/sounds/hurt.mp3"), success: new Audio("/sounds/success.mp3") }

  constructor() {
    this.wrapper = document.createElement("span")
    this.wrapper.classList.add("players", "players--barco")
    this.icon = document.createElement("span")
    this.icon.classList.add("players-icon")
    this.icon.textContent = playersIcon
    this.wrapper.appendChild(this.icon)
  }

  update = async (cards: HTMLElement[][], board: PlayerBoard, previousBoard?: PlayerBoard) => {
    const { turn, playersPos: { column, row } } = board

    // Figure out if the player turn has changed
    const hasTurnChanged = previousBoard && previousBoard.turn !== board.turn

    // Save current position for animating movement
    const first = this.wrapper.getBoundingClientRect()
    // Move players
    cards[row][column].parentElement?.appendChild(this.wrapper)

    // Figure out movement animation
    let hasMoved = false
    let wasHit = false
    let deltaX = 0
    let deltaY = 0
    if (previousBoard) {
      const last = this.wrapper.getBoundingClientRect()
      if (first && last) {
        deltaX = first.right - last.right
        deltaY = first.top - last.top
        hasMoved = (deltaX !== 0 || deltaY !== 0)
      }
      // Figure out hit animation
      wasHit = (previousBoard.shrimpCount > board.shrimpCount)
    }

    // Animate
    if (hasTurnChanged) this.animateTurnChange(turn)
    if (hasMoved) await this.animateMove(deltaX, deltaY)
    if (wasHit) this.animateHit()
    if (previousBoard && previousBoard.freedCount < board.freedCount) {
      this.audio.success.play()
    }
  }

  private animateHit = async () => {
    const frames = [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }]
    this.audio.hurt.play()
    return await this.animate(this.wrapper, frames, { duration: 150, iterations: 4, easing: "ease-in-out" })
  }

  private animateMove = async (deltaX: number, deltaY: number) => {
    const frames = [
      { translate: `${deltaX}px ${deltaY}px` },
      { translate: "0 0" },
    ]
    return await this.animate(this.wrapper, frames, animationOptions)
  }

  private animateTurnChange = async (turn: Player) => {
    const frames = [
      { rotate: "0deg", backgroundColor: "var(--color-sol)" },
      { rotate: "90deg", backgroundColor: "var(--color-barco)" },
    ]
    if (turn === "sol") frames.reverse()
    return await this.animate(this.wrapper, frames, animationOptions).finally(() => {
      this.wrapper.classList.remove("players--barco", "players--sol")
      this.wrapper.classList.add(`players--${turn}`)
    })
  }

  private animate = async (element: Element, frames: Keyframe[], options?: KeyframeAnimationOptions) => {
    if (!frames.length) return Promise.resolve(false)
    return element.animate(frames, options).finished.then(() => true).catch(() => false)
  }
}