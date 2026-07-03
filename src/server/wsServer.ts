import { type RawData, type WebSocket } from "ws"

import { type Board } from "../types/Board"
import { type Player } from "../types/Player"
import type { Message, Response } from "../types/GameServer"

import { generateCode } from "../helpers/strings"
import { drawEnemy, generateBoard, getPlayerBoardData, movePlayer, placeEnemy } from "../helpers/game"

type Room = { code: string, board: Board, players: Map<Player, WebSocket>, new: boolean, timeout?: NodeJS.Timeout }

const rooms: Record<string, Room> = {}

function decodeMessage(data: RawData): Message {
  return JSON.parse(String(data)) as Message
}

function sendMessage(ws: WebSocket, msg: Response) {
  if (!ws.OPEN) {
    ws.addEventListener("open", () => sendMessage(ws, msg), { once: true })
  } else {
    ws.send(JSON.stringify(msg))
  }
}

function getPlayerRoom(ws: WebSocket) {
  for (const [, room] of Object.entries(rooms)) {
    if ((room.players.get("barco") === ws) || (room.players.get("sol") === ws)) return room
  }
  return
}

function getPlayerChar(ws: WebSocket, room: Room): Player | undefined {
  if (room.players.get("barco") === ws) return "barco"
  if (room.players.get("sol") === ws) return "sol"
}

function isPlayerTurn(player: WebSocket, room: Room) {
  const playerChar = getPlayerChar(player, room)
  return room.board.turn === playerChar
}

function createRoom() {
  let code = generateCode(10)
  while (rooms[code]) code = generateCode(10)
  const board = generateBoard()
  if (!board) return
  const room: Room = { code, board, players: new Map(), new: true }
  // Delete the room if room stays empty after timeout
  room.timeout = setTimeout(() => delete (rooms[code]), 60000)
  rooms[code] = room
  return code
}

function restartRoom(room: Room) {
  const board = generateBoard()
  if (!board) return false
  room.board = board
  return true
}

function addPlayer(room: Room, ws: WebSocket) {
  // Stop the room timeout delete (if any)
  clearTimeout(room.timeout)
  if (room.players.size >= 2) return
  if (room.players.has("barco")) room.players.set("sol", ws)
  else room.players.set("barco", ws)
  if (room.players.size >= 2) room.new = false
  return room.board
}

function leaveRoom(ws: WebSocket) {
  const room = getPlayerRoom(ws)
  if (!room) return
  const character = getPlayerChar(ws, room)
  if (!character) return
  room.players.delete(character)
  // If room becomes empty delete after timeout
  if (room.players.size === 0) {
    room.timeout = setTimeout(() => delete (rooms[room.code]), 60000)
  } else {
    // Notify the other player that their partner has left
    broadCastBoardUpdate(room)
  }
}

function broadCastBoardUpdate(room: Room) {
  room.players.forEach((ws) => {
    const character = getPlayerChar(ws, room)
    if (!character) return
    sendMessage(ws, { type: "update", board: getPlayerBoardData(character, room.players.size, room.new, room.board) })
  })
}

function handleConnection(ws: WebSocket) {
  ws.on("error", console.error)

  ws.on("close", () => leaveRoom(ws))

  ws.on("message", function message(data) {
    let msg: Message | undefined
    try {
      msg = decodeMessage(data)
    } catch (error) {
      console.error(error)
      return sendMessage(ws, { type: "error", code: 400, text: "Error parsing message" })
    }
    if (msg.action === "ping") {
      sendMessage(ws, { type: "pong" })
    } else if (msg.action === "create") {
      // Create a new room
      const code = createRoom()
      if (!code) return sendMessage(ws, { type: "error", code: 500, text: "Error creating room" })
      sendMessage(ws, { type: "create", code })
    } else if (msg.action === "restart") {
      const room = getPlayerRoom(ws)
      if (room) {
        if (restartRoom(room)) {
          broadCastBoardUpdate(room)
        } else {
          sendMessage(ws, { type: "error", code: 500, text: "Error resetting room" })
        }
      }
    } else if (msg.action === "join") {
      if (msg.code) {
        const room = rooms[msg.code]
        if (!room) return sendMessage(ws, { type: "error", code: 404, text: "Room not found" })
        // Check if the player is already in this room
        const playerRoom = getPlayerRoom(ws)
        if (playerRoom?.code !== msg.code) {
          // Check if the room is full
          if (room.players.size === 2) {
            sendMessage(ws, { type: "error", code: 409, text: "Room is full" })
          } else {
            // Get the first player in the room (if any)
            const barco = room.players.get("barco")
            // If the player is already in another room leave it
            leaveRoom(ws)
            // Add player to this room
            const board = addPlayer(room, ws)
            if (!board) return sendMessage(ws, { type: "error", code: 500, text: "Error adding player to room" })
            const playerChar = getPlayerChar(ws, room)
            if (!playerChar) return sendMessage(ws, { type: "error", code: 500, text: "Error setting player character" })
            sendMessage(ws, { type: "join", board: getPlayerBoardData(playerChar, room.players.size, room.new, board) })
            // if there was a player already in the room update them so the game can start
            if (barco) sendMessage(barco, { type: "start" })
            // Broadcast the join to all players
            broadCastBoardUpdate(room)
          }
        }
      } else {
        sendMessage(ws, { type: "error", code: 400, text: "Room code not provided" })
      }
    } else if (msg.action === "move") {
      const { row, column } = msg
      const room = getPlayerRoom(ws)
      if ((room) && (row !== undefined) && (column !== undefined)) {
        if (isPlayerTurn(ws, room)) {
          movePlayer(row, column, room.board)
          broadCastBoardUpdate(room)
        }
      }
    } else if (msg.action === "place") {
      const { row, column } = msg
      const room = getPlayerRoom(ws)
      if ((room) && (row !== undefined) && (column !== undefined)) {
        if (isPlayerTurn(ws, room)) {
          placeEnemy(row, column, room.board)
          broadCastBoardUpdate(room)
        }
      }
    } else if (msg.action === "draw") {
      const room = getPlayerRoom(ws)
      if (room) {
        if (isPlayerTurn(ws, room)) {
          drawEnemy(room.board)
          broadCastBoardUpdate(room)
        }
      }
    }
  })
}

export { handleConnection }