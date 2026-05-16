import boardTiles, { TILE_TYPES } from '../../boardTiles.js';
import { FAST_TRACK_SPACES } from '../../fastTrackConfig.js';

const RAT_RACE_TILE_COUNT = boardTiles.length;
const FAST_TRACK_TILE_COUNT = FAST_TRACK_SPACES.length;

export function rollDiceCommand({ G, ctx, playerID, random }, requestedDiceCount = null, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || G.dice?.value) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	if (!player || player.eliminated || player.isBankrupt) return deps.invalidMove;
	if (G.isSelectingDeal || G.currentDeal || G.currentFastTrackSpace) return deps.invalidMove;
	if (deps.getCurrentPrompt(player)) return deps.invalidMove;

	const numDice = player.isFastTrack
		? player.fastTrackCharityActive
			? Math.max(1, Math.min(3, Number(requestedDiceCount) || 2))
			: 2
		: player.charityTurns > 0
			? 2
			: 1;
	const results = Array.from({ length: numDice }, () => random.Die(6));
	const value = results.reduce((sum, entry) => sum + entry, 0);

	G.dice = {
		value,
		die1: results[0] ?? null,
		die2: results[1] ?? null,
		die3: results[2] ?? null,
		isDoubles: results.length > 1 && results.every((roll) => roll === results[0]),
		numDice,
	};

	if (player.isFastTrack) {
		const nextPosition = (player.fastTrackPosition + value) % FAST_TRACK_TILE_COUNT;
		player.fastTrackPosition = nextPosition;
		deps.handleFastTrackLanding(G, playerID, FAST_TRACK_SPACES[nextPosition], random);
		return undefined;
	}

	const previousPosition = player.position;
	const rawPosition = previousPosition + value;
	const nextPosition = rawPosition % RAT_RACE_TILE_COUNT;
	player.position = nextPosition;

	for (let step = 1; step <= value; step++) {
		const tileIndex = (previousPosition + step) % RAT_RACE_TILE_COUNT;
		const tile = boardTiles[tileIndex];
		if (tile && [TILE_TYPES.PAYDAY, TILE_TYPES.START].includes(tile.type)) {
			deps.awardRatRacePayday(G, playerID);
		}
	}

	G.gameLog.push({
		type: 'move',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} rolled ${value} and moved to ${boardTiles[nextPosition]?.label || 'a tile'}.`,
		timestamp: deps.createTimestamp(),
	});
	deps.handleRatRaceLanding(G, playerID, boardTiles[nextPosition], random, ctx);
	return undefined;
}
