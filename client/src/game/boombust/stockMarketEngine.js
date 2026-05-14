import { stockDefinitions } from '../../data/boombust/stocks.js';

export function createInitialStockMarketState() {
	return {
		watchlist: stockDefinitions.map((stock) => stock.symbol),
		stocks: Object.fromEntries(
			stockDefinitions.map((stock) => [
				stock.symbol,
				{
					symbol: stock.symbol,
					price: stock.startingPrice,
					history: [],
				},
			])
		),
	};
}

export function getStockDefinition(symbol) {
	return stockDefinitions.find((stock) => stock.symbol === symbol) || null;
}

export function selectStocks(stockMarket, selector) {
	const stockEntries = Object.values(stockMarket?.stocks || {});
	if (selector?.symbol) {
		return stockEntries.filter((stock) => stock.symbol === selector.symbol);
	}
	if (selector?.sector) {
		return stockEntries.filter((stock) => getStockDefinition(stock.symbol)?.sector === selector.sector);
	}
	return stockEntries;
}

export function applyStockPriceEffect(stockMarket, event, turn, random) {
	const selectedStocks = selectStocks(stockMarket, event.selector);
	return selectedStocks.map((stock) => {
		const before = stock.price;
		const after = calculateNextPrice(before, event.effect, random);
		stock.price = after;
		stock.history = [
			...(stock.history || []),
			{
				turn,
				eventId: event.id,
				before,
				after,
			},
		].slice(-12);

		return {
			symbol: stock.symbol,
			before,
			after,
			delta: after - before,
		};
	});
}

function calculateNextPrice(price, effect, random) {
	const current = Number(price || 0);
	let next = current;

	if (effect.type === 'set') {
		next = Number(effect.value || 0);
	}

	if (effect.type === 'add') {
		next = current + Number(effect.value || 0);
	}

	if (effect.type === 'multiply') {
		next = current * Number(effect.value || 1);
	}

	if (effect.type === 'randomDelta') {
		const min = Number(effect.min || 0);
		const max = Number(effect.max || 0);
		const span = Math.max(0, max - min);
		const roll = random?.Die ? random.Die(span + 1) - 1 : 0;
		next = current + min + roll;
	}

	return Math.max(1, Math.round(next));
}
