import {
	INVALID_MOVE,
	TurnOrder,
} from 'boardgame.io/dist/esm/core.js';
import { defaultDataset } from '@boombust/game-core/domain/datasets';
import {
	applyBankLoan,
	calcPayday,
	calcPassiveIncome,
	calcTotalExpenses,
	canEscapeRatRace,
} from '@boombust/game-core/domain/finance/financeService';
import {
	assetMatchesKey,
	createGameId,
	createMarketPrompt,
	createDoodadPrompt,
} from '@boombust/game-core/domain/effects';
import {
	FAST_TRACK_RISK_CARDS,
	FAST_TRACK_SPACES,
} from '@boombust/game-core/fastTrackConfig';
import { createInitialStageState } from '@boombust/game-core/boombust/stageEngine';
import { createInitialStockMarketState } from '@boombust/game-core/boombust/stockMarketEngine';
import {
	applyMarketEvent,
	drawMarketEventForStage,
} from '@boombust/game-core/boombust/marketEventEngine';
import {
	resolveFastTrackLanding,
	resolveRatRaceLanding,
} from '@boombust/game-core/domain/board/tileResolutionService';
import { createBoardgameMoves } from './moveAdapter.js';

const FAST_TRACK_TARGET_INCREASE = 50000;
const CHILD_LIMIT = 3;

const PROFESSIONS = defaultDataset.careers.professions;

function randomFrom(items, random) {
	if (!Array.isArray(items) || items.length === 0) return null;
	const index = random?.Die ? random.Die(items.length) - 1 : 0;
	return items[index];
}

function createTimestamp() {
	return Date.now();
}

function createNotice(type, message) {
	return {
		type,
		message,
		timestamp: createTimestamp(),
	};
}

function setPlayerNotice(player, type, message) {
	player.notice = createNotice(type, message);
}

function clearPlayerNotice(player) {
	player.notice = null;
}

function drawCard(deck, random) {
	return randomFrom(deck, random);
}

function getSmallDeals() {
	return defaultDataset.deals.small?.smalldealDeck?.cards || [];
}

function getBigDeals() {
	return defaultDataset.deals.big?.bigdealDeck?.cards || [];
}

function getMarketCards() {
	return defaultDataset.market.cards?.marketDeck?.cards || [];
}

function getDoodadCards() {
	return defaultDataset.doodads?.doodadDeck?.cards || [];
}

function calcFastTrackIncomeGoal(player) {
	return (player.fastTrackBaseIncome || 0) + FAST_TRACK_TARGET_INCREASE;
}

let fallbackIdSequence = 0;

function getPromptId(prefix = 'prompt') {
	fallbackIdSequence += 1;
	return `${prefix}-${createTimestamp()}-${fallbackIdSequence}`;
}

function getPlayerLabel(G, playerID) {
	return G?.playerNames?.[playerID] || `Player ${parseInt(playerID, 10) + 1}`;
}

function queuePlayerPrompt(player, prompt) {
	player.pendingPrompts.push({
		...prompt,
		id: prompt.id || getPromptId(prompt.kind || 'prompt'),
		createdAt: createTimestamp(),
	});
}

function getCurrentPrompt(player) {
	return player.pendingPrompts?.[0] || null;
}

function removeCurrentPrompt(player) {
	if (player.pendingPrompts?.length) {
		player.pendingPrompts.shift();
	}
}

function getLiquidationValue(asset) {
	const base = asset.downPayment || asset.purchasePrice || 0;
	return Math.max(0, Math.round(base * 0.5));
}

function _getLiabilityClearAmount(player, liabilityKey) {
	return player.liabilities?.[liabilityKey] || 0;
}

function getPayoffCandidates(player) {
	return Object.entries(player.liabilities || {}).filter(([, value]) => value > 0);
}

function coverMandatoryShortfall(G, playerID, amount, reason) {
	const player = G.players[playerID];
	if (!player || amount <= (player.cash || 0)) return 0;

	const borrowedAmount = applyBankLoan(player, amount - (player.cash || 0));
	if (borrowedAmount > 0) {
		G.gameLog.push({
			type: 'loan',
			playerID,
			message: `${getPlayerLabel(G, playerID)} auto-borrowed $${borrowedAmount.toLocaleString()} to cover ${reason}.`,
			timestamp: createTimestamp(),
		});
	}
	return borrowedAmount;
}

function payMandatoryAmount(G, playerID, amount, reason) {
	const player = G.players[playerID];
	if (!player || amount <= 0) return 0;

	coverMandatoryShortfall(G, playerID, amount, reason);
	player.cash = Math.max(0, (player.cash || 0) - amount);
	return amount;
}

