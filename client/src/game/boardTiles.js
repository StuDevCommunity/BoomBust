/**
 * Rectangular 44-tile Boombust board.
 * Movement uses tile index only; renderers map index to visual placement.
 */

export const TILE_TYPES = {
	START: 'start',
	PAYDAY: 'payday',
	DEAL: 'opportunity',
	MARKET: 'market',
	DOODAD: 'doodad',
	CHARITY: 'charity',
	STORY: 'story',
	DOWNSIZE: 'downsize',
	FED_MEETING: 'fed_meeting',
	BANKRUPTCY: 'bankruptcy',
	EMPTY: 'empty',
};

export const TILE_COLORS = {
	[TILE_TYPES.START]: 'var(--gb-screen-glow)',
	[TILE_TYPES.PAYDAY]: 'var(--gb-screen-glow)',
	[TILE_TYPES.DEAL]: '#91A963',
	[TILE_TYPES.MARKET]: '#728A52',
	[TILE_TYPES.DOODAD]: 'var(--gb-shell-dark)',
	[TILE_TYPES.CHARITY]: '#A7B47A',
	[TILE_TYPES.STORY]: '#CAD0A4',
	[TILE_TYPES.DOWNSIZE]: '#9E8F75',
	[TILE_TYPES.FED_MEETING]: '#7F8C64',
	[TILE_TYPES.BANKRUPTCY]: '#8B8271',
	[TILE_TYPES.EMPTY]: 'var(--gb-shell)',
};

const tile = (index, type, label, description = '') => ({
	id: `tile-${String(index).padStart(2, '0')}`,
	index,
	type,
	label,
	description,
});

const boardTiles = [
	tile(0, TILE_TYPES.START, 'START\nPAYDAY', 'Starting position and payday checkpoint.'),
	tile(1, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(2, TILE_TYPES.MARKET, 'MARKET'),
	tile(3, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(4, TILE_TYPES.STORY, 'STORY'),
	tile(5, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(6, TILE_TYPES.CHARITY, 'CHARITY'),
	tile(7, TILE_TYPES.MARKET, 'MARKET'),
	tile(8, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(9, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(10, TILE_TYPES.EMPTY, 'SAFE'),
	tile(11, TILE_TYPES.DOWNSIZE, 'DOWNSIZE', 'Future foreclosure pressure tile.'),
	tile(12, TILE_TYPES.MARKET, 'MARKET'),
	tile(13, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(14, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(15, TILE_TYPES.STORY, 'STORY'),
	tile(16, TILE_TYPES.CHARITY, 'CHARITY'),
	tile(17, TILE_TYPES.MARKET, 'MARKET'),
	tile(18, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(19, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(20, TILE_TYPES.EMPTY, 'SAFE'),
	tile(21, TILE_TYPES.STORY, 'STORY'),
	tile(22, TILE_TYPES.FED_MEETING, 'FED\nMEETING', 'Future interest rate and macro policy tile.'),
	tile(23, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(24, TILE_TYPES.MARKET, 'MARKET'),
	tile(25, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(26, TILE_TYPES.CHARITY, 'CHARITY'),
	tile(27, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(28, TILE_TYPES.STORY, 'STORY'),
	tile(29, TILE_TYPES.MARKET, 'MARKET'),
	tile(30, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(31, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(32, TILE_TYPES.EMPTY, 'SAFE'),
	tile(33, TILE_TYPES.BANKRUPTCY, 'BANKRUPTCY\nCOURT', 'Future bankruptcy and audit tile.'),
	tile(34, TILE_TYPES.STORY, 'STORY'),
	tile(35, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(36, TILE_TYPES.MARKET, 'MARKET'),
	tile(37, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(38, TILE_TYPES.CHARITY, 'CHARITY'),
	tile(39, TILE_TYPES.DEAL, 'OPPORTUNITY'),
	tile(40, TILE_TYPES.STORY, 'STORY'),
	tile(41, TILE_TYPES.MARKET, 'MARKET'),
	tile(42, TILE_TYPES.DOODAD, 'DOODAD'),
	tile(43, TILE_TYPES.EMPTY, 'SAFE'),
];

export default boardTiles;
