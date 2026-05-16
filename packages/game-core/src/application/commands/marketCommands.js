import { createAssetFromDeal, addAssetToPortfolio } from '../../domain/effects/dealEffects.js';
import {
	applyAssetSale,
	calculateNetSaleValue,
	getMatchingAssets,
} from '../../domain/effects/marketEffects.js';

export function resolveMarketOfferCommand({ G, ctx, playerID }, payload = {}, deps) {
	if (ctx.phase !== 'mainPlay') {
		return deps.invalidMove;
	}

	const player = G.players[playerID];
	const prompt = deps.getCurrentPrompt(player);
	if (!prompt || prompt.kind !== 'market') return deps.invalidMove;

	if (payload.pass || payload.action === 'pass') {
		deps.removeCurrentPrompt(player);
		G.gameLog.push({
			type: 'market',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} passed on ${prompt.title}.`,
			timestamp: deps.createTimestamp(),
		});
		return undefined;
	}

	if (prompt.marketType === 'fee') {
		if (player.cash < prompt.cost) {
			deps.setPlayerNotice(player, 'error', `You need $${prompt.cost.toLocaleString()} cash to pay this fee.`);
			return deps.invalidMove;
		}

		player.cash -= prompt.cost;
		deps.removeCurrentPrompt(player);
		G.gameLog.push({
			type: 'market',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} paid market fee: $${prompt.cost.toLocaleString()}.`,
			timestamp: deps.createTimestamp(),
		});
		deps.syncBankruptcyState(G, playerID);
		return undefined;
	}

	if (prompt.marketType === 'brother') {
		const asset = getMatchingAssets(player, prompt.key)[0];
		if (!asset) {
			deps.removeCurrentPrompt(player);
			return deps.invalidMove;
		}

		applyAssetSale(player, asset.id, 0);
		player.expenses.other = (player.expenses.other || 0) + Number(prompt.cost || 0);
		player.receivables.push({
			id: deps.getPromptId('receivable'),
			title: prompt.title,
			payoutCash: 100000,
			turnsRemaining: 48,
			expensePenalty: Number(prompt.cost || 0),
		});
		deps.removeCurrentPrompt(player);
		G.gameLog.push({
			type: 'market',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} sold a 3/2 house to family terms and will collect $100,000 in 48 turns.`,
			timestamp: deps.createTimestamp(),
		});
		deps.syncBankruptcyState(G, playerID);
		return undefined;
	}

	if (payload.action === 'buy' && prompt.allowBuy) {
		const units = Math.max(1, Number(payload.units) || 1);
		const purchaseCost = Number(prompt.cost || 0) * units;
		if (player.cash < purchaseCost) {
			deps.setPlayerNotice(player, 'error', `You need $${purchaseCost.toLocaleString()} cash to buy this offer.`);
			return deps.invalidMove;
		}

		const acquiredAsset = createAssetFromDeal(
			G,
			{
				...prompt,
				type: prompt.type,
				cashFlow: Number(prompt.cashflow || prompt.cashFlow || 0),
				downPayment: Number(prompt.cost || 0),
			},
			units
		);

		player.cash -= purchaseCost;
		addAssetToPortfolio(player, acquiredAsset);

		deps.removeCurrentPrompt(player);
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${deps.getPlayerLabel(G, playerID)} bought ${prompt.title} for $${purchaseCost.toLocaleString()}.`,
			timestamp: deps.createTimestamp(),
		});
		return undefined;
	}

	const targetAsset =
		(player.assets || []).find((asset) => asset.id === payload.assetId) ||
		getMatchingAssets(player, prompt.key)[0];
	if (!targetAsset) return deps.invalidMove;

	const unitsToSell = targetAsset.isStockLike
		? Math.min(Number(payload.units) || targetAsset.units || 1, targetAsset.units || 1)
		: null;
	const saleValue = calculateNetSaleValue(targetAsset, prompt, unitsToSell);
	const soldAsset = applyAssetSale(player, targetAsset.id, saleValue, unitsToSell);
	deps.removeCurrentPrompt(player);

	G.gameLog.push({
		type: 'market',
		playerID,
		message: `${deps.getPlayerLabel(G, playerID)} sold ${soldAsset?.name || prompt.key} for $${saleValue.toLocaleString()}.`,
		timestamp: deps.createTimestamp(),
	});
	return undefined;
}
