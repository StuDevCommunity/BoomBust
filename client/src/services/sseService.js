/**
 * Mocked SSE service — to be replaced with real SSE when backend is ready
 */

class MockSSEService {
	constructor() {
		this.listeners = new Map();
		this.intervals = [];
	}

	subscribeLobby(roomCode, callback) {
		const key = `lobby:${roomCode}`;
		this.listeners.set(key, callback);

		// Send initial event
		setTimeout(() => {
			callback({
				type: 'lobby_update',
				data: { roomCode, message: 'Connected to lobby' },
			});
		}, 100);

		return () => {
			this.listeners.delete(key);
		};
	}

	subscribeGlobalNews(callback) {
		this.listeners.set('globalNews', callback);

		return () => {
			this.listeners.delete('globalNews');
		};
	}

	broadcastNews(message) {
		const cb = this.listeners.get('globalNews');
		if (cb) {
			cb({
				type: 'global_news',
				data: { message, timestamp: Date.now() },
			});
		}
	}

	disconnect() {
		this.listeners.clear();
		this.intervals.forEach(clearInterval);
		this.intervals = [];
	}
}

const sseService = new MockSSEService();
export default sseService;
