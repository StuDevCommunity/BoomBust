export function createTimestamp() {
	return Date.now();
}

export function createNotice(type, message, timestamp = createTimestamp()) {
	return {
		type,
		message,
		timestamp,
	};
}

export function createGameLogEntry({ type, playerID, message, timestamp = createTimestamp(), meta }) {
	return {
		type,
		playerID,
		message,
		timestamp,
		...(meta ? { meta } : {}),
	};
}
