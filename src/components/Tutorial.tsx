"use client"

import { type PropsWithChildren, type ReactNode, useCallback, useMemo, useState } from "react"

import { type RichTranslationValues, useTranslations } from "next-intl"

import { useRouter } from "@/i18n/routing"

import { type PlayerBoard } from "@/types/Board"

import { drawEnemy, enemyIcons, getPlayerBoardData, getTutorialBoard, movePlayer, objectRevealedIcon, placeEnemy, playersIcon, shrimpIcon } from "@/helpers/game"

import BoardComponent from "./Board"
import GameHeader from "./GameHeader"
import Modal from "./Modal"
import Button from "./Button"

export default function TutorialComponent() {
  const board = useMemo(() => getTutorialBoard(), [])
  const t = useTranslations()
  const router = useRouter()
  const [tutorialStep, setTutorialStep] = useState(0)
  const [playerBoard, setPlayerBoard] = useState<PlayerBoard>(getPlayerBoardData("barco", 2, false, board))

  // Handle tutorial step transitions that need to manipulate the board
  const advanceToStep = useCallback((nextStep: number) => {
    if (nextStep === 7) {
      drawEnemy(board)
      setPlayerBoard(getPlayerBoardData("barco", 2, false, board))
    } else if (nextStep === 8) {
      placeEnemy(4, 0, board)
      setPlayerBoard(getPlayerBoardData("barco", 2, false, board))
    } else if (nextStep === 9) {
      movePlayer(0, 5, board)
      setPlayerBoard(getPlayerBoardData("barco", 2, false, board))
      // Auto-advance to step 10
      setTutorialStep(10)
      return
    } else if (nextStep === 13) {
      router.push("/")
      return
    }
    setTutorialStep(nextStep)
  }, [board, router])

  function onDrawCard() {
    if (tutorialStep !== 2) return
    drawEnemy(board)
    setPlayerBoard(getPlayerBoardData("barco", 2, false, board))
    advanceToStep(3)
  }

  function onPlaceEnemy(row: number, column: number) {
    if (tutorialStep !== 3) return
    placeEnemy(row, column, board)
    setPlayerBoard(getPlayerBoardData("barco", 2, false, board))
    advanceToStep(4)
  }

  function onMovePlayers(row: number, column: number) {
    if ((tutorialStep !== 5) || (row !== 0) || (column !== 0)) return
    movePlayer(0, 0, board)
    setPlayerBoard(getPlayerBoardData("barco", 2, false, board))
    advanceToStep(6)
  }

  const contiuneBtn = useCallback((label = t("Labels.continue")) => (
    <div className="tutorial-btn-wrapper">
      <Button onClick={() => advanceToStep(tutorialStep + 1)}>
        {label}
      </Button>
    </div>
  ), [t, tutorialStep, advanceToStep])

  const translationOptions: RichTranslationValues = useMemo(() => ({ p: (chunks: ReactNode) => <p>{chunks}</p> }), [])

  return (
    <>
      <GameHeader board={playerBoard} />
      <div className="tutorial-wrapper">
        <div className="tutorial-container">
          <BoardComponent board={playerBoard} onDrawCard={onDrawCard} onGameRestart={() => null} onMovePlayers={onMovePlayers} onPlaceEnemy={onPlaceEnemy} />
          {(tutorialStep < 2 || tutorialStep === 12) && (
            <Modal id="tutorial-modal" labelledBy="tutorial-modal-title" open={true} closeable={false}>
              {tutorialStep === 0 && (
                <div>
                  {t("Pages.Tutorial.t1")}
                  {t.rich("Pages.Tutorial.m1", { objectRevealedIcon, enemyIcon: enemyIcons.octopus, ...translationOptions })}
                </div>
              )}
              {tutorialStep === 1 && (
                <div>
                  {t("Pages.Tutorial.t2")}
                  {t.rich("Pages.Tutorial.m2", translationOptions)}
                </div>
              )}
              {tutorialStep === 12 && (
                <div>
                  {t("Pages.Tutorial.t12")}
                  {t.rich("Pages.Tutorial.m12", translationOptions)}
                </div>
              )}
              {contiuneBtn(tutorialStep === 12 ? t("Labels.finish-tutorial") : undefined)}
            </Modal>
          )}
          {(tutorialStep === 2) && (
            <TutorialCard title={t("Pages.Tutorial.t3")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m3", translationOptions)}
            </TutorialCard>
          )}
          {(tutorialStep === 3) && (
            <TutorialCard title={t("Pages.Tutorial.t4")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m4", translationOptions)}
            </TutorialCard>
          )}
          {(tutorialStep === 4) && (
            <TutorialCard title={t("Pages.Tutorial.t5")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m5", translationOptions)}
              {contiuneBtn()}
            </TutorialCard>
          )}
          {(tutorialStep === 5) && (
            <TutorialCard title={t("Pages.Tutorial.t6")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m6", { objectIcon: board.cards[0][0].object?.icon ?? "", ...translationOptions })}
            </TutorialCard>
          )}
          {(tutorialStep === 6) && (
            <TutorialCard title={t("Pages.Tutorial.t7")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m7", { objectIcon: board.cards[0][0].object?.icon ?? "", shrimpIcon, playersIcon, ...translationOptions })}
              {contiuneBtn()}
            </TutorialCard>
          )}
          {(tutorialStep === 7) && (
            <TutorialCard title={t("Pages.Tutorial.t8")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m8", translationOptions)}
              {contiuneBtn()}
            </TutorialCard>
          )}
          {(tutorialStep === 8) && (
            <TutorialCard title={t("Pages.Tutorial.t9")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m9", translationOptions)}
              {contiuneBtn()}
            </TutorialCard>
          )}
          {(tutorialStep === 10) && (
            <TutorialCard title={t("Pages.Tutorial.t10")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m10", { objectIcon: board.cards[0][5].object?.icon ?? "", objectRevealedIcon, ...translationOptions })}
              {contiuneBtn()}
            </TutorialCard>
          )}
          {(tutorialStep === 11) && (
            <TutorialCard title={t("Pages.Tutorial.t11")} step={tutorialStep}>
              {t.rich("Pages.Tutorial.m11", { shrimpIcon, ...translationOptions })}
              {contiuneBtn()}
            </TutorialCard>
          )}
        </div>
      </div>
    </>
  )
}

interface TutorialCardProps { title: string, step: number }

function TutorialCard({ children, title, step }: PropsWithChildren<TutorialCardProps>) {
  return (
    <div className={`tutorial-card tutorial-card--${step}`} role="dialog">
      <div className="tutorial-card-header">
        <h4 className="tutorial-card-title">
          {title}
        </h4>
      </div>
      <div className="tutorial-card-content">
        {children}
      </div>
    </div>
  )
}