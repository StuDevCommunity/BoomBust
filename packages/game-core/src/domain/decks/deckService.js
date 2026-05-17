import { defaultDataset } from '../datasets/datasetRegistry.js';

export function randomFrom(items, random) {
	if (!Array.isArray(items) || items.length === 0) return null;
	const index = random?.Die ? random.Die(items.length) - 1 : 0;
	return items[index];
}

export function drawCard(deck, random) {
	return randomFrom(deck, random);
}

export function getSmallDeals(dataset = defaultDataset) {
	return dataset.deals.small?.smalldealDeck?.cards || [];
}

export function getBigDeals(dataset = defaultDataset) {
	return dataset.deals.big?.bigdealDeck?.cards || [];
}

export function getMarketCards(dataset = defaultDataset) {
	return dataset.market.cards?.marketDeck?.cards || [];
}

export function getDoodadCards(dataset = defaultDataset) {
	return dataset.doodads?.doodadDeck?.cards || [];
}
