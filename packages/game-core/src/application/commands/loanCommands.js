import {
	BANK_LOAN_STEP,
	applyBankLoan,
	applyLiabilityPayment,
} from '../../domain/finance/financeService.js';
import { applyAssetSale } from '../../domain/effects/marketEffects.js';

export function sellAssetCommand({ G, ctx, playerID }, assetId, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	const asset = (player.assets || []).find((entry) => entry.id === assetId);
	if (!asset) return deps.invalidMove;

	const liquidationValue = deps.getLiquidationValue(asset);
	const soldAsset = applyAssetSale(player, asset.id, liquidationValue);
	G.gameLog.push({
		type: 'bankrupt',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} liquidated ${soldAsset?.name || asset.key} for $${liquidationValue.toLocaleString()}.`,
		timestamp: deps.createTimestamp(),
	});
	deps.syncBankruptcyState(G, playerID);
	return undefined;
}

export function declareBankruptcyCommand({ G, ctx, playerID }, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) return deps.invalidMove;
	const player = G.players[playerID];
	if (!player || player.eliminated) return deps.invalidMove;

	deps.eliminatePlayer(
		G,
		playerID,
		`${deps.getPlayerLabel(G, playerID)} declared bankruptcy and is out of the game.`
	);
	return undefined;
}

export function takeLoanCommand({ G, ctx, playerID }, amount, deps) {
	if (ctx.phase !== 'mainPlay') return deps.invalidMove;

	const player = G.players[playerID];
	if (!player || player.eliminated) return deps.invalidMove;

	const parsedAmount = Number(amount || 0);
	if (parsedAmount <= 0 || parsedAmount % BANK_LOAN_STEP !== 0) {
		deps.setPlayerNotice(player, 'error', 'Bank loans must be in exact $1,000 increments.');
		return deps.invalidMove;
	}

	applyBankLoan(player, parsedAmount);
	deps.clearPlayerNotice(player);

	G.gameLog.push({
		type: 'loan',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} borrowed $${parsedAmount.toLocaleString()} from the bank.`,
		timestamp: deps.createTimestamp(),
	});
	deps.syncBankruptcyState(G, playerID);
	return undefined;
}

export function payDebtCommand({ G, ctx, playerID }, liabilityKey, amount, deps) {
	if (ctx.phase !== 'mainPlay') return deps.invalidMove;

	const player = G.players[playerID];
	if (!player || !(liabilityKey in (player.liabilities || {}))) return deps.invalidMove;

	const currentAmount = Number(player.liabilities[liabilityKey] || 0);
	const paymentAmount = Number(amount || 0);
	if (currentAmount <= 0 || paymentAmount <= 0 || paymentAmount > currentAmount) {
		return deps.invalidMove;
	}

	if (paymentAmount !== currentAmount && paymentAmount % BANK_LOAN_STEP !== 0) {
		deps.setPlayerNotice(player, 'error', 'Debt payments must use $1,000 steps unless paying in full.');
		return deps.invalidMove;
	}

	if (player.cash < paymentAmount) {
		deps.setPlayerNotice(player, 'error', 'You do not have enough cash to make that payment.');
		return deps.invalidMove;
	}

	applyLiabilityPayment(player, liabilityKey, paymentAmount);

	deps.clearPlayerNotice(player);
	G.gameLog.push({
		type: 'debt',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} paid $${paymentAmount.toLocaleString()} toward ${liabilityKey}.`,
		timestamp: deps.createTimestamp(),
	});
	deps.syncBankruptcyState(G, playerID);
	return undefined;
}
