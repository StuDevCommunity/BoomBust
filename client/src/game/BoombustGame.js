import {
	ActivePlayers,
	INVALID_MOVE,
	TurnOrder,
} from 'boardgame.io/dist/esm/core.js';
import boardTiles, { TILE_TYPES } from './boardTiles.js';
import smallDeals from '../data/smalldeal.json' with { type: 'json' };
import bigDeals from '../data/bigdeal.json' with { type: 'json' };
import marketCards from '../data/market.json' with { type: 'json' };
import doodadCards from '../data/doodads.json' with { type: 'json' };
import careersData from '../data/careers.json' with { type: 'json' };
import {
	EXPENSE_TO_LIABILITY_KEY,
	LIABILITY_TO_EXPENSE_KEY,
} from './financeConfig.js';
import {
	FAST_TRACK_RISK_CARDS,
	FAST_TRACK_SPACES,
} from './fastTrackConfig.js';
import { createInitialStageState } from './boombust/stageEngine.js';
import { createInitialStockMarketState } from './boombust/stockMarketEngine.js';
import {
	applyMarketEvent,
	drawMarketEventForStage,
} from './boombust/marketEventEngine.js';

const BANK_LOAN_STEP = 1000;
const BANK_LOAN_PAYMENT_PER_STEP = 100;
const FAST_TRACK_TARGET_INCREASE = 50000;
const CHILD_LIMIT = 3;
const RAT_RACE_TILE_COUNT = boardTiles.length;
const FAST_TRACK_TILE_COUNT = FAST_TRACK_SPACES.length;

const PROFESSIONS = careersData.careers.careerData.map((career) => ({
	id: career.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
	title: career.title,
	salary: career.salary,
	expenses: {
		taxes: career.taxes,
		homeMortgage: career.mortgagePayment,
		schoolLoan: career.schoolLoanPayment,
		carLoan: career.carLoanPayment,
		creditCard: career.creditCardPayment,
		retail: career.retailPayment,
		bankLoanPayment: 0,
		boatPayment: 0,
		other: career.otherExpenses,
	},
	liabilities: {
		homeMortgage: career.mortgageLiability,
		schoolLoans: career.schoolLoanLiability,
		carLoans: career.carLoanLiability,
		creditCards: career.creditCardLiability,
		retail: career.retailDebtLiability,
		bankLoan: 0,
		boatLoan: 0,
	},
	assets: { savings: career.savings },
	perChildExpense: career.childPerExpense,
}));

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
	return smallDeals?.smalldealDeck?.cards || [];
}

function getBigDeals() {
	return bigDeals?.bigdealDeck?.cards || [];
}

function getMarketCards() {
	return marketCards?.marketDeck?.cards || [];
}

function getDoodadCards() {
	return doodadCards?.doodadDeck?.cards || [];
}

function calcBaseExpenses(player) {
	return Object.entries(player.expenses || {}).reduce((sum, [expenseKey, value]) => {
		const liabilityKey = EXPENSE_TO_LIABILITY_KEY[expenseKey];
		if (liabilityKey && (player.paidOffLiabilities || []).includes(liabilityKey)) {
			return sum;
		}
		return sum + (value || 0);
	}, 0);
}

function calcChildExpenses(player) {
	return (player.childCount || 0) * (player.perChildExpense || 0);
}

function calcTotalExpenses(player) {
	return calcBaseExpenses(player) + calcChildExpenses(player);
}

function calcPassiveIncome(player) {
	return (player.assets || []).reduce(
		(sum, asset) => sum + (asset.cashFlow || 0) * (asset.units || 1),
		0
	);
}

function calcTotalIncome(player) {
	return (player.salary || 0) + calcPassiveIncome(player);
}

function calcPayday(player) {
	return calcTotalIncome(player) - calcTotalExpenses(player);
}

function calcFastTrackIncomeGoal(player) {
	return (player.fastTrackBaseIncome || 0) + FAST_TRACK_TARGET_INCREASE;
}

function canEscapeRatRace(player) {
	return calcPassiveIncome(player) > calcTotalExpenses(player);
}

function isStockLikeDeal(deal) {
	return deal.type === 'anystock' || deal.type === 'stock';
}

function isStockEventCard(deal) {
	return deal.type === 'stock' && Number(deal.cost || 0) < 0;
}

function normalizeDeal(rawDeal, deckType) {
	if (!rawDeal) return null;
	return {
		...rawDeal,
		dealType: deckType,
		type: rawDeal.type || 'property',
		title: rawDeal.title || 'Deal Opportunity',
		description: rawDeal.copy1 || rawDeal.description || '',
		subtitle: rawDeal.copy2 || '',
		key: rawDeal.key || rawDeal.symbol || rawDeal.title,
		cost: rawDeal.cost || 0,
		downPayment: rawDeal.downpay ?? rawDeal.downPayment ?? rawDeal.cost ?? 0,
		cashFlow: rawDeal.cashflow || rawDeal.cashFlow || 0,
		mortgage: rawDeal.mortgage || 0,
		units: rawDeal.units || 1,
		queue: rawDeal.queue === 'true',
		rule: rawDeal.rule || '',
	};
}

