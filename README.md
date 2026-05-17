# Boombust

Boombust is a React/Vite client with a Koa + boardgame.io server. The server serves the built client from `client/dist` and exposes the room API plus multiplayer game runtime.

## Requirements

- Node.js 20+
- pnpm 10+
- PM2 for production process management

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Client: `http://127.0.0.1:5174`  
Server: `http://localhost:3001`

## Build

```bash
pnpm build
```

## Production With PM2

```bash
pnpm install --frozen-lockfile
pnpm build
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
```

## Project Layout

- `client/` React/Vite UI
- `server/` Koa + boardgame.io server and room API
- `packages/game-core/` shared deterministic game domain
- `packages/multiplayer/` boardgame.io adapter

> Let's play Boombust!
