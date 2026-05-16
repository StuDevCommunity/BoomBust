import { marketEventDefinitions } from '../data/boombust/marketEvents.js';
import { getStageDefinition } from './stageEngine.js';
import { applyStockPriceEffect } from './stockMarketEngine.js';

export function drawMarketEventForStage(stageId, random) {
	const stage = getStageDefinition(stageId);
	const pool = marketEventDefinitions.filter((event) => stage.eventPool.includes(event.id));
	if (!pool.length) return null;

	const totalWeight = pool.reduce((sum, event) => sum + Math.max(1, Number(event.weight || 1)), 0);
	let roll = random?.Die ? random.Die(totalWeight) : 1;

	for (const event of pool) {
		roll -= Math.max(1, Number(event.weight || 1));
		if (roll <= 0) return event;
	}

	return pool[pool.length - 1];
}

export function applyMarketEvent(G, event, { playerID, turn, random, timestamp, id }) {
	if (!event || !G.stockMarket) return null;

	const stageId = G.stage?.currentStageId;
	const results = applyStockPriceEffect(G.stockMarket, event, turn, random);
	const entry = {
		id,
		eventId: event.id,
		stageId,
		title: event.title,
		description: event.description,
		turn,
		timestamp,
		results,
	};

	G.eventLog = [...(G.eventLog || []), entry].slice(-30);
	G.contextModal = {
		kind: 'marketEvent',
		title: event.title,
		subtitle: getStageDefinition(stageId).title,
		description: event.description,
		mood: 'volatile',
		results,
	};
	G.gameLog.push({
		type: 'market',
		playerID,
		message: `${event.title}: ${results.map((result) => `${result.symbol} $${result.before} -> $${result.after}`).join(', ')}`,
		timestamp,
		meta: { boombustEvent: true, eventId: event.id, results },
	});

	return entry;
}
