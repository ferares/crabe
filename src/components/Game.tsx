"use client"

import { startTransition, useCallback, useEffect, useRef, useState } from "react"

import { useTranslations } from "next-intl"

import useWebSocket from "react-use-websocket"

import { useRouter } from "@/i18n/routing"

import { type PlayerBoard } from "@/types/Board"

import { wsURL } from "@/helpers/websockets"

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

  const [board, setBoard] = useState<PlayerBoard>()
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false)
  const [waitForPlayer, setWaitForPlayer] = useState(true)

  // Handle WebSocket messages with a callback that's passed to the hook
  const handleMessage = useCallback((message: Response) => {
    if ((message.type === "join") || (message.type === "update")) {
      setBoard(message.board)
      if ((!message.board.new) && (message.board.connectedPlayers < 2)) {
        setLoading(true, t("Messages.player-disconnected"))
      } else {
        setLoading(false)
      }
      setWaitForPlayer(message.board.new ?? false)
    } else if (message.type === "start") {
      setWaitForPlayer(false)
    } else if (message.type === "error") {
      console.error(message.text)
      if (message.code === 500) {
        pushAlert("danger", t("Messages.error"))
      } else {
        if (message.code === 404) {
          pushAlert("danger", t("Messages.game-not-found"))
        } else if (message.code === 409) {
          pushAlert("danger", t("Messages.game-full"))
        }
        startTransition(() => router.push("/"))
      }
    }
  }, [router, pushAlert, setLoading, t])

  // shouldConnect to false on ws close
  const handleClose = useCallback(() => {
    if (didUnmount.current) return
    setLoading(true, t("Messages.connection-lost"))
    setShouldConnect(false)
  }, [setLoading, t])

  const { sendJsonMessage } = useWebSocket(
    wsURL,
    {
      shouldReconnect: () => !didUnmount.current,
      onOpen: () => {
        setLoading(false)
        sendJsonMessage({ action: "join", code })
      },
      onClose: handleClose,
      onMessage: (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string) as Response
          handleMessage(message)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }
    },
    shouldConnect
  )

  const restartGame = useCallback(() => sendJsonMessage({ action: "restart" }), [sendJsonMessage])

  const drawEnemy = useCallback(() => sendJsonMessage({ action: "draw" }), [sendJsonMessage])

  const placeEnemy = useCallback((row: number, column: number) => sendJsonMessage({ action: "place", row, column }), [sendJsonMessage])

  const movePlayer = useCallback((row: number, column: number) => sendJsonMessage({ action: "move", row, column }), [sendJsonMessage])

  useEffect(() => {
    setLoading(true)
    didUnmount.current = false
    return () => { didUnmount.current = true }
  }, [setLoading])

  // Join the room if the board hasn't been setup yet
  useEffect(() => { if (!board) sendJsonMessage({ action: "join", code }) }, [code, sendJsonMessage, board])

  // Try to reconnect the ws every 1 second
  useEffect(() => { if (!shouldConnect) setTimeout(() => setShouldConnect(true), 1000) }, [shouldConnect])

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