function eliminatePlayer(G, playerID, message) {
	const player = G.players[playerID];
	if (!player || player.eliminated) return;

	player.eliminated = true;
	player.pendingPrompts = [];
	player.notice = createNotice('error', 'You are out of the game.');
	G.turnOrder = G.turnOrder.filter((id) => id !== playerID);
	G.gameLog.push({
		type: 'bankrupt',
		playerID,
		message,
		timestamp: createTimestamp(),
	});
}

function syncBankruptcyState(G, playerID) {
	const player = G.players[playerID];
	if (!player || player.isFastTrack || player.eliminated) return;

	player.isBankrupt = calcPayday(player) < 0;
	if (!player.isBankrupt) {
		player.bankruptcyStage = null;
		return;
	}

	player.bankruptcyStage = 'resolving';
	if ((player.assets || []).length === 0 && getPayoffCandidates(player).length === 0) {
		eliminatePlayer(
			G,
			playerID,
			`${getPlayerLabel(G, playerID)} is bankrupt and has no assets left to liquidate.`
		);
	}
}

function maybeDeclareWinner(G, playerID) {
	const player = G.players[playerID];
	if (!player || player.eliminated) return;

	if (player.isFastTrack && player.fastTrackIncomeCurrent >= calcFastTrackIncomeGoal(player)) {
		G.winner = playerID;
		G.gameLog.push({
			type: 'victory',
			playerID,
			message: `${getPlayerLabel(G, playerID)} won by growing Fast Track income by $50,000.`,
			timestamp: createTimestamp(),
		});
	}
}

function awardRatRacePayday(G, playerID, multiplier = 1) {
	const player = G.players[playerID];
	const paydayAmount = calcPayday(player) * multiplier;
	if (paydayAmount >= 0) {
		player.cash += paydayAmount;
	} else {
		payMandatoryAmount(G, playerID, Math.abs(paydayAmount), 'negative cash flow');
	}
	G.gameLog.push({
		type: 'payday',
		playerID,
		message: `${getPlayerLabel(G, playerID)} received payday: $${paydayAmount.toLocaleString()}.`,
		timestamp: createTimestamp(),
	});
}

function collectFastTrackCashFlowDay(G, playerID) {
	const player = G.players[playerID];
	player.fastTrackCash += player.fastTrackIncomeCurrent;
	G.gameLog.push({
		type: 'payday',
		playerID,
		message: `${getPlayerLabel(G, playerID)} collected Fast Track income: $${player.fastTrackIncomeCurrent.toLocaleString()}.`,
		timestamp: createTimestamp(),
	});
}

function applyRiskCard(G, playerID, random) {
	const player = G.players[playerID];
	const riskCard = drawCard(FAST_TRACK_RISK_CARDS, random);
	if (!riskCard) return;

	if (riskCard.effect === 'halfCash') {
		player.fastTrackCash = Math.floor(player.fastTrackCash / 2);
	}

	if (riskCard.effect === 'loseAllCash') {
		player.fastTrackCash = 0;
	}

	G.gameLog.push({
		type: 'loss',
		playerID,
		message: `${getPlayerLabel(G, playerID)} hit Fast Track risk: ${riskCard.title}.`,
		timestamp: createTimestamp(),
	});
}

function enterFastTrack(G, playerID) {
	const player = G.players[playerID];
	const passiveIncome = calcPassiveIncome(player);
	player.isFastTrack = true;
	player.fastTrackPosition = 0;
	player.fastTrackBaseIncome = passiveIncome;
	player.fastTrackIncomeCurrent = passiveIncome;
	player.fastTrackPassiveIncome = passiveIncome;
	player.fastTrackCash = passiveIncome * 100;
	player.fastTrackCharityActive = false;
	player.pendingPrompts = [];

	G.currentDeal = null;
	G.currentDoodad = null;
	G.currentFastTrackSpace = null;

	G.gameLog.push({
		type: 'victory',
		playerID,
		message: `${getPlayerLabel(G, playerID)} escaped the Rat Race with $${player.fastTrackCash.toLocaleString()} Fast Track cash.`,
		timestamp: createTimestamp(),
	});
}

