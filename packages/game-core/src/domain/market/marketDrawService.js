import {
	applyMarketEvent,
	drawMarketEventForStage,
} from '../../boombust/marketEventEngine.js';
import { createGameId } from '../effects/dealEffects.js';
import { assetMatchesKey } from '../effects/marketEffects.js';
import { drawCard, getDoodadCards, getMarketCards } from '../decks/deckService.js';
import { createTimestamp } from '../events/eventFactory.js';
import { appendGameLog } from '../events/gameLogService.js';
import { createDoodadPrompt, createMarketPrompt } from '../prompts/promptFactory.js';
import { queuePlayerPrompt } from '../prompts/promptQueueService.js';
import { getPlayerLabel } from '../players/playerLabelService.js';

export function queueGlobalStockOffer(G, playerID, card, options = {}) {
	const prompt = createMarketPrompt(card, {
		stockLike: true,
		allowUnits: true,
		allowBuy: false,
		...options,
	});
	const allowBuyForAll = card.type === 'anystock' || options.allowBuyForAll;

	let queued = 0;
	Object.entries(G.players).forEach(([targetID, targetPlayer]) => {
		if (targetPlayer.eliminated) return;
		const hasMatchingAsset = (targetPlayer.assets || []).some((asset) => asset.key === card.key);
		const allowBuy = allowBuyForAll || targetID === playerID;

		if (!hasMatchingAsset && !allowBuy) return;

		queuePlayerPrompt(targetPlayer, {
			...prompt,
			sourcePlayerID: playerID,
			allowBuy,
			allowSell: hasMatchingAsset,
		});
		queued += 1;
	});

	appendGameLog(G, {
		type: 'market',
		playerID,
		message: `${card.title} is now available to ${queued} player${queued === 1 ? '' : 's'}.`,
		timestamp: createTimestamp(),
	});
}

export function applyStartupMarketBoost(G, playerID, card) {
	const boostAmount = Number(card.key || card.cost || 0);
	let affectedAssets = 0;

	Object.values(G.players).forEach((player) => {
		player.assets = (player.assets || []).map((asset) => {
			if (!asset.isStartup) return asset;
			affectedAssets += 1;
			return {
				...asset,
				cashFlow: (asset.cashFlow || 0) + boostAmount,
			};
		});
	});

	appendGameLog(G, {
		type: 'market',
		playerID,
		message: `${card.title} increased startup cash flow by $${boostAmount.toLocaleString()} on ${affectedAssets} business${affectedAssets === 1 ? '' : 'es'}.`,
		timestamp: createTimestamp(),
	});
}

export function applyImmediateMarketLoss(G, playerID, card) {
	const player = G.players[playerID];
	const beforeCount = (player.assets || []).length;
	player.assets = (player.assets || []).filter((asset) => !assetMatchesKey(asset, card.key));
	const lostCount = beforeCount - player.assets.length;

	appendGameLog(G, {
		type: 'market',
		playerID,
		message:
			lostCount > 0
				? `${getPlayerLabel(G, playerID)} lost ${lostCount} asset${lostCount === 1 ? '' : 's'} to ${card.title}.`
				: `${card.title} had no effect on ${getPlayerLabel(G, playerID)}.`,
		timestamp: createTimestamp(),
	});
}

export function drawBoombustMarketEvent(G, playerID, random, ctx) {
	const boombustEvent = drawMarketEventForStage(G.stage?.currentStageId, random);
	if (!boombustEvent) return null;

	return applyMarketEvent(G, boombustEvent, {
		playerID,
		turn: ctx?.turn || 0,
		random,
		timestamp: createTimestamp(),
		id: createGameId(G, 'market-event'),
	});
}

export function drawRatRaceMarketCard(G, playerID, random, ctx) {
	const card = drawCard(getMarketCards(), random);
	drawBoombustMarketEvent(G, playerID, random, ctx);
	if (!card) return null;

	if (card.type === 'startup') {
		applyStartupMarketBoost(G, playerID, card);
		return null;
	}

	if (card.type === 'lose') {
		applyImmediateMarketLoss(G, playerID, card);
		return null;
	}

	if (card.type === 'fee' || card.type === 'brother') {
		const player = G.players[playerID];
		const hasMatchingAsset = (player.assets || []).some((asset) => assetMatchesKey(asset, card.key));
		if (!hasMatchingAsset) {
			appendGameLog(G, {
				type: 'market',
				playerID,
				message: `${card.title} had no effect on ${getPlayerLabel(G, playerID)}.`,
				timestamp: createTimestamp(),
			});
			return null;
		}

		queuePlayerPrompt(
			player,
			createMarketPrompt(card, {
				sourcePlayerID: playerID,
				allowSell: card.type !== 'fee',
				allowBuy: false,
			})
		);
		return card;
	}

	if (card.type === 'sell' || card.type === 'sellmultiply' || card.type === 'selladd') {
		if (card.queue === 'true' || card.queue === true) {
			let queued = 0;
			Object.entries(G.players).forEach(([, player]) => {
				if (player.eliminated) return;
				const hasMatchingAsset = (player.assets || []).some((asset) => assetMatchesKey(asset, card.key));
				if (!hasMatchingAsset) return;
				queuePlayerPrompt(player, createMarketPrompt(card, { allowSell: true, allowBuy: false }));
				queued += 1;
			});

			appendGameLog(G, {
				type: 'market',
				playerID,
				message:
					queued > 0
						? `${card.title} opened sale offers for ${queued} player${queued === 1 ? '' : 's'}.`
						: `${card.title} found no matching assets on the table.`,
				timestamp: createTimestamp(),
			});
			return card;
		}

		const player = G.players[playerID];
		const hasMatchingAsset = (player.assets || []).some((asset) => assetMatchesKey(asset, card.key));
		if (!hasMatchingAsset) {
			appendGameLog(G, {
				type: 'market',
				playerID,
				message: `${card.title} had no effect on ${getPlayerLabel(G, playerID)}.`,
				timestamp: createTimestamp(),
			});
			return null;
		}

		queuePlayerPrompt(
			player,
			createMarketPrompt(card, {
				sourcePlayerID: playerID,
				allowSell: true,
				allowBuy: false,
			})
		);
		return card;
	}

	return null;
}

export function drawDoodadPrompt(G, playerID, random) {
	const player = G.players[playerID];
	const card = drawCard(getDoodadCards(), random);
	const prompt = createDoodadPrompt(player, card);

	if (!prompt) {
		appendGameLog(G, {
			type: 'doodad',
			playerID,
			message: `${card?.title || 'Doodad'} had no effect on ${getPlayerLabel(G, playerID)}.`,
			timestamp: createTimestamp(),
		});
		return null;
	}

	queuePlayerPrompt(player, prompt);
	appendGameLog(G, {
		type: 'doodad',
		playerID,
		message: `${getPlayerLabel(G, playerID)} drew doodad: ${prompt.title}.`,
		timestamp: createTimestamp(),
	});
	return prompt;
}
