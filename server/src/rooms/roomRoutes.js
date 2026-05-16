import { generateRoomCode } from '../utils/generateCode.js';

const normalizeRoomCode = (value) => String(value || '').trim().toUpperCase();
const isValidRoomCode = (value) => /^[A-Z0-9]{4}$/.test(value);
const sanitizePlayerName = (value, fallback) => {
	const normalized = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 32);
	return normalized || fallback;
};

function generateUniqueRoomCode(roomStore) {
	let roomID;
	do {
		roomID = generateRoomCode();
	} while (roomStore.has(roomID));
	return roomID;
}

export function registerRoomRoutes(router, roomStore) {
	router.post('/api/rooms', (ctx) => {
		const roomID = generateUniqueRoomCode(roomStore);
		const body = ctx.request.body || {};
		const hostName = sanitizePlayerName(body.playerName, 'Player 1');

		const hostPlayer = {
			id: '0',
			name: hostName,
			isHost: true,
			isReady: true,
		};

		const newRoom = {
			id: roomID,
			players: [hostPlayer],
			status: 'WAITING',
			maxPlayers: 6,
			createdAt: new Date(),
		};

		roomStore.create(newRoom);

		ctx.status = 201;
		ctx.body = {
			success: true,
			message: 'Room created successfully',
			room: newRoom,
		};
	});

	router.get('/api/rooms/:id', (ctx) => {
		const id = normalizeRoomCode(ctx.params.id);
		if (!isValidRoomCode(id)) {
			ctx.status = 400;
			ctx.body = { success: false, message: 'Invalid room code' };
			return;
		}

		const room = roomStore.get(id);
		if (!room) {
			ctx.status = 404;
			ctx.body = { success: false, message: 'Room not found' };
			return;
		}

		ctx.status = 200;
		ctx.body = { success: true, room };
	});

	router.post('/api/rooms/:id/join', async (ctx) => {
		const id = normalizeRoomCode(ctx.params.id);
		if (!isValidRoomCode(id)) {
			ctx.status = 400;
			ctx.body = { success: false, message: 'Invalid room code' };
			return;
		}

		const body = ctx.request.body || {};
		const room = roomStore.get(id);

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
		if (room.players.length >= room.maxPlayers) {
			ctx.status = 409;
			ctx.body = { success: false, message: 'Room is full' };
			return;
		}

		const player = {
			id: String(room.players.length),
			name: sanitizePlayerName(body.playerName, `Player ${room.players.length + 1}`),
			isHost: room.players.length === 0,
			isReady: room.players.length === 0,
		};

		room.players.push(player);
		roomStore.set(id, room);

		ctx.status = 200;
		ctx.body = { success: true, room, player };
	});

	router.post('/api/rooms/:id/start', async (ctx) => {
		const id = normalizeRoomCode(ctx.params.id);
		if (!isValidRoomCode(id)) {
			ctx.status = 400;
			ctx.body = { success: false, message: 'Invalid room code' };
			return;
		}

		const room = roomStore.get(id);
		if (!room) {
			ctx.status = 404;
			ctx.body = { success: false, message: 'Room not found' };
			return;
		}

		room.status = 'PLAYING';
		roomStore.set(id, room);

		ctx.status = 200;
		ctx.body = { success: true, room };
	});
}