function createPlayerState(profession) {
	const totalExpenses = Object.values(profession.expenses).reduce((sum, value) => sum + value, 0);
	const payday = profession.salary - totalExpenses;
	const startingCash = (profession.assets?.savings || 0) + payday;

	return {
		profession,
		salary: profession.salary,
		cash: startingCash,
		savings: profession.assets?.savings || 0,
		childCount: 0,
		position: 0,
		expenses: { ...profession.expenses },
		perChildExpense: profession.perChildExpense || 0,
		assets: [],
		liabilities: { ...profession.liabilities },
		paidOffLiabilities: [],
		isFastTrack: false,
		fastTrackPosition: 0,
		fastTrackCash: 0,
		fastTrackBaseIncome: 0,
		fastTrackIncomeCurrent: 0,
		fastTrackPassiveIncome: 0,
		fastTrackCharityActive: false,
		charityTurns: 0,
		downsizeTurns: 0,
		doublesCount: 0,
		isSetup: true,
		pendingPrompts: [],
		receivables: [],
		isBankrupt: false,
		bankruptcyStage: null,
		notice: null,
		eliminated: false,
	};
}

function setupGame({ ctx, random }) {
	const players = {};
	const shuffledProfessions = random?.Shuffle ? random.Shuffle(PROFESSIONS) : [...PROFESSIONS];

	for (let index = 0; index < ctx.numPlayers; index += 1) {
		players[String(index)] = createPlayerState(
			shuffledProfessions[index % shuffledProfessions.length]
		);
	}

	const turnOrder = random?.Shuffle ? random.Shuffle(Object.keys(players)) : Object.keys(players);
	const stage = createInitialStageState();

	return {
		players,
		stage,
		contextModal: stage.contextModal,
		stockMarket: createInitialStockMarketState(),
		eventLog: [],
		board: defaultDataset.board.ratRaceTiles,
		fastTrackBoard: FAST_TRACK_SPACES,
		dice: { value: null, die1: null, die2: null, die3: null, isDoubles: false, numDice: 0 },
		currentDeal: null,
		currentDoodad: null,
		currentFastTrackSpace: null,
		isSelectingDeal: false,
		gameLog: [],
		winner: null,
		turnOrder,
		playerNames: {}, // { playerID: 'nickname' }
		disconnectTimestamps: {}, // Track when players disconnect
		kickedPlayers: {}, // Track players who have been kicked
		nextSequence: 0,
	};
}

function queueGlobalStockOffer(G, playerID, card, options = {}) {
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

	G.gameLog.push({
		type: 'market',
		playerID,
		message: `${card.title} is now available to ${queued} player${queued === 1 ? '' : 's'}.`,
		timestamp: createTimestamp(),
	});
}

function applyStartupMarketBoost(G, playerID, card) {
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

	G.gameLog.push({
		type: 'market',
		playerID,
		message: `${card.title} increased startup cash flow by $${boostAmount.toLocaleString()} on ${affectedAssets} business${affectedAssets === 1 ? '' : 'es'}.`,
		timestamp: createTimestamp(),
	});
}

function applyImmediateMarketLoss(G, playerID, card) {
	const player = G.players[playerID];
	const beforeCount = (player.assets || []).length;
	player.assets = (player.assets || []).filter((asset) => !assetMatchesKey(asset, card.key));
	const lostCount = beforeCount - player.assets.length;

	G.gameLog.push({
		type: 'market',
		playerID,
		message:
			lostCount > 0
				? `${getPlayerLabel(G, playerID)} lost ${lostCount} asset${lostCount === 1 ? '' : 's'} to ${card.title}.`
				: `${card.title} had no effect on ${getPlayerLabel(G, playerID)}.`,
		timestamp: createTimestamp(),
	});
}

