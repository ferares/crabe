import type { PlayerBoard } from "./Board"
import type { Enemy } from "./Enemy"

type Action = "create" | "join" | "draw" | "place" | "move" | "restart" | "ping"

// This is used to inform of what actually changed so animations are easier to implement for the client
export type Update = { type: "move", row: number, column: number } | { type: "place", row: number, column: number, enemy?: Enemy } | { type: "status" }

export type Message = { action: Action, code?: string, row?: number, column?: number }

export type Response = { type: "create", code: string } | { type: "join" | "update", board: PlayerBoard, update: Update } | { type: "error", code: number, text: string } | { type: "start" } | { type: "pong" }