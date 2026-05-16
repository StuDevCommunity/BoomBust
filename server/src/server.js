import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { Server } = require('boardgame.io/server');
import cors from '@koa/cors';
import { koaBody } from 'koa-body';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { BoombustGame } from '@boombust/multiplayer/boardgameio';
import { InMemoryRoomStore } from './rooms/InMemoryRoomStore.js';
import { registerRoomRoutes } from './rooms/roomRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicOrigin = process.env.PUBLIC_ORIGIN || process.env.CLIENT_ORIGIN || 'https://boombust.studev.id.vn';
const envOrigins = (process.env.CORS_ORIGINS || '')
	.split(',')
	.map((entry) => entry.trim())
	.filter(Boolean);
const allowedOrigins = [
	'http://localhost:5174',
	publicOrigin,
	'https://boombust.studev.id.vn',
	'https://boombust.vercel.app',
	...envOrigins,
];

const server = Server({
	games: [BoombustGame],
	origins: allowedOrigins,
});

server.app.use(async (ctx, next) => {
	const origin = ctx.get('Origin');
	if (origin && !allowedOrigins.includes(origin)) {
		ctx.status = 403;
		ctx.body = { success: false, message: 'Origin not allowed' };
		return;
	}
	await next();
});

// Use CORS middleware for the custom API routes
server.app.use(cors({
	origin: (ctx) => {
		const origin = ctx.get('Origin');
		if (!origin) return '';
		return allowedOrigins.includes(origin) ? origin : '';
	},
	credentials: true,
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Use koa-body to parse request bodies for custom API routes
server.app.use(koaBody({
	jsonLimit: '16kb',
	formLimit: '16kb',
	textLimit: '16kb',
}));

const PORT = process.env.PORT || 3001;
const roomStore = new InMemoryRoomStore();
registerRoomRoutes(server.router, roomStore);

const clientDistPath = path.join(__dirname, '../../client/dist');
server.app.use(serve(clientDistPath));

// Fallback for SPA routing - serve index.html for non-API routes
server.app.use(async (ctx, next) => {
	if (!ctx.url.startsWith('/api') && !ctx.url.startsWith('/games') && !ctx.url.includes('.')) {
		try {
			ctx.type = 'html';
			ctx.body = fs.createReadStream(path.join(clientDistPath, 'index.html'));
		} catch (err) {
			console.error('Error serving index.html fallback:', err);
			await next();
		}
	} else {
		await next();
	}
});

server.run(PORT, () => {
	console.log(`Boardgame.io Server (with custom API) is running on http://localhost:${PORT}`);
});
