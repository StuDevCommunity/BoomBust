import { applyDoodadPayment } from '../../domain/effects/doodadEffects.js';

export function payDoodadCommand({ G, ctx, playerID }, options = {}, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	const prompt = deps.getCurrentPrompt(player);
	if (!prompt || prompt.kind !== 'doodad') return deps.invalidMove;

	const mode = options?.mode || 'cash';
	const result = applyDoodadPayment(player, prompt, mode);
	if (!result.ok) {
		deps.setPlayerNotice(player, 'error', result.message);
		return deps.invalidMove;
	}

	deps.removeCurrentPrompt(player);
	deps.clearPlayerNotice(player);
	G.gameLog.push({
		type: 'doodad',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} resolved doodad: ${prompt.title}.`,
		timestamp: deps.createTimestamp(),
	});
	deps.syncBankruptcyState(G, playerID);
	return undefined;
}

export function resolveDownsizeTurnCommand({ G, ctx, playerID, events }, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	const prompt = deps.getCurrentPrompt(player);
	if (!prompt || prompt.kind !== 'downsizeSkip') return deps.invalidMove;

	player.downsizeTurns = Math.max(0, (player.downsizeTurns || 0) - 1);
	deps.removeCurrentPrompt(player);
	deps.clearPlayerNotice(player);
	G.dice = { value: null, die1: null, die2: null, die3: null, isDoubles: false, numDice: 0 };
	G.gameLog.push({
		type: 'downsize',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} loses a turn due to Downsize. ${player.downsizeTurns} turn(s) remaining.`,
		timestamp: deps.createTimestamp(),
	});
	events.endTurn();
	return undefined;
}
