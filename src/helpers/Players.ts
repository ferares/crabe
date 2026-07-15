import type { PlayerBoard } from "../types/Board"
import type { Player } from "../types/Player"

import { animate, playersIcon } from "./game"
import type { Card } from "./Card"

const animationOptions: KeyframeAnimationOptions = {
  duration: 1000,
  easing: "ease-in-out",
  fill: "forwards",
}

export class Players {
  private icon: HTMLElement
  private wrapper: HTMLElement
  private audio = { hurt: new Audio("/sounds/hurt.mp3"), success: new Audio("/sounds/success.mp3") }

  constructor(turn?: Player) {
    this.wrapper = document.createElement("span")
    this.wrapper.classList.add("players")
    this.icon = document.createElement("span")
    this.icon.classList.add("players-icon")
    this.icon.textContent = playersIcon
    this.wrapper.appendChild(this.icon)
    this.updateTurn(turn ?? "barco")
  }

  update = async (cards: Card[][], board: PlayerBoard, previousBoard?: PlayerBoard) => {
    const { turn, playersPos: { column, row } } = board

    // Figure out if the player turn has changed
    const hasTurnChanged = previousBoard && previousBoard.turn !== board.turn

    // Save current position for animating movement
    const first = this.wrapper.getBoundingClientRect()
    // Move players
    cards[row][column].movePlayers(this.wrapper)

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
    if (hasTurnChanged) {
      this.animateTurnChange(turn)
    } else {
      // Update turn independently of if it has changed for consistent state after page reloads
      this.updateTurn(turn)
    }
    if (hasMoved) await this.animateMove(deltaX, deltaY)
    if (wasHit) this.animateHit()
    if (previousBoard && previousBoard.freedCount < board.freedCount) {
      this.audio.success.play()
    }
  }

  private updateTurn = (turn: Player) => {
    this.wrapper.classList.remove("players--barco", "players--sol")
    this.wrapper.classList.add(`players--${turn}`)
  }

  private animateHit = async () => {
    const frames = [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }]
    this.audio.hurt.play()
    return await animate(this.wrapper, frames, { duration: 150, iterations: 4, easing: "ease-in-out" })
  }

  private animateMove = async (deltaX: number, deltaY: number) => {
    const frames = [
      { translate: `${deltaX}px ${deltaY}px` },
      { translate: "0 0" },
    ]
    return await animate(this.wrapper, frames, animationOptions)
  }

  private animateTurnChange = async (turn: Player) => {
    const frames = [
      { rotate: "0deg", backgroundColor: "var(--color-sol)" },
      { rotate: "90deg", backgroundColor: "var(--color-barco)" },
    ]
    if (turn === "sol") frames.reverse()
    return await animate(this.wrapper, frames, animationOptions).finally(() => this.updateTurn(turn))
  }
}