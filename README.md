# [Crabe](https://crabe.ares.uy)

A fun two-player cooperative online web game inspired by the board game "La Marche Du Crabe".

## Architecture

Built with [Astro](https://astro.build), native [WebComponents](https://developer.mozilla.org/en-US/docs/Web/API/Web_components), and a [WebSocket](https://websockets.spec.whatwg.org/) server responsible for room management, game state synchronization, and player communication.

## System dependencies

- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io)

## Getting Started

1. Install dependencies `pnpm i`.
2. Run the development server + the WebSocket game server `pnpm dev`.
3. Open [http://localhost:4321](http://localhost:4321) on your browser.

## Production

This project consists of:

- A static Astro client
- A Node.js WebSocket server

Build both applications:

Create a copy of `.env.development` and name it `.env.production` replacing variable values where needed.

- pnpm build
- pnpm ws-build

Then:

- Serve the generated static client at `dist/client`
- Run the WebSocket server with: `pnpm ws-start`

## Commands

The following commands are available once you install Node.js & pnpm:

- `pnpm dev` - Runs the development server.
- `pnpm build` - Builds the project for production.
- `pnpm preview` - Previews the production build.
- `pnpm astro` - Run Astro commands.
- `pnpm ws-build` - Builds the WebSocket server.
- `pnpm ws-start` - Runs the WebSocket server.
