# [Crabe](https://crabe.ares.uy)

A fun two-player cooperative web game inspired by the board game "La Marche Du Crabe".

## Architecture

The game consists of: 
- A [Next.js](https://nextjs.org/) web app that renders the frontend.
- A [Websocket](https://websockets.spec.whatwg.org/) server that manages room creation for game sessions, game progress and player communications.

## Top level dependencies

- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io)

## Getting Started

1. Install dependencies `pnpm i`.
2. Run the Websocket server `pnpm ws-start` so that players can communicate with each other within a room.
3. Run the development server `pnpm dev`.
4. Open [http://localhost:3000](http://localhost:3000) with your browser to open the game.

## Commands

The following commands are available once you install [Node.js](https://nodejs.org) & [pnpm](https://pnpm.io):

- `pnpm i`        - Installs the project's dependencies.
- `pnpm dev`      - Runs the development server.
- `pnpm build`    - Builds the project for production.
- `pnpm compile`  - Checks if the project can be compiled correctly.
- `pnpm lint`     - Checks for linter errors.
- `pnpm ws-build` - Builds the Websocket server.
- `pnpm ws-start` - Runs the Websocket server.