// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import type { Plugin } from 'vite';

import { WebSocketServer } from 'ws';

import { defaultLocale, locales } from './src/client/i18n/config';
import { handleConnection } from './src/server/wsServer';

function gameWebSocketPlugin(): Plugin {
  return {
    name: "game-ws-dev-server",
    apply: "serve", // dev only
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true })

      wss.on("connection", handleConnection)

      server.httpServer?.on("upgrade", (req, socket, head) => {
        if (req.url === "/ws") {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req)
          })
        }
      })
      console.log("Game WS dev server attached at /ws")
    },
  }
}

// https://astro.build/config
export default defineConfig({
  site: "https://crabe.ares.uy",
  srcDir: "./src/client",
  outDir: "./dist/client",
  redirects: {
    "/": `/${defaultLocale}`
  },
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    }
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Caveat",
      cssVariable: "--font-caveat",
    },
    {
      provider: fontProviders.google(),
      name: "Fuzzy Bubbles",
      cssVariable: "--font-fuzzy-bubbles",
      weights: ["400"],
    },
  ],
  vite: {
    plugins: [gameWebSocketPlugin()],
  }
});
