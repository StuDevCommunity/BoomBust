import { FAST_TRACK_RISK_CARDS } from '../../fastTrackConfig.js';
import {
	applyBankLoan,
	calcPassiveIncome,
	calcPayday,
} from '../finance/financeService.js';
import { drawCard } from '../decks/deckService.js';
import { createNotice, createTimestamp } from '../events/eventFactory.js';
import { appendGameLog } from '../events/gameLogService.js';
import { getPlayerLabel } from './playerLabelService.js';

export const FAST_TRACK_TARGET_INCREASE = 50000;
export const DISCONNECT_TIMEOUT_MS = 60000;

export function calcFastTrackIncomeGoal(player) {
	return (player.fastTrackBaseIncome || 0) + FAST_TRACK_TARGET_INCREASE;
}

export function getLiquidationValue(asset) {
	const base = asset.downPayment || asset.purchasePrice || 0;
	return Math.max(0, Math.round(base * 0.5));
}

export function getPayoffCandidates(player) {
	return Object.entries(player.liabilities || {}).filter(([, value]) => value > 0);
}

export function coverMandatoryShortfall(G, playerID, amount, reason) {
	const player = G.players[playerID];
	if (!player || amount <= (player.cash || 0)) return 0;

	const borrowedAmount = applyBankLoan(player, amount - (player.cash || 0));
	if (borrowedAmount > 0) {
		appendGameLog(G, {
			type: 'loan',
			playerID,
			message: `${getPlayerLabel(G, playerID)} auto-borrowed $${borrowedAmount.toLocaleString()} to cover ${reason}.`,
			timestamp: createTimestamp(),
		});
	}
	return borrowedAmount;
}

export function payMandatoryAmount(G, playerID, amount, reason) {
	const player = G.players[playerID];
	if (!player || amount <= 0) return 0;

	coverMandatoryShortfall(G, playerID, amount, reason);
	player.cash = Math.max(0, (player.cash || 0) - amount);
	return amount;
}

export function eliminatePlayer(G, playerID, message) {
	const player = G.players[playerID];
	if (!player || player.eliminated) return;

	player.eliminated = true;
	player.pendingPrompts = [];
	player.notice = createNotice('error', 'You are out of the game.');
	G.turnOrder = G.turnOrder.filter((id) => id !== playerID);
	appendGameLog(G, {
		type: 'bankrupt',
		playerID,
		message,
		timestamp: createTimestamp(),
	});
}

export function syncBankruptcyState(G, playerID) {
	const player = G.players[playerID];
	if (!player || player.isFastTrack || player.eliminated) return;

	player.isBankrupt = calcPayday(player) < 0;
	if (!player.isBankrupt) {
		player.bankruptcyStage = null;
		return;
	}

	player.bankruptcyStage = 'resolving';
	if ((player.assets || []).length === 0 && getPayoffCandidates(player).length === 0) {
		eliminatePlayer(
			G,
			playerID,
			`${getPlayerLabel(G, playerID)} is bankrupt and has no assets left to liquidate.`
		);
	}
}

export function maybeDeclareWinner(G, playerID) {
	const player = G.players[playerID];
	if (!player || player.eliminated) return;

	if (player.isFastTrack && player.fastTrackIncomeCurrent >= calcFastTrackIncomeGoal(player)) {
		G.winner = playerID;
		appendGameLog(G, {
			type: 'victory',
			playerID,
			message: `${getPlayerLabel(G, playerID)} won by growing Fast Track income by $50,000.`,
			timestamp: createTimestamp(),
		});
	}
}

export function awardRatRacePayday(G, playerID, multiplier = 1) {
	const player = G.players[playerID];
	const paydayAmount = calcPayday(player) * multiplier;
	if (paydayAmount >= 0) {
		player.cash += paydayAmount;
	} else {
		payMandatoryAmount(G, playerID, Math.abs(paydayAmount), 'negative cash flow');
	}
	appendGameLog(G, {
		type: 'payday',
		playerID,
		message: `${getPlayerLabel(G, playerID)} received payday: $${paydayAmount.toLocaleString()}.`,
		timestamp: createTimestamp(),
	});
}

export function collectFastTrackCashFlowDay(G, playerID) {
	const player = G.players[playerID];
	player.fastTrackCash += player.fastTrackIncomeCurrent;
	appendGameLog(G, {
		type: 'payday',
		playerID,
		message: `${getPlayerLabel(G, playerID)} collected Fast Track income: $${player.fastTrackIncomeCurrent.toLocaleString()}.`,
		timestamp: createTimestamp(),
	});
}

export function applyRiskCard(G, playerID, random) {
	const player = G.players[playerID];
	const riskCard = drawCard(FAST_TRACK_RISK_CARDS, random);
	if (!riskCard) return;

	if (riskCard.effect === 'halfCash') {
		player.fastTrackCash = Math.floor(player.fastTrackCash / 2);
	}

	if (riskCard.effect === 'loseAllCash') {
		player.fastTrackCash = 0;
	}

	appendGameLog(G, {
		type: 'loss',
		playerID,
		message: `${getPlayerLabel(G, playerID)} hit Fast Track risk: ${riskCard.title}.`,
		timestamp: createTimestamp(),
	});
}

export function enterFastTrack(G, playerID) {
	const player = G.players[playerID];
	const passiveIncome = calcPassiveIncome(player);
	player.isFastTrack = true;
	player.fastTrackPosition = 0;
	player.fastTrackBaseIncome = passiveIncome;
	player.fastTrackIncomeCurrent = passiveIncome;
	player.fastTrackPassiveIncome = passiveIncome;
	player.fastTrackCash = passiveIncome * 100;
	player.fastTrackCharityActive = false;
	player.pendingPrompts = [];

	G.currentDeal = null;
	G.currentDoodad = null;
	G.currentFastTrackSpace = null;

	appendGameLog(G, {
		type: 'victory',
		playerID,
		message: `${getPlayerLabel(G, playerID)} escaped the Rat Race with $${player.fastTrackCash.toLocaleString()} Fast Track cash.`,
		timestamp: createTimestamp(),
	});
}

export function advanceReceivables(player) {
	if (!player.receivables?.length) return;

	const remaining = [];
	player.receivables.forEach((receivable) => {
		const nextTurns = (receivable.turnsRemaining || 0) - 1;
		if (nextTurns <= 0) {
			player.cash += receivable.payoutCash || 0;
			if (receivable.expensePenalty) {
				player.expenses.other = Math.max(0, (player.expenses.other || 0) - receivable.expensePenalty);
			}
			return;
		}
		remaining.push({
			...receivable,
			turnsRemaining: nextTurns,
		});
	});

	player.receivables = remaining;
}

export function checkDisconnectedPlayers(G, now) {
	if (!G.disconnectTimestamps) G.disconnectTimestamps = {};
	if (!G.kickedPlayers) G.kickedPlayers = {};
	if (typeof now !== 'number') return;

	Object.entries(G.disconnectTimestamps).forEach(([playerID, disconnectTime]) => {
		if (now - disconnectTime >= DISCONNECT_TIMEOUT_MS && !G.kickedPlayers[playerID]) {
			const playerName = getPlayerLabel(G, playerID);
			G.kickedPlayers[playerID] = true;
			delete G.disconnectTimestamps[playerID];
			eliminatePlayer(G, playerID, `${playerName} was kicked for being disconnected too long.`);
			appendGameLog(G, {
				type: 'kick',
				playerID,
				message: `${playerName} was kicked due to inactivity (60s timeout).`,
				timestamp: createTimestamp(),
			});
		}
	});
}
