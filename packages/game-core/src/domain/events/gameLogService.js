import { createGameLogEntry, createNotice } from './eventFactory.js';

export function appendGameLog(G, entry) {
	if (!G.gameLog) G.gameLog = [];
	const nextEntry = entry.message ? createGameLogEntry(entry) : entry;
	G.gameLog.push(nextEntry);
	return nextEntry;
}

export function setPlayerNotice(player, type, message, timestamp) {
	player.notice = createNotice(type, message, timestamp);
}

export function clearPlayerNotice(player) {
	player.notice = null;
}
