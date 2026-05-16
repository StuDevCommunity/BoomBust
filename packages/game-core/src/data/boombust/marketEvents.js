/** @type {import('../../boombust/types.js').GameEventDefinition[]} */
export const marketEventDefinitions = [
	{
		id: 'cheap-credit-rally',
		title: 'Cheap Credit Rally',
		description: 'Banks bid higher as easy money returns to the table.',
		weight: 3,
		selector: { sector: 'finance' },
		effect: { type: 'multiply', value: 1.25 },
	},
	{
		id: 'retail-shelf-shock',
		title: 'Retail Shelf Shock',
		description: 'A demand miss hits storefront stocks before investors can react.',
		weight: 2,
		selector: { sector: 'retail' },
		effect: { type: 'add', value: -4 },
	},
	{
		id: 'factory-delay',
		title: 'Factory Delay',
		description: 'Industrial output wobbles and prices slide within a controlled range.',
		weight: 2,
		selector: { sector: 'industrial' },
		effect: { type: 'randomDelta', min: -5, max: 2 },
	},
];
