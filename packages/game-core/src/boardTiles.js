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
	[TILE_TYPES.DEAL]: 'var(--gb-shell)',
	[TILE_TYPES.MARKET]: 'var(--gb-screen-glow)',
	[TILE_TYPES.DOODAD]: 'var(--gb-shell-dark)',
	[TILE_TYPES.CHARITY]: 'var(--bb-text-on-screen-muted)',
	[TILE_TYPES.STORY]: 'var(--bb-text-on-screen-strong)',
	[TILE_TYPES.DOWNSIZE]: 'var(--gb-shell-dark)',
	[TILE_TYPES.FED_MEETING]: 'var(--bb-text-on-screen-muted)',
	[TILE_TYPES.BANKRUPTCY]: 'var(--gb-shell-dark)',
	[TILE_TYPES.EMPTY]: 'var(--gb-shell)',
};

export const TILE_SHORT_LABELS = {
	[TILE_TYPES.START]: 'START',
	[TILE_TYPES.PAYDAY]: 'PAY',
	[TILE_TYPES.DEAL]: 'OPP',
	[TILE_TYPES.MARKET]: 'MKT',
	[TILE_TYPES.DOODAD]: 'DOD',
	[TILE_TYPES.CHARITY]: 'CHR',
	[TILE_TYPES.STORY]: 'STY',
	[TILE_TYPES.DOWNSIZE]: 'DOWN',
	[TILE_TYPES.FED_MEETING]: 'FED',
	[TILE_TYPES.BANKRUPTCY]: 'COURT',
	[TILE_TYPES.EMPTY]: 'SAFE',
};

export const TILE_TYPE_LABELS = {
	[TILE_TYPES.START]: 'Payday',
	[TILE_TYPES.PAYDAY]: 'Payday',
	[TILE_TYPES.DEAL]: 'Opportunity',
	[TILE_TYPES.MARKET]: 'Market',
	[TILE_TYPES.DOODAD]: 'Doodad',
	[TILE_TYPES.CHARITY]: 'Charity',
	[TILE_TYPES.STORY]: 'Story',
	[TILE_TYPES.DOWNSIZE]: 'Downsize',
	[TILE_TYPES.FED_MEETING]: 'Fed Meeting',
	[TILE_TYPES.BANKRUPTCY]: 'Bankruptcy',
	[TILE_TYPES.EMPTY]: 'Safe',
};

export function getTileDisplayMetadata(tile) {
	return {
		...tile,
		color: TILE_COLORS[tile.type] || 'var(--gb-shell)',
		shortLabel: TILE_SHORT_LABELS[tile.type] || tile.label,
		typeLabel: TILE_TYPE_LABELS[tile.type] || tile.type,
	};
}

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
