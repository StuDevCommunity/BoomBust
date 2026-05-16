export function assetMatchesKey(asset, key) {
	if (!asset || !key) return false;
	if (asset.key === key) return true;

	switch (key) {
		case 'PLEX':
			return ['DUPLEX', '4PLEX', '8PLEX'].includes(asset.key);
		case 'APTHOUSE':
			return asset.key === 'APTHOUSE';
		case 'rental':
			return ['2/1CONDO', '3/2HOUSE', 'DUPLEX', '4PLEX', '8PLEX', 'APTHOUSE', 'BED'].includes(asset.key);
		case 'gold':
			return asset.key === 'gold';
		case 'coin':
			return asset.key === 'coin';
		case 'cd':
			return asset.key === 'cd';
		case '8PLEX':
			return asset.key === '8PLEX';
		case '10ACRES':
			return asset.key === '10ACRES';
		case '20ACRES':
			return asset.key === '20ACRES';
		case 'widget':
			return asset.key === 'widget';
		case 'software':
			return asset.key === 'software';
		case 'CARWASH':
			return asset.key === 'CARWASH';
		case 'MALL':
			return asset.key === 'MALL';
		case 'PARTNER':
			return asset.key === 'PARTNER';
		case 'BED':
			return asset.key === 'BED';
		default:
			return false;
	}
}

export function getMatchingAssets(player, key) {
	return (player.assets || []).filter((asset) => assetMatchesKey(asset, key));
}

export function createMarketPrompt(baseCard, overrides = {}) {
	return {
		...baseCard,
		kind: 'market',
		title: baseCard.title,
		description: [baseCard.copy1, baseCard.copy2].filter(Boolean).join(' '),
		marketType: baseCard.type,
		key: baseCard.key,
		cost: Number(baseCard.cost || 0),
		cashFlow: Number(baseCard.cashflow || baseCard.cashFlow || 0),
		rule: baseCard.rule || '',
		queue: baseCard.queue === 'true' || baseCard.queue === true,
		...overrides,
	};
}

export function calculateNetSaleValue(asset, prompt, unitsToSell = null) {
	if (!asset || !prompt) return 0;

	const sellUnits = unitsToSell ?? asset.units ?? 1;
	const isStockAsset = asset.isStockLike || ['gold', 'coin', 'cd'].includes(asset.key);
	let grossValue = Number(prompt.cost || 0);

	if (prompt.marketType === 'sell') {
		if (['gold', 'coin', 'cd'].includes(asset.key) || asset.isStockLike) {
			grossValue = Number(prompt.cost || 0) * sellUnits;
		} else if (['PLEX', 'APTHOUSE'].includes(prompt.key)) {
			grossValue = Number(prompt.cost || 0) * sellUnits;
		}
	}

	if (prompt.marketType === 'selladd') {
		grossValue = Number(asset.purchasePrice || 0) + Number(prompt.cost || 0);
	}

	if (prompt.marketType === 'sellmultiply') {
		grossValue = Number(asset.purchasePrice || 0) * Number(prompt.cost || 0);
	}

	if (isStockAsset && !['sell', 'selladd', 'sellmultiply'].includes(prompt.marketType)) {
		grossValue = Number(prompt.cost || 0) * sellUnits;
	}

	if (isStockAsset) {
		return Math.max(0, grossValue);
	}

	const mortgageShare =
		sellUnits && (asset.units || 1) > 0
			? Math.round((Number(asset.mortgage || 0) * sellUnits) / (asset.units || 1))
			: Number(asset.mortgage || 0);

	return Math.max(0, grossValue - mortgageShare);
}

export function applyAssetSale(player, assetId, saleValue, unitsToSell = null) {
	const assetIndex = (player.assets || []).findIndex((asset) => asset.id === assetId);
	if (assetIndex === -1) return null;

	const asset = player.assets[assetIndex];
	const sellUnits = unitsToSell ?? asset.units ?? 1;

	player.cash += saleValue;

	if ((asset.units || 1) <= sellUnits || !asset.isStockLike) {
		player.assets.splice(assetIndex, 1);
		return asset;
	}

	const remainingUnits = (asset.units || 0) - sellUnits;
	const remainingLots = Math.max(0, (asset.purchaseLots || asset.units || 0) - sellUnits);
	const mortgageShare = Math.round((Number(asset.mortgage || 0) * sellUnits) / (asset.units || 1));

	player.assets[assetIndex] = {
		...asset,
		units: remainingUnits,
		purchaseLots: remainingLots,
		mortgage: Math.max(0, Number(asset.mortgage || 0) - mortgageShare),
	};

	return {
		...asset,
		units: sellUnits,
		purchaseLots: sellUnits,
		mortgage: mortgageShare,
	};
}
