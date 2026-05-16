export function isStockLikeDeal(deal) {
	return deal.type === 'anystock' || deal.type === 'stock';
}

export function isStockEventCard(deal) {
	return deal.type === 'stock' && Number(deal.cost || 0) < 0;
}

export function normalizeDeal(rawDeal, deckType) {
	if (!rawDeal) return null;
	return {
		...rawDeal,
		dealType: deckType,
		type: rawDeal.type || 'property',
		title: rawDeal.title || 'Deal Opportunity',
		description: rawDeal.copy1 || rawDeal.description || '',
		subtitle: rawDeal.copy2 || '',
		key: rawDeal.key || rawDeal.symbol || rawDeal.title,
		cost: rawDeal.cost || 0,
		downPayment: rawDeal.downpay ?? rawDeal.downPayment ?? rawDeal.cost ?? 0,
		cashFlow: rawDeal.cashflow || rawDeal.cashFlow || 0,
		mortgage: rawDeal.mortgage || 0,
		units: rawDeal.units || 1,
		queue: rawDeal.queue === 'true',
		rule: rawDeal.rule || '',
	};
}

export function createGameId(G, prefix = 'id') {
	G.nextSequence = (G.nextSequence || 0) + 1;
	return `${prefix}-${G.nextSequence}`;
}

export function createAssetFromDeal(G, deal, quantity = 1) {
	const isStockLike = isStockLikeDeal(deal);
	const purchaseLots = isStockLike ? Math.max(1, quantity) : 1;
	const units = (deal.units || 1) * purchaseLots;
	return {
		id: createGameId(G, 'asset'),
		key: deal.key || deal.title,
		type: deal.type || 'property',
		name: deal.title || deal.description || 'Investment',
		cashFlow: deal.cashFlow || 0,
		purchasePrice: deal.cost || 0,
		downPayment: deal.downPayment || deal.cost || 0,
		mortgage:
			deal.mortgage || Math.max(0, (deal.cost || 0) - (deal.downPayment || deal.cost || 0)),
		units,
		purchaseLots,
		isStartup: deal.type === 'startup',
		isStockLike,
	};
}

export function addAssetToPortfolio(player, acquiredAsset) {
	if (acquiredAsset.isStockLike) {
		const existingAsset = (player.assets || []).find(
			(asset) =>
				asset.isStockLike &&
				asset.key === acquiredAsset.key &&
				asset.purchasePrice === acquiredAsset.purchasePrice &&
				asset.cashFlow === acquiredAsset.cashFlow
		);

		if (existingAsset) {
			existingAsset.units += acquiredAsset.units;
			existingAsset.purchaseLots += acquiredAsset.purchaseLots;
			return existingAsset;
		}
	}

	player.assets.push(acquiredAsset);
	return acquiredAsset;
}
