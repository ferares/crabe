export type CrabeLoadingEvent = CustomEvent<{ loading: boolean, message?: string }>
export type CrabeDropdownEvent = CustomEvent<{ open: boolean }>
export type CrabeGameDrawEvent = CustomEvent<void>
export type CrabeGameRestartEvent = CustomEvent<void>
export type CrabeGameMoveEvent = CustomEvent<{ row: number, column: number }>
export type CrabeGameEnemyEvent = CustomEvent<{ row: number, column: number }>

export type CrabeEventMap = {
  "crabe:loading": CrabeLoadingEvent
  "crabe:dropdown": CrabeDropdownEvent
  "crabe:game:draw": CrabeGameDrawEvent
  "crabe:game:restart": CrabeGameRestartEvent
  "crabe:game:move": CrabeGameMoveEvent
  "crabe:game:enemy": CrabeGameEnemyEvent
}