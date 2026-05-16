export { selectFinancialStatement } from './financialStatementSelectors';

export const assetMatchesMarketKey = (asset, key) => {
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
		default:
			return false;
	}
};

export function selectCurrentPlayer(G, playerId) {
	return G?.players?.[playerId] || null;
}

export function selectCurrentPrompt(player) {
	const currentPrompt = player?.pendingPrompts?.[0] || null;
	return {
		currentPrompt,
		marketPrompt: currentPrompt?.kind === 'market' ? currentPrompt : null,
		doodadPrompt: currentPrompt?.kind === 'doodad' ? currentPrompt : null,
		downsizePrompt: currentPrompt?.kind === 'downsizeSkip' ? currentPrompt : null,
	};
}

export function selectEventFeed(G) {
	return G?.gameLog || [];
}

export function selectPlayerRoster(G, ctx, roster) {
	const roomPlayersById = Object.fromEntries((roster || []).map((player) => [String(player.id), player]));
	const orderedPlayerIds = ctx?.playOrder || G?.turnOrder || Object.keys(G?.players || {});

	return orderedPlayerIds.map((id, index) => {
		const player = G?.players?.[id];
		const roomPlayer = roomPlayersById[id];
		return {
			id,
			index,
			name: roomPlayer?.name || `Player ${parseInt(id, 10) + 1}`,
			profession: player?.profession?.title || null,
			professionId: player?.profession?.id || null,
			downsizeTurns: player?.downsizeTurns || 0,
			charityTurns: player?.charityTurns || 0,
		};
	});
}

export function selectMatchingMarketAssets(player, marketPrompt) {
	if (!marketPrompt || !player) return [];
	return (player.assets || []).filter((asset) => assetMatchesMarketKey(asset, marketPrompt.key));
}
