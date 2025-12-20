"use client"

import { useCallback } from "react"

import { useTranslations } from "next-intl"

import { type PlayerBoard } from "@/types/Board"

import { enemyIcons } from "@/helpers/game"

import ObjectComponent from "./Object"
import CardComponent from "./Card"
import EnemyComponent from "./Enemy"

interface BoardComponentProps {
  board: PlayerBoard,
  onGameRestart: () => void,
  onDrawCard: () => void,
  onPlaceEnemy: (row: number, column: number) => void,
  onMovePlayers: (row: number, column: number) => void,
}

export default function BoardComponent({ board, onGameRestart, onDrawCard, onPlaceEnemy, onMovePlayers }: BoardComponentProps) {
  const t = useTranslations()

  const activeRowRef = useCallback((node: HTMLElement | null) => {
    node?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
  }, [])

  const { cards, character, forbiddenObjects, gameState, playersPos, turn, currentEnemy } = board

  return (
    <div className="board-wrapper">
      <ol className="objects">
        {forbiddenObjects.map((position, index) => {
          const card = cards[position.row][position.column]
          return (
            <li key={`object-${index}`} title={t("Messages.object-enemy")}>
              <span className={`card btn card--enemy-${card.object?.enemy?.player} card--disabled`}>
                {card.object && <ObjectComponent object={card.object} />}
              </span>
            </li>
          )
        })}
      </ol>
      <ol className={`board board--${gameState} ${["place", "move"].includes(gameState) && turn === character ? "board--active" : ""}`}>
        {cards.map((row, rowIndex) => {
          return row.map((card, cardIndex) => {
            let onClickHandler = undefined
            if (turn === character) {
              if ((currentEnemy?.row === rowIndex) && (!card.object) && (!card.enemy)) {
                onClickHandler = () => onPlaceEnemy(rowIndex, cardIndex)
              } else if (gameState === "move") {
                if (turn === "barco") {
                  if ((playersPos.column === cardIndex)) onClickHandler = () => onMovePlayers(rowIndex, cardIndex)
                } else {
                  if ((playersPos.row === rowIndex)) onClickHandler = () => onMovePlayers(rowIndex, cardIndex)
                }
              }
            }
            let isActiveRow = false
            if ((currentEnemy?.row === rowIndex) && (!card.object) && (!card.enemy)) {
              isActiveRow = true
            } else if (gameState === "move") {
              if (turn === "barco") {
                isActiveRow = ((playersPos.column === cardIndex))
              } else {
                isActiveRow = ((playersPos.row === rowIndex))
              }
            }
            return (
              <li ref={isActiveRow ? activeRowRef : null} key={`${rowIndex}-${cardIndex}`}>
                <CardComponent isActive={isActiveRow} card={card} cardPosition={{ column: cardIndex, row: rowIndex }} onClick={onClickHandler} playersPos={playersPos} turn={turn} />
              </li>
            )
          })
        })}
      </ol>
      <ol className={`enemy-rows ${currentEnemy?.row === 5 ? "enemy-rows--top" : ""}`}>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <li key={row}>
            {currentEnemy?.row === row && (
              <span className={`card btn btn--enemy card--enemy-${currentEnemy.player} card--disabled`} title={t("Messages.place-enemy")}>
                <EnemyComponent enemy={currentEnemy} />
              </span>
            )}
          </li>
        ))}
        {(gameState === "draw") && (turn === character) && (
          <li>
            <button type="button" className="card card--draw" title={t("Messages.draw-card")} onClick={onDrawCard}>
              <span>
                {enemyIcons.lobster}
              </span>
              <span>
                {enemyIcons.octopus}
              </span>
            </button>
          </li>
        )}
      </ol>
      {((gameState === "lost") || (gameState === "win")) && (
        <div className="game-actions">
          {(gameState === "lost") && (
            <div className="new-game">
              <button type="button" className="btn" onClick={onGameRestart}>
                {t("Messages.game-lose")}
              </button>
            </div>
          )}
          {(gameState === "win") && (
            <div className="new-game">
              <button type="button" className="btn" onClick={onGameRestart}>
                {t("Messages.game-win")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}