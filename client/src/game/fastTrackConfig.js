import fastTrackData from '../data/fasttrack.json' with { type: 'json' };

const SPECIAL_SPACE_BY_ID = {
	1: {
		id: 1,
		type: 'cashflowDay',
		title: 'Cash Flow Day',
		description: 'Collect your current Fast Track income.',
	},
	5: {
		id: 5,
		type: 'risk',
		title: 'Risk',
		description: 'Draw a Fast Track risk event.',
	},
	9: {
		id: 9,
		type: 'charity',
		title: 'Charity',
		description: 'Donate $100,000 to choose 1-3 dice for the rest of the game.',
		cost: 100000,
	},
	21: {
		id: 21,
		type: 'cashflowDay',
		title: 'Cash Flow Day',
		description: 'Collect your current Fast Track income.',
	},
	25: {
		id: 25,
		type: 'risk',
		title: 'Risk',
		description: 'Draw a Fast Track risk event.',
	},
	37: {
		id: 37,
		type: 'cashflowDay',
		title: 'Cash Flow Day',
		description: 'Collect your current Fast Track income.',
	},
	41: {
		id: 41,
		type: 'risk',
		title: 'Risk',
		description: 'Draw a Fast Track risk event.',
	},
};

export const FAST_TRACK_RISK_CARDS = [
	{
		id: 'audit',
		title: 'Audit',
		description: 'Lose half of your Fast Track cash.',
		effect: 'halfCash',
	},
	{
		id: 'lawsuit',
		title: 'Lawsuit',
		description: 'Lose all of your Fast Track cash.',
		effect: 'loseAllCash',
	},
	{
		id: 'divorce',
		title: 'Divorce',
		description: 'Lose all of your Fast Track cash.',
		effect: 'loseAllCash',
	},
];

const deckSpaces = new Map(
	(fastTrackData?.fasttrack?.spaces || []).map((space) => [
		space.id,
		{
			...space,
			type: space.type,
			title: space.title,
			description: space.copy1 || '',
			subtitle: space.copy2 || '',
			cost: space.cost || 0,
			cashFlow: space.cashflow || 0,
			reward: space.reward || 0,
			rollMin: space.rollmin || null,
		},
	])
);

export const FAST_TRACK_SPACES = Array.from({ length: 48 }, (_, id) => {
	if (deckSpaces.has(id)) {
		return deckSpaces.get(id);
	}
	return SPECIAL_SPACE_BY_ID[id];
});

export const FAST_TRACK_DREAMS = FAST_TRACK_SPACES.filter((space) => space.type === 'dream');
