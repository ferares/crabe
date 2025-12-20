"use client"

import { startTransition, useCallback, useEffect, useRef, useState } from "react"

import { useTranslations } from "next-intl"

import useWebSocket from "react-use-websocket"

import { useRouter } from "@/i18n/routing"

import { wsURL } from "@/helpers/websockets"

import { useLoaderContext } from "@/context/Loader"
import { useAlertsContext } from "@/context/Alerts"

import { type Response } from "@/wsServer"

import Button from "./Button"

export default function NewGameBtn() {
  const t = useTranslations()
  const router = useRouter()
  const { setLoading } = useLoaderContext()
  const { pushAlert } = useAlertsContext()
  const didUnmount = useRef(false)
  const [shouldConnect, setShouldConnect] = useState(true)

  const handleOpen = useCallback(() => setLoading(false), [setLoading])

  // shouldConnect to false on ws close
  const handleClose = useCallback(() => {
    if (didUnmount.current) return
    setLoading(true, t("Messages.connection-lost"))
    setShouldConnect(false)
  }, [setLoading, setShouldConnect, t])

  const { lastJsonMessage, sendJsonMessage } = useWebSocket(
    wsURL,
    {
      shouldReconnect: () => !didUnmount.current,
      onClose: handleClose,
      onOpen: handleOpen
    },
    shouldConnect
  )

  useEffect(() => {
    didUnmount.current = false
    return () => { didUnmount.current = true }
  }, [])

  useEffect(() => {
    if (!lastJsonMessage) return
    const msg = lastJsonMessage as Response
    if (msg.type === "create") {
      setLoading(true)
      startTransition(() => {
        router.push({ pathname: `/${msg.code}` })
        setLoading(false)
      })
    } else if (msg.type === "error") {
      pushAlert("danger", t("Messages.error-new-game"))
      console.error(msg.text)
    }
  }, [lastJsonMessage, router, setLoading, pushAlert, t])

  // Try to reconnect the ws every 1 second
  useEffect(() => { if (!shouldConnect) setTimeout(() => setShouldConnect(true), 1000) }, [shouldConnect])

  const newGame = useCallback(() => sendJsonMessage({ action: "create" }), [sendJsonMessage])

  return (
    <Button onClick={newGame}>
      {t("Messages.new-game")}
    </Button>
  )
}