function createGameId(G, prefix = 'id') {
	G.nextSequence = (G.nextSequence || 0) + 1;
	return `${prefix}-${G.nextSequence}`;
}

function createAssetFromDeal(G, deal, quantity = 1) {
	const isStockLike = isStockLikeDeal(deal);
	const purchaseLots = isStockLike ? Math.max(1, quantity) : 1;
	const units = (deal.units || 1) * purchaseLots;
	return {
		id: createGameId(G, 'asset'),
		key: deal.key || deal.title,
		type: deal.type || 'property',
		name: deal.title || deal.description || 'Investment',
		cashFlow: deal.cashFlow || 0,
		purchasePrice: deal.cost || 0,
		downPayment: deal.downPayment || deal.cost || 0,
		mortgage:
			deal.mortgage || Math.max(0, (deal.cost || 0) - (deal.downPayment || deal.cost || 0)),
		units,
		purchaseLots,
		isStartup: deal.type === 'startup',
		isStockLike,
	};
}

function _cloneAsset(asset) {
	return {
		...asset,
	};
}

function assetMatchesKey(asset, key) {
	if (!asset || !key) return false;
	if (asset.key === key) return true;

	switch (key) {
		case 'PLEX':
			return ['DUPLEX', '4PLEX', '8PLEX'].includes(asset.key);
		case 'APTHOUSE':
			return asset.key === 'APTHOUSE';
		case 'rental':
			return ['2/1CONDO', '3/2HOUSE', 'DUPLEX', '4PLEX', '8PLEX', 'APTHOUSE', 'BED'].includes(asset.key);
		case 'gold':
			return asset.key === 'gold';
		case 'coin':
			return asset.key === 'coin';
		case 'cd':
			return asset.key === 'cd';
		case '8PLEX':
			return asset.key === '8PLEX';
		case '10ACRES':
			return asset.key === '10ACRES';
		case '20ACRES':
			return asset.key === '20ACRES';
		case 'widget':
			return asset.key === 'widget';
		case 'software':
			return asset.key === 'software';
		case 'CARWASH':
			return asset.key === 'CARWASH';
		case 'MALL':
			return asset.key === 'MALL';
		case 'PARTNER':
			return asset.key === 'PARTNER';
		case 'BED':
			return asset.key === 'BED';
		default:
			return false;
	}
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

function syncPaidOffLiability(player, liabilityKey) {
	if (!player.paidOffLiabilities.includes(liabilityKey)) {
		player.paidOffLiabilities.push(liabilityKey);
	}
	const expenseKey = LIABILITY_TO_EXPENSE_KEY[liabilityKey];
	if (expenseKey && expenseKey in player.expenses) {
		player.expenses[expenseKey] = 0;
	}
}

function clearPaidOffLiability(player, liabilityKey) {
	player.paidOffLiabilities = player.paidOffLiabilities.filter((key) => key !== liabilityKey);
}

function applyBankLoan(player, amount) {
	if (amount <= 0) return 0;

	const roundedAmount = Math.ceil(amount / BANK_LOAN_STEP) * BANK_LOAN_STEP;
	player.cash += roundedAmount;
	player.liabilities.bankLoan += roundedAmount;
	player.expenses.bankLoanPayment =
		(player.expenses.bankLoanPayment || 0) +
		(roundedAmount / BANK_LOAN_STEP) * BANK_LOAN_PAYMENT_PER_STEP;
	clearPaidOffLiability(player, 'bankLoan');
	return roundedAmount;
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
		board: boardTiles,
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

function applyStockEvent(G, card, playerID) {
	const multiplier = Number(card.cost) === -1 ? 2 : 0.5;
	let affectedShares = 0;

	Object.values(G.players).forEach((player) => {
		player.assets = (player.assets || []).flatMap((asset) => {
			if (!asset.isStockLike || asset.key !== card.key) {
				return [asset];
			}

			const nextUnits = Math.floor((asset.units || 0) * multiplier);
			const nextLots = Math.floor((asset.purchaseLots || asset.units || 0) * multiplier);

			if (nextUnits <= 0 || nextLots <= 0) {
				affectedShares += asset.units || 0;
				return [];
			}

			affectedShares += Math.abs(nextUnits - (asset.units || 0));
			return [
				{
					...asset,
					units: nextUnits,
					purchaseLots: nextLots,
				},
			];
		});
	});

	G.gameLog.push({
		type: 'market',
		playerID,
		message: `${card.title} affected ${card.key} holdings across the table.`,
		timestamp: createTimestamp(),
		meta: {
			stockEvent: true,
			affectedShares,
			cardKey: card.key,
		},
	});
}

function createMarketPrompt(baseCard, overrides = {}) {
	return {
		...baseCard,
		kind: 'market',
		title: baseCard.title,
		description: [baseCard.copy1, baseCard.copy2].filter(Boolean).join(' '),
		marketType: baseCard.type,
		key: baseCard.key,
		cost: Number(baseCard.cost || 0),
		cashFlow: Number(baseCard.cashflow || baseCard.cashFlow || 0),
		rule: baseCard.rule || '',
		queue: baseCard.queue === 'true' || baseCard.queue === true,
		...overrides,
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

function createDoodadPrompt(player, card) {
	if (!card) return null;

	const basePrompt = {
		kind: 'doodad',
		title: card.title,
		description: card.copy || '',
		cost: Number(card.cost || 0),
		payment: Number(card.payment || 0),
		child: card.child || null,
	};

	if (card.child === 'has' && (player.childCount || 0) === 0) {
		return null;
	}

	if (card.child === 'per') {
		if ((player.childCount || 0) === 0) {
			return null;
		}
		basePrompt.cost *= player.childCount || 0;
	}

	if (card.title === 'BUY BIG SCREEN TV') {
		return {
			...basePrompt,
			financeChoices: ['cash', 'credit'],
		};
	}

	if (card.title === 'NEW BOAT') {
		return {
			...basePrompt,
			financeChoices: ['cash', 'finance'],
			downPayment: 1000,
			financedAmount: 17000,
		};
	}

	return basePrompt;
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
	const player = G.players[playerID];
	if (!tile || !player) return;

	switch (tile.type) {
		case TILE_TYPES.DEAL:
			G.isSelectingDeal = true;
			break;
		case TILE_TYPES.MARKET:
			drawRatRaceMarketCard(G, playerID, random, ctx);
			break;
		case TILE_TYPES.DOODAD:
			drawDoodadPrompt(G, playerID, random);
			break;
		case TILE_TYPES.BABY:
			if ((player.childCount || 0) < CHILD_LIMIT) {
				player.childCount += 1;
				G.gameLog.push({
					type: 'baby',
					playerID,
					message: `${getPlayerLabel(G, playerID)} welcomed a child. Total children: ${player.childCount}.`,
					timestamp: createTimestamp(),
				});
				syncBankruptcyState(G, playerID);
			} else {
				G.gameLog.push({
					type: 'baby',
					playerID,
					message: `${getPlayerLabel(G, playerID)} is already at the child limit.`,
					timestamp: createTimestamp(),
				});
			}
			break;
		case TILE_TYPES.DOWNSIZE: {
			const expenseHit = calcTotalExpenses(player);
			player.downsizeTurns = 2;
			player.charityTurns = 0;
			payMandatoryAmount(G, playerID, expenseHit, 'Downsize expenses');
			G.gameLog.push({
				type: 'downsize',
				playerID,
				message: `${getPlayerLabel(G, playerID)} downsized and paid $${expenseHit.toLocaleString()} in expenses.`,
				timestamp: createTimestamp(),
			});
			syncBankruptcyState(G, playerID);
			break;
		}
		case TILE_TYPES.CHARITY: {
			const charityCost = Math.ceil(calcTotalIncome(player) * 0.1);
			G.currentDeal = {
				id: getPromptId('charity'),
				dealType: 'charity',
				isCharity: true,
				title: 'Charity',
				description: 'Donate 10% of your total income to roll 2 dice for your next 3 turns.',
				cost: charityCost,
				downPayment: charityCost,
				cashFlow: 0,
			};
			break;
		}
		case TILE_TYPES.FED_MEETING:
			drawBoombustMarketEvent(G, playerID, random, ctx);
			G.gameLog.push({
				type: 'market',
				playerID,
				message: `${getPlayerLabel(G, playerID)} reached the Fed Meeting. Macro policy is watching the market.`,
				timestamp: createTimestamp(),
			});
			break;
		case TILE_TYPES.BANKRUPTCY:
			G.gameLog.push({
				type: 'bankrupt',
				playerID,
				message: `${getPlayerLabel(G, playerID)} visited Bankruptcy Court. Full audit mechanics are not active yet.`,
				timestamp: createTimestamp(),
			});
			break;
		case TILE_TYPES.STORY:
			G.gameLog.push({
				type: 'story',
				playerID,
				message: `${getPlayerLabel(G, playerID)} hit a story beat in the ${G.stage?.currentStageId || 'current'} stage.`,
				timestamp: createTimestamp(),
			});
			break;
		default:
			break;
	}
}

function handleFastTrackLanding(G, playerID, space, random) {
	const player = G.players[playerID];
	if (!space || !player) return;

	if (space.type === 'cashflowDay') {
		collectFastTrackCashFlowDay(G, playerID);
		return;
	}

	if (space.type === 'risk') {
		applyRiskCard(G, playerID, random);
		return;
	}

	G.currentFastTrackSpace = {
		...space,
		description: [space.copy1, space.copy2].filter(Boolean).join(' '),
	};
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

function calculateNetSaleValue(asset, prompt, unitsToSell = null) {
	if (!asset || !prompt) return 0;

	const sellUnits = unitsToSell ?? asset.units ?? 1;
	const isStockAsset = asset.isStockLike || ['gold', 'coin', 'cd'].includes(asset.key);
	let grossValue = Number(prompt.cost || 0);

	if (prompt.marketType === 'sell') {
		if (['gold', 'coin', 'cd'].includes(asset.key) || asset.isStockLike) {
			grossValue = Number(prompt.cost || 0) * sellUnits;
		} else if (['PLEX', 'APTHOUSE'].includes(prompt.key)) {
			grossValue = Number(prompt.cost || 0) * sellUnits;
		}
	}

	if (prompt.marketType === 'selladd') {
		grossValue = Number(asset.purchasePrice || 0) + Number(prompt.cost || 0);
	}

	if (prompt.marketType === 'sellmultiply') {
		grossValue = Number(asset.purchasePrice || 0) * Number(prompt.cost || 0);
	}

	// For anystock / generic stock-like prompts (where prompt price is per-unit sell price)
	if (isStockAsset && !['sell', 'selladd', 'sellmultiply'].includes(prompt.marketType)) {
		grossValue = Number(prompt.cost || 0) * sellUnits;
	}

	if (isStockAsset) {
		return Math.max(0, grossValue);
	}

	const mortgageShare =
		sellUnits && (asset.units || 1) > 0
			? Math.round((Number(asset.mortgage || 0) * sellUnits) / (asset.units || 1))
			: Number(asset.mortgage || 0);

	return Math.max(0, grossValue - mortgageShare);
}

function applyAssetSale(player, assetId, saleValue, unitsToSell = null) {
	const assetIndex = (player.assets || []).findIndex((asset) => asset.id === assetId);
	if (assetIndex === -1) return null;

	const asset = player.assets[assetIndex];
	const sellUnits = unitsToSell ?? asset.units ?? 1;

	player.cash += saleValue;

	if ((asset.units || 1) <= sellUnits || !asset.isStockLike) {
		player.assets.splice(assetIndex, 1);
		return asset;
	}

	const remainingUnits = (asset.units || 0) - sellUnits;
	const remainingLots = Math.max(0, (asset.purchaseLots || asset.units || 0) - sellUnits);
	const mortgageShare = Math.round((Number(asset.mortgage || 0) * sellUnits) / (asset.units || 1));

	player.assets[assetIndex] = {
		...asset,
		units: remainingUnits,
		purchaseLots: remainingLots,
		mortgage: Math.max(0, Number(asset.mortgage || 0) - mortgageShare),
	};

	return {
		...asset,
		units: sellUnits,
		purchaseLots: sellUnits,
		mortgage: mortgageShare,
	};
}

function getMatchingAssets(player, key) {
	return (player.assets || []).filter((asset) => assetMatchesKey(asset, key));
}

const moves = {
	selectDealType: ({ G, ctx, playerID, random }, dealType) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.isSelectingDeal) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		const isBigDeal = dealType === 'big';
		if (isBigDeal && player.cash < 6000) {
			setPlayerNotice(player, 'error', 'You need at least $6,000 cash for a Big Deal.');
			return INVALID_MOVE;
		}

		const deck = isBigDeal ? getBigDeals() : getSmallDeals();
		const rawDeal = drawCard(deck, random);
		const deal = normalizeDeal(rawDeal, isBigDeal ? 'big' : 'small');

		G.isSelectingDeal = false;
		clearPlayerNotice(player);

		if (!deal) return INVALID_MOVE;

		if (isStockEventCard(deal)) {
			applyStockEvent(G, deal, playerID);
			return;
		}

		if (deal.queue && isStockLikeDeal(deal)) {
			queueGlobalStockOffer(G, playerID, deal, {
				allowBuyForAll: deal.type === 'anystock',
			});
			return;
		}

		G.currentDeal = deal;
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${getPlayerLabel(G, playerID)} revealed ${deal.title}.`,
			timestamp: createTimestamp(),
		});
	},

	acceptDeal: ({ G, ctx, playerID }, quantity = 1) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.currentDeal) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		const deal = G.currentDeal;

		if (deal.isCharity || deal.dealType === 'charity') {
			const requiredCash = Number(deal.downPayment || deal.cost || 0);
			if (player.cash < requiredCash) {
				setPlayerNotice(player, 'error', 'You do not have enough cash for Charity.');
				return INVALID_MOVE;
			}

			player.cash -= requiredCash;
			// Set to 4 so that after endTurn decrements it (lượt donate), player still gets 3 full turns of 2 dice
			player.charityTurns = 4;
			G.currentDeal = null;
			G.gameLog.push({
				type: 'deal',
				playerID,
				message: `${getPlayerLabel(G, playerID)} donated $${requiredCash.toLocaleString()} to Charity.`,
				timestamp: createTimestamp(),
			});
			return;
		}

		const purchaseLots = isStockLikeDeal(deal) ? Math.max(1, Number(quantity) || 1) : 1;
		const requiredCash = Number(deal.downPayment || deal.cost || 0) * purchaseLots;
		if (player.cash < requiredCash) {
			setPlayerNotice(player, 'error', 'Insufficient cash to take this deal.');
			return INVALID_MOVE;
		}

		const acquiredAsset = createAssetFromDeal(G, deal, purchaseLots);
		player.cash -= requiredCash;

		if (acquiredAsset.isStockLike) {
			const existingAsset = (player.assets || []).find(
				(asset) =>
					asset.isStockLike &&
					asset.key === acquiredAsset.key &&
					asset.purchasePrice === acquiredAsset.purchasePrice &&
					asset.cashFlow === acquiredAsset.cashFlow
			);

			if (existingAsset) {
				existingAsset.units += acquiredAsset.units;
				existingAsset.purchaseLots += acquiredAsset.purchaseLots;
			} else {
				player.assets.push(acquiredAsset);
			}
		} else {
			player.assets.push(acquiredAsset);
		}

		G.currentDeal = null;
		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${getPlayerLabel(G, playerID)} bought ${deal.title} for $${requiredCash.toLocaleString()}.`,
			timestamp: createTimestamp(),
		});
	},

	declineDeal: ({ G, ctx, playerID }) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
			return INVALID_MOVE;
		}

		if (G.isSelectingDeal) {
			G.isSelectingDeal = false;
			return;
		}

		if (G.currentDeal) {
			G.gameLog.push({
				type: 'deal',
				playerID,
				message: `${getPlayerLabel(G, playerID)} passed on ${G.currentDeal.title}.`,
				timestamp: createTimestamp(),
			});
			G.currentDeal = null;
			return;
		}

		const player = G.players[playerID];
		const prompt = getCurrentPrompt(player);
		if (prompt?.kind === 'market') {
			removeCurrentPrompt(player);
			G.gameLog.push({
				type: 'market',
				playerID,
				message: `${getPlayerLabel(G, playerID)} passed on ${prompt.title}.`,
				timestamp: createTimestamp(),
			});
			return;
		}

		return INVALID_MOVE;
	},

	payDoodad: ({ G, ctx, playerID }, options = {}) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		const prompt = getCurrentPrompt(player);
		if (!prompt || prompt.kind !== 'doodad') return INVALID_MOVE;

		const mode = options?.mode || 'cash';
		if (prompt.title === 'BUY BIG SCREEN TV' && mode === 'credit') {
			player.liabilities.creditCards += prompt.cost;
			player.expenses.creditCard = (player.expenses.creditCard || 0) + prompt.payment;
			clearPaidOffLiability(player, 'creditCards');
		} else if (prompt.title === 'NEW BOAT' && mode === 'finance') {
			if (player.cash < Number(prompt.downPayment || 0)) {
				setPlayerNotice(player, 'error', 'You need cash for the boat down payment.');
				return INVALID_MOVE;
			}

			player.cash -= Number(prompt.downPayment || 0);
			player.liabilities.boatLoan += Number(prompt.financedAmount || 0);
			player.expenses.boatPayment = (player.expenses.boatPayment || 0) + Number(prompt.payment || 0);
			clearPaidOffLiability(player, 'boatLoan');
		} else {
			if (player.cash < prompt.cost) {
				setPlayerNotice(player, 'error', `You need $${prompt.cost.toLocaleString()} cash to pay this doodad.`);
				return INVALID_MOVE;
			}
			player.cash -= prompt.cost;
		}

		removeCurrentPrompt(player);
		clearPlayerNotice(player);
		G.gameLog.push({
			type: 'doodad',
			playerID,
			message: `${getPlayerLabel(G, playerID)} resolved doodad: ${prompt.title}.`,
			timestamp: createTimestamp(),
		});
		syncBankruptcyState(G, playerID);
	},

	resolveMarketOffer: ({ G, ctx, playerID }, payload = {}) => {
		if (ctx.phase !== 'mainPlay') {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		const prompt = getCurrentPrompt(player);
		if (!prompt || prompt.kind !== 'market') return INVALID_MOVE;

		if (payload.pass || payload.action === 'pass') {
			removeCurrentPrompt(player);
			G.gameLog.push({
				type: 'market',
				playerID,
				message: `${getPlayerLabel(G, playerID)} passed on ${prompt.title}.`,
				timestamp: createTimestamp(),
			});
			return;
		}

		if (prompt.marketType === 'fee') {
			if (player.cash < prompt.cost) {
				setPlayerNotice(player, 'error', `You need $${prompt.cost.toLocaleString()} cash to pay this fee.`);
				return INVALID_MOVE;
			}

			player.cash -= prompt.cost;
			removeCurrentPrompt(player);
			G.gameLog.push({
				type: 'market',
				playerID,
				message: `${getPlayerLabel(G, playerID)} paid market fee: $${prompt.cost.toLocaleString()}.`,
				timestamp: createTimestamp(),
			});
			syncBankruptcyState(G, playerID);
			return;
		}

		if (prompt.marketType === 'brother') {
			const asset = getMatchingAssets(player, prompt.key)[0];
			if (!asset) {
				removeCurrentPrompt(player);
				return INVALID_MOVE;
			}

			applyAssetSale(player, asset.id, 0);
			player.expenses.other = (player.expenses.other || 0) + Number(prompt.cost || 0);
			player.receivables.push({
				id: getPromptId('receivable'),
				title: prompt.title,
				payoutCash: 100000,
				turnsRemaining: 48,
				expensePenalty: Number(prompt.cost || 0),
			});
			removeCurrentPrompt(player);
			G.gameLog.push({
				type: 'market',
				playerID,
				message: `${getPlayerLabel(G, playerID)} sold a 3/2 house to family terms and will collect $100,000 in 48 turns.`,
				timestamp: createTimestamp(),
			});
			syncBankruptcyState(G, playerID);
			return;
		}

		if (payload.action === 'buy' && prompt.allowBuy) {
			const units = Math.max(1, Number(payload.units) || 1);
			const purchaseCost = Number(prompt.cost || 0) * units;
			if (player.cash < purchaseCost) {
				setPlayerNotice(player, 'error', `You need $${purchaseCost.toLocaleString()} cash to buy this offer.`);
				return INVALID_MOVE;
			}

			const acquiredAsset = createAssetFromDeal(
				G,
				{
					...prompt,
					type: prompt.type,
					cashFlow: Number(prompt.cashflow || prompt.cashFlow || 0),
					downPayment: Number(prompt.cost || 0),
				},
				units
			);

			player.cash -= purchaseCost;
			const existingAsset = (player.assets || []).find(
				(asset) =>
					asset.isStockLike &&
					asset.key === acquiredAsset.key &&
					asset.purchasePrice === acquiredAsset.purchasePrice &&
					asset.cashFlow === acquiredAsset.cashFlow
			);

			if (existingAsset) {
				existingAsset.units += acquiredAsset.units;
				existingAsset.purchaseLots += acquiredAsset.purchaseLots;
			} else {
				player.assets.push(acquiredAsset);
			}

			removeCurrentPrompt(player);
			G.gameLog.push({
				type: 'deal',
				playerID,
				message: `${getPlayerLabel(G, playerID)} bought ${prompt.title} for $${purchaseCost.toLocaleString()}.`,
				timestamp: createTimestamp(),
			});
			return;
		}

		const targetAsset =
			(player.assets || []).find((asset) => asset.id === payload.assetId) ||
			getMatchingAssets(player, prompt.key)[0];
		if (!targetAsset) return INVALID_MOVE;

		const unitsToSell = targetAsset.isStockLike
			? Math.min(Number(payload.units) || targetAsset.units || 1, targetAsset.units || 1)
			: null;
		const saleValue = calculateNetSaleValue(targetAsset, prompt, unitsToSell);
		const soldAsset = applyAssetSale(player, targetAsset.id, saleValue, unitsToSell);
		removeCurrentPrompt(player);

		G.gameLog.push({
			type: 'market',
			playerID,
			message: `${getPlayerLabel(G, playerID)} sold ${soldAsset?.name || prompt.key} for $${saleValue.toLocaleString()}.`,
			timestamp: createTimestamp(),
		});
	},

	sellAsset: ({ G, ctx, playerID }, assetId) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		const asset = (player.assets || []).find((entry) => entry.id === assetId);
		if (!asset) return INVALID_MOVE;

		const liquidationValue = getLiquidationValue(asset);
		const soldAsset = applyAssetSale(player, asset.id, liquidationValue);
		G.gameLog.push({
			type: 'bankrupt',
			playerID,
			message: `${getPlayerLabel(G, playerID)} liquidated ${soldAsset?.name || asset.key} for $${liquidationValue.toLocaleString()}.`,
			timestamp: createTimestamp(),
		});
		syncBankruptcyState(G, playerID);
	},

	declareBankruptcy: ({ G, ctx, playerID }) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) return INVALID_MOVE;
		const player = G.players[playerID];
		if (!player || player.eliminated) return INVALID_MOVE;

		eliminatePlayer(
			G,
			playerID,
			`${getPlayerLabel(G, playerID)} declared bankruptcy and is out of the game.`
		);
	},

	takeLoan: ({ G, ctx, playerID }, amount) => {
		if (ctx.phase !== 'mainPlay') return INVALID_MOVE;

		const player = G.players[playerID];
		if (!player || player.eliminated) return INVALID_MOVE;

		const parsedAmount = Number(amount || 0);
		if (parsedAmount <= 0 || parsedAmount % BANK_LOAN_STEP !== 0) {
			setPlayerNotice(player, 'error', 'Bank loans must be in exact $1,000 increments.');
			return INVALID_MOVE;
		}

		player.cash += parsedAmount;
		player.liabilities.bankLoan += parsedAmount;
		player.expenses.bankLoanPayment =
			(player.expenses.bankLoanPayment || 0) +
			(parsedAmount / BANK_LOAN_STEP) * BANK_LOAN_PAYMENT_PER_STEP;
		clearPaidOffLiability(player, 'bankLoan');
		clearPlayerNotice(player);

		G.gameLog.push({
			type: 'loan',
			playerID,
			message: `${getPlayerLabel(G, playerID)} borrowed $${parsedAmount.toLocaleString()} from the bank.`,
			timestamp: createTimestamp(),
		});
		syncBankruptcyState(G, playerID);
	},

	payDebt: ({ G, ctx, playerID }, liabilityKey, amount) => {
		if (ctx.phase !== 'mainPlay') return INVALID_MOVE;

		const player = G.players[playerID];
		if (!player || !(liabilityKey in (player.liabilities || {}))) return INVALID_MOVE;

		const currentAmount = Number(player.liabilities[liabilityKey] || 0);
		const paymentAmount = Number(amount || 0);
		if (currentAmount <= 0 || paymentAmount <= 0 || paymentAmount > currentAmount) {
			return INVALID_MOVE;
		}

		if (paymentAmount !== currentAmount && paymentAmount % BANK_LOAN_STEP !== 0) {
			setPlayerNotice(player, 'error', 'Debt payments must use $1,000 steps unless paying in full.');
			return INVALID_MOVE;
		}

		if (player.cash < paymentAmount) {
			setPlayerNotice(player, 'error', 'You do not have enough cash to make that payment.');
			return INVALID_MOVE;
		}

		player.cash -= paymentAmount;
		player.liabilities[liabilityKey] = currentAmount - paymentAmount;
		if (player.liabilities[liabilityKey] <= 0) {
			player.liabilities[liabilityKey] = 0;
			syncPaidOffLiability(player, liabilityKey);
		}

		clearPlayerNotice(player);
		G.gameLog.push({
			type: 'debt',
			playerID,
			message: `${getPlayerLabel(G, playerID)} paid $${paymentAmount.toLocaleString()} toward ${liabilityKey}.`,
			timestamp: createTimestamp(),
		});
		syncBankruptcyState(G, playerID);
	},

	resolveDownsizeTurn: ({ G, ctx, playerID, events }) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		const prompt = getCurrentPrompt(player);
		if (!prompt || prompt.kind !== 'downsizeSkip') return INVALID_MOVE;

		player.downsizeTurns = Math.max(0, (player.downsizeTurns || 0) - 1);
		removeCurrentPrompt(player);
		clearPlayerNotice(player);
		G.dice = { value: null, die1: null, die2: null, die3: null, isDoubles: false, numDice: 0 };
		G.gameLog.push({
			type: 'downsize',
			playerID,
			message: `${getPlayerLabel(G, playerID)} loses a turn due to Downsize. ${player.downsizeTurns} turn(s) remaining.`,
			timestamp: createTimestamp(),
		});
		events.endTurn();
	},

	// Register player display name so logs use nicknames instead of "Player N"
	setPlayerName: ({ G, playerID }, name) => {
		if (!name || typeof name !== 'string') return INVALID_MOVE;
		if (!G.playerNames) G.playerNames = {};
		G.playerNames[playerID] = name.trim().slice(0, 30);
	},

	dismissContextModal: ({ G }) => {
		G.contextModal = null;
	},

	// Check for disconnected players who have exceeded timeout and kick them
	checkDisconnectedPlayers: ({ G }) => {
		if (!G.disconnectTimestamps) G.disconnectTimestamps = {};
		if (!G.kickedPlayers) G.kickedPlayers = {};
		
		const TIMEOUT_MS = 60000; // 60 seconds
		const now = Date.now();
		
		Object.entries(G.disconnectTimestamps).forEach(([playerID, disconnectTime]) => {
			if (now - disconnectTime >= TIMEOUT_MS && !G.kickedPlayers[playerID]) {
				// Kick player
				const playerName = G.playerNames?.[playerID] || `Player ${parseInt(playerID, 10) + 1}`;
				G.kickedPlayers[playerID] = true;
				delete G.disconnectTimestamps[playerID];
				
				// Mark player as eliminated
				eliminatePlayer(G, playerID, `${playerName} was kicked for being disconnected too long.`);
				
				G.gameLog.push({
					type: 'kick',
					playerID,
					message: `${playerName} was kicked due to inactivity (60s timeout).`,
					timestamp: createTimestamp(),
				});
			}
		});
	},

	rollDice: ({ G, ctx, playerID, random }, requestedDiceCount = null) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || G.dice?.value) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		if (!player || player.eliminated || player.isBankrupt) return INVALID_MOVE;
		if (G.isSelectingDeal || G.currentDeal || G.currentFastTrackSpace) return INVALID_MOVE;
		if (getCurrentPrompt(player)) return INVALID_MOVE;

		const numDice = player.isFastTrack
			? player.fastTrackCharityActive
				? Math.max(1, Math.min(3, Number(requestedDiceCount) || 2))
				: 2
			: player.charityTurns > 0
				? 2
				: 1;
		const results = Array.from({ length: numDice }, () => random.Die(6));
		const value = results.reduce((sum, entry) => sum + entry, 0);

		G.dice = {
			value,
			die1: results[0] ?? null,
			die2: results[1] ?? null,
			die3: results[2] ?? null,
			isDoubles: results.length > 1 && results.every((roll) => roll === results[0]),
			numDice,
		};

		if (player.isFastTrack) {
			const nextPosition = (player.fastTrackPosition + value) % FAST_TRACK_TILE_COUNT;
			player.fastTrackPosition = nextPosition;
			handleFastTrackLanding(G, playerID, FAST_TRACK_SPACES[nextPosition], random);
		} else {
			const previousPosition = player.position;
			const rawPosition = previousPosition + value;
			const nextPosition = rawPosition % RAT_RACE_TILE_COUNT;
			player.position = nextPosition;

			// Award Payday for every Payday/Start tile stepped through (not just landing tile)
			// Walk each step from previousPosition+1 to rawPosition inclusive (handles wrap-around)
			for (let step = 1; step <= value; step++) {
				const tileIndex = (previousPosition + step) % RAT_RACE_TILE_COUNT;
				const tile = boardTiles[tileIndex];
				if (tile && [TILE_TYPES.PAYDAY, TILE_TYPES.START].includes(tile.type)) {
					awardRatRacePayday(G, playerID);
				}
			}

			G.gameLog.push({
				type: 'move',
				playerID,
				message: `${getPlayerLabel(G, playerID)} rolled ${value} and moved to ${boardTiles[nextPosition]?.label || 'a tile'}.`,
				timestamp: createTimestamp(),
			});
			handleRatRaceLanding(G, playerID, boardTiles[nextPosition], random, ctx);
		}
	},

	buyFastTrackSpace: ({ G, ctx, playerID, random }) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.currentFastTrackSpace) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		if (!player?.isFastTrack) return INVALID_MOVE;

		const space = G.currentFastTrackSpace;

		if (space.type === 'charity') {
			if (player.fastTrackCash < space.cost) return INVALID_MOVE;
			player.fastTrackCash -= space.cost;
			player.fastTrackCharityActive = true;
			G.currentFastTrackSpace = null;
			G.gameLog.push({
				type: 'deal',
				playerID,
				message: `${getPlayerLabel(G, playerID)} bought Fast Track Charity for $${space.cost.toLocaleString()}.`,
				timestamp: createTimestamp(),
			});
			return;
		}

		if (space.type === 'dream') {
			if (player.fastTrackCash < Number(space.cost || 0)) return INVALID_MOVE;
			player.fastTrackCash -= Number(space.cost || 0);
			G.currentFastTrackSpace = null;
			G.gameLog.push({
				type: 'deal',
				playerID,
				message: `${getPlayerLabel(G, playerID)} purchased Fast Track luxury: ${space.title}.`,
				timestamp: createTimestamp(),
			});
			return;
		}

		if (space.type === 'investment') {
			if (player.fastTrackCash < Number(space.cost || 0)) return INVALID_MOVE;
			player.fastTrackCash -= Number(space.cost || 0);

			let rewardEarned = Number(space.reward || 0);
			let cashFlowEarned = Number(space.cashflow || 0);
			let rollResult = null;
			if (space.rollmin) {
				rollResult = random.Die(6);
				if (rollResult < Number(space.rollmin)) {
					rewardEarned = 0;
					cashFlowEarned = 0;
				}
			}

			player.fastTrackCash += rewardEarned;
			player.fastTrackIncomeCurrent += cashFlowEarned;
			player.fastTrackPassiveIncome = player.fastTrackIncomeCurrent;
			G.currentFastTrackSpace = null;
			G.gameLog.push({
				type: 'deal',
				playerID,
				message: `${getPlayerLabel(G, playerID)} bought Fast Track investment ${space.title}${rollResult ? ` and rolled ${rollResult}` : ''}.`,
				timestamp: createTimestamp(),
			});
			maybeDeclareWinner(G, playerID);
			return;
		}

		return INVALID_MOVE;
	},

	declineFastTrackSpace: ({ G, ctx, playerID }) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID || !G.currentFastTrackSpace) {
			return INVALID_MOVE;
		}

		G.gameLog.push({
			type: 'deal',
			playerID,
			message: `${getPlayerLabel(G, playerID)} passed on ${G.currentFastTrackSpace.title}.`,
			timestamp: createTimestamp(),
		});
		G.currentFastTrackSpace = null;
	},

	endTurn: ({ G, ctx, playerID, events }) => {
		if (ctx.phase !== 'mainPlay' || ctx.currentPlayer !== playerID) {
			return INVALID_MOVE;
		}

		const player = G.players[playerID];
		if (!player || player.eliminated || player.isBankrupt) return INVALID_MOVE;
		if (!G.dice?.value) {
			setPlayerNotice(player, 'warning', 'Roll the dice before ending your turn.');
			return INVALID_MOVE;
		}
		if (G.isSelectingDeal || G.currentDeal || G.currentFastTrackSpace || getCurrentPrompt(player)) {
			setPlayerNotice(player, 'warning', 'Resolve the current card or prompt before ending your turn.');
			return INVALID_MOVE;
		}

		if (!player.isFastTrack && canEscapeRatRace(player)) {
			enterFastTrack(G, playerID);
		}

		G.dice = { value: null, die1: null, die2: null, die3: null, isDoubles: false, numDice: 0 };
		clearPlayerNotice(player);
		// Decrement charityTurns at end of turn so each roll with charityTurns > 0 already gives 2 dice
		if (!player.isFastTrack && player.charityTurns > 0) {
			player.charityTurns -= 1;
		}
		events.endTurn();
	},
};

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

					// Check for disconnected players and kick if timed out
					if (!G.disconnectTimestamps) G.disconnectTimestamps = {};
					if (!G.kickedPlayers) G.kickedPlayers = {};
					const TIMEOUT_MS = 60000; // 60 seconds
					const now = Date.now();
					
					Object.entries(G.disconnectTimestamps).forEach(([pid, disconnectTime]) => {
						if (now - disconnectTime >= TIMEOUT_MS && !G.kickedPlayers[pid]) {
							const playerName = G.playerNames?.[pid] || `Player ${parseInt(pid, 10) + 1}`;
							G.kickedPlayers[pid] = true;
							delete G.disconnectTimestamps[pid];
							eliminatePlayer(G, pid, `${playerName} was kicked for being disconnected too long.`);
							G.gameLog.push({
								type: 'kick',
								playerID: pid,
								message: `${playerName} was kicked due to inactivity (60s timeout).`,
								timestamp: createTimestamp(),
							});
						}
					});

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
