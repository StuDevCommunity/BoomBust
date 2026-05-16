import { canEscapeRatRace } from '../../domain/finance/financeService.js';

export function buyFastTrackSpaceCommand({ G, ctx, playerID, random }, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.currentFastTrackSpace) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	if (!player?.isFastTrack) return deps.invalidMove;

	const space = G.currentFastTrackSpace;

	if (space.type === 'charity') {
		if (player.fastTrackCash < space.cost) return deps.invalidMove;
		player.fastTrackCash -= space.cost;
		player.fastTrackCharityActive = true;
		G.currentFastTrackSpace = null;
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} bought Fast Track Charity for $${space.cost.toLocaleString()}.`,
			timestamp: deps.createTimestamp(),
		});
		return undefined;
	}

	if (space.type === 'dream') {
		if (player.fastTrackCash < Number(space.cost || 0)) return deps.invalidMove;
		player.fastTrackCash -= Number(space.cost || 0);
		G.currentFastTrackSpace = null;
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} purchased Fast Track luxury: ${space.title}.`,
			timestamp: deps.createTimestamp(),
		});
		return undefined;
	}

	if (space.type === 'investment') {
		if (player.fastTrackCash < Number(space.cost || 0)) return deps.invalidMove;
		player.fastTrackCash -= Number(space.cost || 0);

		let rewardEarned = Number(space.reward || 0);
		let cashFlowEarned = Number(space.cashflow || 0);
		let rollResult = null;
		if (space.rollmin) {
			rollResult = random.Die(6);
			if (rollResult < Number(space.rollmin)) {
				rewardEarned = 0;
				cashFlowEarned = 0;
			}
		}

		player.fastTrackCash += rewardEarned;
		player.fastTrackIncomeCurrent += cashFlowEarned;
		player.fastTrackPassiveIncome = player.fastTrackIncomeCurrent;
		G.currentFastTrackSpace = null;
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} bought Fast Track investment ${space.title}${rollResult ? ` and rolled ${rollResult}` : ''}.`,
			timestamp: deps.createTimestamp(),
		});
		deps.maybeDeclareWinner(G, playerID);
		return undefined;
	}

	return deps.invalidMove;
}

export function declineFastTrackSpaceCommand({ G, ctx, playerID }, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.currentFastTrackSpace) {
		return deps.invalidMove;
	}

	G.gameLog.push({
		type: 'deal',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} passed on ${G.currentFastTrackSpace.title}.`,
		timestamp: deps.createTimestamp(),
	});
	G.currentFastTrackSpace = null;
	return undefined;
}

export function endTurnCommand({ G, ctx, playerID, events }, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	if (!player || player.eliminated || player.isBankrupt) return deps.invalidMove;
	if (!G.dice?.value) {
		deps.setPlayerNotice(player, 'warning', 'Roll the dice before ending your turn.');
		return deps.invalidMove;
	}
	if (G.isSelectingDeal || G.currentDeal || G.currentFastTrackSpace || deps.getCurrentPrompt(player)) {
		deps.setPlayerNotice(player, 'warning', 'Resolve the current card or prompt before ending your turn.');
		return deps.invalidMove;
	}

	if (!player.isFastTrack && canEscapeRatRace(player)) {
		deps.enterFastTrack(G, playerID);
	}

	G.dice = { value: null, die1: null, die2: null, die3: null, isDoubles: false, numDice: 0 };
	deps.clearPlayerNotice(player);
	if (!player.isFastTrack && player.charityTurns > 0) {
		player.charityTurns -= 1;
	}
	events.endTurn();
	return undefined;
}
