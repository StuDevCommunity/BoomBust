import {
	INVALID_MOVE,
	TurnOrder,
} from 'boardgame.io/dist/esm/core.js';
import { defaultDataset } from '@boombust/game-core/domain/datasets';
import {
	calcPayday,
	calcPassiveIncome,
	calcTotalExpenses,
	canEscapeRatRace,
} from '@boombust/game-core/domain/finance/financeService';
import {
	drawCard,
	getBigDeals,
	getSmallDeals,
} from '@boombust/game-core/domain/decks';
import {
	clearPlayerNotice,
	createTimestamp,
	setPlayerNotice,
} from '@boombust/game-core/domain/events';
import {
	drawBoombustMarketEvent,
	drawDoodadPrompt,
	drawRatRaceMarketCard,
	queueGlobalStockOffer,
} from '@boombust/game-core/domain/market';
import {
	getCurrentPrompt,
	getPromptId,
	queuePlayerPrompt,
	removeCurrentPrompt,
} from '@boombust/game-core/domain/prompts';
import {
	advanceReceivables,
	applyRiskCard,
	awardRatRacePayday,
	checkDisconnectedPlayers,
	collectFastTrackCashFlowDay,
	createPlayerState,
	eliminatePlayer,
	enterFastTrack,
	getLiquidationValue,
	getPlayerLabel,
	maybeDeclareWinner,
	payMandatoryAmount,
	syncBankruptcyState,
} from '@boombust/game-core/domain/players';
import {
	FAST_TRACK_SPACES,
} from '@boombust/game-core/fastTrackConfig';
import { createInitialStageState } from '@boombust/game-core/boombust/stageEngine';
import { createInitialStockMarketState } from '@boombust/game-core/boombust/stockMarketEngine';
import {
	resolveFastTrackLanding,
	resolveRatRaceLanding,
} from '@boombust/game-core/domain/board/tileResolutionService';
import { createBoardgameMoves } from './moveAdapter.js';

const CHILD_LIMIT = 3;

const PROFESSIONS = defaultDataset.careers.professions;

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

const commandDeps = {
	invalidMove: INVALID_MOVE,
	awardRatRacePayday,
	checkDisconnectedPlayers: (G) => checkDisconnectedPlayers(G, createTimestamp()),
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

					checkDisconnectedPlayers(G, createTimestamp());

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
			G.disconnectTimestamps[playerID] = createTimestamp();
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
