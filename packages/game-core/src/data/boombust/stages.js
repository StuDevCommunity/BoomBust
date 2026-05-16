/** @type {import('../../boombust/types.js').StageDefinition[]} */
export const stageDefinitions = [
	{
		id: 'opening-bell',
		title: 'Opening Bell',
		subtitle: 'A bright market with brittle confidence',
		description:
			'Money is moving, lenders are friendly, and players can still read the tape before the bigger swings arrive.',
		mood: 'optimistic',
		triggers: ['gameStart', 'marketTile'],
		eventPool: ['cheap-credit-rally', 'retail-shelf-shock', 'factory-delay'],
	},
];
