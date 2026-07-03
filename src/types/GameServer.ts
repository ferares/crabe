import type { PlayerBoard } from "./Board"

type Action = "create" | "join" | "draw" | "place" | "move" | "restart" | "ping"
export type Message = { action: Action, code?: string, row?: number, column?: number }
export type Response = { type: "create", code: string } | { type: "join" | "update", board: PlayerBoard } | { type: "error", code: number, text: string } | { type: "start" } | { type: "pong" }