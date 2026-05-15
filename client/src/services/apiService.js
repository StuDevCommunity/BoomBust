const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function createRoom(playerName) {
	try {
		const response = await fetch(`${API_BASE_URL}/rooms`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playerName: playerName || 'Player 1' }),
		});

		if (!response.ok) {
			const details = await response.text();
			throw new Error(`Failed to create room on server (${response.status})${details ? `: ${details}` : ''}`);
		}

		const data = await response.json();
		return data.room;
	} catch (error) {
		console.error('API Error (createRoom):', error);
		throw error;
	}
}


export async function joinRoom(roomCode, playerName) {
	try {
		const res = await fetch(`${API_BASE_URL}/rooms/${roomCode}/join`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playerName })
		});

		const data = await res.json();
		if (!data.success) {
			throw new Error(data.message || 'Room is full or does not exist');
		}

		// Trigger an SSE update visually if needed
		// NOTE: sseService is not defined in this file. It would need to be imported or defined.
		// sseService.broadcastNews(`Player joined room ${roomCode}`);

		return { room: data.room, player: data.player };
	} catch (error) {
		console.error('Error joining room:', error);
		throw error;
	}
}

export async function startGame(roomCode) {
	try {
		const res = await fetch(`${API_BASE_URL}/rooms/${roomCode}/start`, {
			method: 'POST'
		});
		const data = await res.json();

		if (!data.success) {
			throw new Error(data.message || 'Failed to start game');
		}

		// Notify all listeners that the game has started!
		// NOTE: sseService is not defined in this file. It would need to be imported or defined.
		// sseService.broadcastNews(`Game started in room ${roomCode}`);

		return data.room;
	} catch (error) {
		console.error('Error starting game:', error);
		throw error;
	}
}

export async function getRoomInfo(code) {
	try {
		const response = await fetch(`${API_BASE_URL}/rooms/${code}`);
		if (!response.ok) return null;
		const data = await response.json();
		const room = data.room;
		if (!room.players) room.players = [];
		room.maxPlayers = 6;
		return room;
	} catch {
		return null;
	}
}

export async function setPlayerReady(code, playerId, isReady) {
	// In this hybrid setup, player readiness is handled client-side or would need a custom PUT route
	// For now, returning mocked behavior so the UI state works
	return { success: true, playerId, isReady };
}

export async function validateRoom(code) {
	try {
		const response = await fetch(`${API_BASE_URL}/rooms/${code}`);
		return response.ok;
	} catch {
		return false;
	}
}
