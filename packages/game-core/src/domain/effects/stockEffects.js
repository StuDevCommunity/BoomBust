export function applyStockEvent(G, card, { playerID, timestamp }) {
	const multiplier = Number(card.cost) === -1 ? 2 : 0.5;
	let affectedShares = 0;

	Object.values(G.players).forEach((player) => {
		player.assets = (player.assets || []).flatMap((asset) => {
			if (!asset.isStockLike || asset.key !== card.key) {
				return [asset];
			}

			const nextUnits = Math.floor((asset.units || 0) * multiplier);
			const nextLots = Math.floor((asset.purchaseLots || asset.units || 0) * multiplier);

			if (nextUnits <= 0 || nextLots <= 0) {
				affectedShares += asset.units || 0;
				return [];
			}

			affectedShares += Math.abs(nextUnits - (asset.units || 0));
			return [
				{
					...asset,
					units: nextUnits,
					purchaseLots: nextLots,
				},
			];
		});
	});

	G.gameLog.push({
		type: 'market',
		playerID,
		message: `${card.title} affected ${card.key} holdings across the table.`,
		timestamp,
		meta: {
			stockEvent: true,
			affectedShares,
			cardKey: card.key,
		},
	});
}
