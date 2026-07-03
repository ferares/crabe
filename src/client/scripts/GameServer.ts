import type { Message, Response } from "../../types/GameServer"

const PUBLIC_WS_URL = import.meta.env.PUBLIC_WS_URL

export class GameServer {
  private static ws: WebSocket | undefined
  private static closed = false
  private static connecting = false
  private static pendingMessages: Message[] = []
  private static subscriptors: ((response: Response) => void)[] = []

  static sendMessage = (message: Message) => {
    if (GameServer.ws?.readyState === WebSocket.OPEN) {
      GameServer.ws.send(JSON.stringify(message))
    } else if (GameServer.ws?.readyState === WebSocket.CONNECTING) {
      GameServer.ws.addEventListener("open", () => GameServer.sendMessage(message), { once: true })
    } else {
      GameServer.closed = false
      GameServer.connect({ message })
    }
  }

  static subscribe = (callback: (response: Response) => void) => {
    GameServer.subscriptors.push(callback)
  }

  static unsubscribe = (callback: (response: Response) => void) => {
    const index = GameServer.subscriptors.indexOf(callback)
    if (index < 0) return
    GameServer.subscriptors.splice(index, 1)
  }

  static close = () => {
    GameServer.closed = true
    GameServer.ws?.removeEventListener("close", GameServer.handleReconnect)
    GameServer.ws?.removeEventListener("message", GameServer.handleMessage)
    GameServer.ws?.removeEventListener("error", GameServer.handleError)
    GameServer.ws?.close()
  }

  private static handleError = (event: Event) => {
    console.error("WebSocket error", event)
  }

  private static handleReconnect = () => {
    GameServer.connect({ delay: 1000 })
  }

  private static connect = ({ delay = 0, message }: { delay?: number, message?: Message }) => {
    if (message) GameServer.pendingMessages.push(message)
    if (GameServer.connecting) return
    GameServer.connecting = true

    setTimeout(() => {
      if (GameServer.closed) {
        GameServer.connecting = false
        GameServer.pendingMessages = []
        return
      }
      GameServer.ws = new WebSocket(PUBLIC_WS_URL)
      GameServer.ws.addEventListener("open", () => {
        const messages = GameServer.pendingMessages
        GameServer.pendingMessages = []
        GameServer.connecting = false
        messages.forEach(GameServer.sendMessage)
      }, { once: true })
      GameServer.ws.addEventListener("close", GameServer.handleReconnect)
      GameServer.ws.addEventListener("message", GameServer.handleMessage)
      GameServer.ws.addEventListener("error", GameServer.handleError)
    }, delay)
  }

  private static handleMessage = (event: MessageEvent) => {
    try {
      const response = JSON.parse(event.data)
      GameServer.subscriptors.forEach(callback => callback(response))
    } catch (error) {
      console.error("error parsing WebSocket message", error)
    }
  }
}