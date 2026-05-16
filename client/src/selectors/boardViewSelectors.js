import boardTiles, { getTileDisplayMetadata } from '@boombust/game-core/boardTiles';

export function selectBoardTiles() {
	return boardTiles.map(getTileDisplayMetadata);
}

export function selectPlayersByTile(players) {
	return Object.entries(players || {}).reduce((map, [id, player]) => {
		const position = player.position ?? 0;
		if (!map[position]) map[position] = [];
		map[position].push({ id, player });
		return map;
	}, {});
}
