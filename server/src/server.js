import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { Server, Origins } = require('boardgame.io/server');
import cors from '@koa/cors';
import { koaBody } from 'koa-body';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { BoombustGame } from '../../client/src/game/BoombustGame.js';
import { generateRoomCode } from './utils/generateCode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicOrigin = process.env.PUBLIC_ORIGIN || process.env.CLIENT_ORIGIN || 'https://boombust.studev.id.vn';

const server = Server({
	games: [BoombustGame],
	origins: [
		Origins.LOCALHOST,
		'http://localhost:5173',
		'http://localhost:5174',
		'http://localhost:5175',
		publicOrigin,
		/(\.discordsays\.com)$/,
		/^https:\/\/.*\.vercel\.app$/,
	],
});

// Use CORS middleware for the custom API routes
server.app.use(cors({
	origin: (ctx) => {
		const origin = ctx.get('Origin');
		const envOrigins = (process.env.CORS_ORIGINS || '')
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean);
		const allowedOrigins = [
			'http://localhost:5173',
			'http://localhost:5174',
			'http://localhost:5175',
			publicOrigin,
			...envOrigins,
		];
		if (
			allowedOrigins.includes(origin) ||
			(origin && (
				origin.includes('localhost') ||
				origin.includes('127.0.0.1') ||
				origin.endsWith('.discordsays.com') ||
				origin.endsWith('.vercel.app')
			))
		) {
			return origin;
		}
		return publicOrigin;
	},
	credentials: true,
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Use koa-body to parse request bodies for custom API routes
server.app.use(koaBody());

const PORT = process.env.PORT || 3001;

// Custom In-Memory Store for custom API logic
const activeRooms = new Map();

// Custom API Routes via Koa Router (boardgame.io uses Koa)
server.router.post('/api/rooms', (ctx) => {
	let roomID;
	do {
		roomID = generateRoomCode();
	} while (activeRooms.has(roomID));

	const body = ctx.request.body || {};
	const hostName = body.playerName || 'Player 1';

	const hostPlayer = {
		id: '0',
		name: hostName,
		isHost: true,
		isReady: true,
	};

	const newRoom = {
		id: roomID,
		players: [hostPlayer],
		status: "WAITING",
		maxPlayers: 6,
		createdAt: new Date()
	};

	activeRooms.set(roomID, newRoom);

	ctx.status = 201;
	ctx.body = {
		success: true,
		message: 'Room created successfully',
		room: newRoom
	};
});

server.router.get('/api/rooms/:id', (ctx) => {
	const id = ctx.params.id;
	const room = activeRooms.get(id.toUpperCase());

	if (!room) {
		ctx.status = 404;
		ctx.body = { success: false, message: 'Room not found' };
		return;
	}

	ctx.status = 200;
	ctx.body = { success: true, room };
});

server.router.post('/api/rooms/:id/join', async (ctx) => {
	const id = ctx.params.id;
	const body = ctx.request.body || {};
	const room = activeRooms.get(id.toUpperCase());

	if (!room) {
		ctx.status = 404;
		ctx.body = { success: false, message: 'Room not found' };
		return;
	}
	if (room.status !== 'WAITING') {
		ctx.status = 400;
		ctx.body = { success: false, message: 'Room is already playing' };
		return;
	}

	const player = {
		id: String(room.players.length),
		name: body.playerName || `Player ${room.players.length + 1}`,
		isHost: room.players.length === 0,
		isReady: room.players.length === 0
	};

	room.players.push(player);
	activeRooms.set(id.toUpperCase(), room);

	ctx.status = 200;
	ctx.body = { success: true, room, player };
});

server.router.post('/api/rooms/:id/start', async (ctx) => {
	const id = ctx.params.id;
	const room = activeRooms.get(id.toUpperCase());
	
	if (!room) {
		ctx.status = 404;
		ctx.body = { success: false, message: 'Room not found' };
		return;
	}

	room.status = 'PLAYING';
	activeRooms.set(id.toUpperCase(), room);

	ctx.status = 200;
	ctx.body = { success: true, room };
});

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
