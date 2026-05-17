export function getPlayerLabel(G, playerID) {
	return G?.playerNames?.[playerID] || `Player ${parseInt(playerID, 10) + 1}`;
}
