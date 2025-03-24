"use client"

import { startTransition, useCallback, useEffect, useRef, useState } from "react"

import { useTranslations } from "next-intl"

import useWebSocket from "react-use-websocket"

import { useRouter } from "@/i18n/routing"

import { type PlayerBoard } from "@/types/Board"

import { wsOptions, wsURL } from "@/helpers/websockets"

import { useLoaderContext } from "@/context/Loader"
import { useAlertsContext } from "@/context/Alerts"

import { type Response } from "@/wsServer"

import Modal from "./Modal"
import GameHeader from "./GameHeader"
import BoardComponent from "./Board"
import Button from "./Button"
import AlertComponent from "./Alert"

interface GameComponentProps { code: string }

export default function GameComponent({ code }: GameComponentProps) {
  const t = useTranslations()
  const router = useRouter()
  const didUnmount = useRef(false)
  const { setLoading } = useLoaderContext()
  const { pushAlert } = useAlertsContext()
  const [shouldConnect, setShouldConnect] = useState(true)
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(wsURL, wsOptions({ shouldReconnect: () => didUnmount.current === false, onOpen: () => handleReconnect(), onClose: () => handleClose() }), shouldConnect)
  const [board, setBoard] = useState<PlayerBoard>()
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false)
  const [waitForPlayer, setWaitForPlayer] = useState(true)

  const restartGame = useCallback(() => sendJsonMessage({ action: "restart" }), [sendJsonMessage])

  const drawEnemy = useCallback(() => sendJsonMessage({ action: "draw" }), [sendJsonMessage])

  const placeEnemy = useCallback((row: number, column: number) => sendJsonMessage({ action: "place", row, column }), [sendJsonMessage])

  const movePlayer = useCallback((row: number, column: number) => sendJsonMessage({ action: "move", row, column }), [sendJsonMessage])

  useEffect(() => {
    setLoading(true)
    didUnmount.current = false
    return () => { didUnmount.current = true }
  }, [setLoading])

  useEffect(() => {
    if (!lastJsonMessage) return
    const msg = lastJsonMessage as Response
    if ((msg.type === "join") || (msg.type === "update")) {
      setBoard(msg.board)
      if ((!msg.board.new) && (msg.board.connectedPlayers < 2)) {
        setLoading(true, t("Messages.player-disconnected"))
      } else {
        setLoading(false)
      }
      setWaitForPlayer(msg.board.new ?? false)
    } else if (msg.type === "start") {
      setWaitForPlayer(false)
    } else if (msg.type === "error") {
      console.error(msg.text)
      if (msg.code === 500) {
        pushAlert("danger", t("Messages.error"))
      } else {
        if (msg.code === 404) {
          pushAlert("danger", t("Messages.game-not-found"))
        } else if (msg.code === 409) {
          pushAlert("danger", t("Messages.game-full"))
        }
        startTransition(() => router.push("/"))
      }
    }
  }, [lastJsonMessage, router, pushAlert, setLoading, t])

  // Join the room if the board hasn't been setup yet
  useEffect(() => { if (!board) sendJsonMessage({ action: "join", code }) }, [code, sendJsonMessage, board])

  // shouldConnect to false on ws close
  function handleClose() {
    if (didUnmount.current) return
    setLoading(true, t("Messages.connection-lost"))
    setShouldConnect(false)
  }

  // Try to reconnect the ws every 1 second
  useEffect(() => { if (!shouldConnect) setTimeout(() => setShouldConnect(true), 1000) }, [shouldConnect])

  // On reconnect re-join the room
  const handleReconnect = useCallback(() => {
    setLoading(false)
    sendJsonMessage({ action: "join", code })
  }, [code, sendJsonMessage, setLoading])

  // TODO: Re-enable this
  const handleShare = useCallback(async () => {
    if (navigator?.share) {
      await navigator.share({ title: 'Join my game!', text: '', url: window.location.href })
    } else {
      await navigator?.clipboard?.writeText(window.location.href)
      setShowCopyConfirmation(true)
      setTimeout(() => setShowCopyConfirmation(false), 3000)
    }
  }, [])

  if (!board) return null

  return (
    <>
      <GameHeader board={board} />
      <BoardComponent board={board} onDrawCard={drawEnemy} onGameRestart={restartGame} onMovePlayers={movePlayer} onPlaceEnemy={placeEnemy} />
      <Modal id="share-modal" labelledBy="share-modal-title" open={waitForPlayer} closeable={false}>
        <h2 id="share-modal-title" style={{ textAlign: "center" }}>
          {t("Messages.share")}
        </h2>
        <div className="share__btn-wrapper">
          <Button onClick={handleShare}>
            {t("Labels.share")}
          </Button>
          <Button href="/">
            {t("Labels.cancel")}
          </Button>
        </div>
        {showCopyConfirmation && (
          <AlertComponent type="info" removeAlert={() => setShowCopyConfirmation(false)}>
            {t("Messages.copied-to-clipboard")}
          </AlertComponent>
        )}
      </Modal>
    </>
  )
}