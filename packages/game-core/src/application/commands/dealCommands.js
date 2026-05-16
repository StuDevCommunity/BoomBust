import {
	addAssetToPortfolio,
	createAssetFromDeal,
	isStockEventCard,
	isStockLikeDeal,
	normalizeDeal,
} from '../../domain/effects/dealEffects.js';
import { applyStockEvent } from '../../domain/effects/stockEffects.js';

export function selectDealTypeCommand({ G, ctx, playerID, random }, dealType, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.isSelectingDeal) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	const isBigDeal = dealType === 'big';
	if (isBigDeal && player.cash < 6000) {
		deps.setPlayerNotice(player, 'error', 'You need at least $6,000 cash for a Big Deal.');
		return deps.invalidMove;
	}

	const deck = isBigDeal ? deps.getBigDeals() : deps.getSmallDeals();
	const rawDeal = deps.drawCard(deck, random);
	const deal = normalizeDeal(rawDeal, isBigDeal ? 'big' : 'small');

	G.isSelectingDeal = false;
	deps.clearPlayerNotice(player);

	if (!deal) return deps.invalidMove;

	if (isStockEventCard(deal)) {
		applyStockEvent(G, deal, { playerID, timestamp: deps.createTimestamp() });
		return undefined;
	}

	if (deal.queue && isStockLikeDeal(deal)) {
		deps.queueGlobalStockOffer(G, playerID, deal, {
			allowBuyForAll: deal.type === 'anystock',
		});
		return undefined;
	}

	G.currentDeal = deal;
	G.gameLog.push({
		type: 'deal',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} revealed ${deal.title}.`,
		timestamp: deps.createTimestamp(),
	});
	return undefined;
}

export function acceptDealCommand({ G, ctx, playerID }, quantity = 1, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.currentDeal) {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	const deal = G.currentDeal;

	if (deal.isCharity || deal.dealType === 'charity') {
		const requiredCash = Number(deal.downPayment || deal.cost || 0);
		if (player.cash < requiredCash) {
			deps.setPlayerNotice(player, 'error', 'You do not have enough cash for Charity.');
			return deps.invalidMove;
		}

		player.cash -= requiredCash;
		player.charityTurns = 4;
		G.currentDeal = null;
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} donated $${requiredCash.toLocaleString()} to Charity.`,
			timestamp: deps.createTimestamp(),
		});
		return undefined;
	}

	const purchaseLots = isStockLikeDeal(deal) ? Math.max(1, Number(quantity) || 1) : 1;
	const requiredCash = Number(deal.downPayment || deal.cost || 0) * purchaseLots;
	if (player.cash < requiredCash) {
		deps.setPlayerNotice(player, 'error', 'Insufficient cash to take this deal.');
		return deps.invalidMove;
	}

	const acquiredAsset = createAssetFromDeal(G, deal, purchaseLots);
	player.cash -= requiredCash;
	addAssetToPortfolio(player, acquiredAsset);

	G.currentDeal = null;
	G.gameLog.push({
		type: 'deal',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} bought ${deal.title} for $${requiredCash.toLocaleString()}.`,
		timestamp: deps.createTimestamp(),
	});
	return undefined;
}

export function declineDealCommand({ G, ctx, playerID }, deps) {
	if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
		return deps.invalidMove;
	}

	if (G.isSelectingDeal) {
		G.isSelectingDeal = false;
		return undefined;
	}

	if (G.currentDeal) {
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} passed on ${G.currentDeal.title}.`,
			timestamp: deps.createTimestamp(),
		});
		G.currentDeal = null;
		return undefined;
	}

	const player = G.players[playerID];
	const prompt = deps.getCurrentPrompt(player);
	if (prompt?.kind === 'market') {
		deps.removeCurrentPrompt(player);
		G.gameLog.push({
			type: 'market',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} passed on ${prompt.title}.`,
			timestamp: deps.createTimestamp(),
		});
		return undefined;
	}

	return deps.invalidMove;
}