function drawBoombustMarketEvent(G, playerID, random, ctx) {
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

function drawRatRaceMarketCard(G, playerID, random, ctx) {
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
			G.gameLog.push({
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

			G.gameLog.push({
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
			G.gameLog.push({
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

function drawDoodadPrompt(G, playerID, random) {
	const player = G.players[playerID];
	const card = drawCard(getDoodadCards(), random);
	const prompt = createDoodadPrompt(player, card);

	if (!prompt) {
		G.gameLog.push({
			type: 'doodad',
			playerID,
			message: `${card?.title || 'Doodad'} had no effect on ${getPlayerLabel(G, playerID)}.`,
			timestamp: createTimestamp(),
		});
		return null;
	}

	queuePlayerPrompt(player, prompt);
	G.gameLog.push({
		type: 'doodad',
		playerID,
		message: `${getPlayerLabel(G, playerID)} drew doodad: ${prompt.title}.`,
		timestamp: createTimestamp(),
	});
	return prompt;
}

function handleRatRaceLanding(G, playerID, tile, random, ctx) {
	return resolveRatRaceLanding(
		{ G, playerID, tile, random, ctx },
		{
			childLimit: CHILD_LIMIT,
			createTimestamp,
			drawBoombustMarketEvent,
			drawDoodadPrompt,
			drawRatRaceMarketCard,
			getPlayerLabel,
			getPromptId,
			payMandatoryAmount,
			syncBankruptcyState,
		}
	);
}

function handleFastTrackLanding(G, playerID, space, random) {
	return resolveFastTrackLanding(
		{ G, playerID, space, random },
		{
			applyRiskCard,
			collectFastTrackCashFlowDay,
		}
	);
}

function advanceReceivables(player) {
	if (!player.receivables?.length) return;

	const remaining = [];
	player.receivables.forEach((receivable) => {
		const nextTurns = (receivable.turnsRemaining || 0) - 1;
		if (nextTurns <= 0) {
			player.cash += receivable.payoutCash || 0;
			if (receivable.expensePenalty) {
				player.expenses.other = Math.max(0, (player.expenses.other || 0) - receivable.expensePenalty);
			}
			return;
		}
		remaining.push({
			...receivable,
			turnsRemaining: nextTurns,
		});
	});

	player.receivables = remaining;
}

function checkDisconnectedPlayers(G) {
	if (!G.disconnectTimestamps) G.disconnectTimestamps = {};
	if (!G.kickedPlayers) G.kickedPlayers = {};

	const TIMEOUT_MS = 60000;
	const now = Date.now();

	Object.entries(G.disconnectTimestamps).forEach(([playerID, disconnectTime]) => {
		if (now - disconnectTime >= TIMEOUT_MS && !G.kickedPlayers[playerID]) {
			const playerName = G.playerNames?.[playerID] || `Player ${parseInt(playerID, 10) + 1}`;
			G.kickedPlayers[playerID] = true;
			delete G.disconnectTimestamps[playerID];
			eliminatePlayer(G, playerID, `${playerName} was kicked for being disconnected too long.`);
			G.gameLog.push({
				type: 'kick',
				playerID,
				message: `${playerName} was kicked due to inactivity (60s timeout).`,
				timestamp: createTimestamp(),
			});
		}
	});
}

const commandDeps = {
	invalidMove: INVALID_MOVE,
	awardRatRacePayday,
	checkDisconnectedPlayers,
	clearPlayerNotice,
	createTimestamp,
	drawCard,
	eliminatePlayer,
	enterFastTrack,
	getBigDeals,
	getCurrentPrompt,
	getLiquidationValue,
	getPlayerLabel,
	getPromptId,
	getSmallDeals,
	handleFastTrackLanding,
	handleRatRaceLanding,
	maybeDeclareWinner,
	queueGlobalStockOffer,
	removeCurrentPrompt,
	setPlayerNotice,
	syncBankruptcyState,
};

const moves = createBoardgameMoves(commandDeps);

export const BoombustGame = {
	name: 'boombust',
	setup: setupGame,
	moves,
	phases: {
		mainPlay: {
			start: true,
			turn: {
				order: TurnOrder.CUSTOM_FROM('turnOrder'),
				onBegin: ({ G, ctx, events }) => {
					const playerID = ctx.currentPlayer;
					const player = G.players[playerID];
					if (!player || player.eliminated) {
						events.endTurn();
						return;
					}

					checkDisconnectedPlayers(G);

					advanceReceivables(player);
					syncBankruptcyState(G, playerID);
					if (player.eliminated) {
						events.endTurn();
						return;
					}

					if (!player.isFastTrack && player.downsizeTurns > 0 && getCurrentPrompt(player)?.kind !== 'downsizeSkip') {
						queuePlayerPrompt(player, {
							kind: 'downsizeSkip',
							title: 'Downsized',
							description: `You lose this turn because of Downsize. ${player.downsizeTurns} turn(s) remain.`,
							remainingTurns: player.downsizeTurns,
						});
					}
				},
			},
		},
	},
	endIf: ({ G }) => {
		if (G.winner) return { winner: G.winner };
		return undefined;
	},

	// Handle player disconnect - save their nickname and start timeout
	onLeave: ({ G, playerID }) => {
		if (!G.disconnectTimestamps) G.disconnectTimestamps = {};
		if (!G.kickedPlayers) G.kickedPlayers = {};
		
		// Save nickname if it exists
		const playerName = G.playerNames?.[playerID];
		if (playerName && !G.kickedPlayers[playerID]) {
			G.disconnectTimestamps[playerID] = Date.now();
			G.gameLog.push({
				type: 'disconnect',
				playerID,
				message: `${playerName} has disconnected. Will be kicked in 60 seconds if not reconnected.`,
				timestamp: createTimestamp(),
			});
		}
	},
};

export {
	calcPayday,
	calcPassiveIncome,
	calcTotalExpenses,
	canEscapeRatRace,
};
