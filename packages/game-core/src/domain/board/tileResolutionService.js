import { TILE_TYPES } from '../../boardTiles.js';
import {
	calcTotalExpenses,
	calcTotalIncome,
} from '../finance/financeService.js';

export function resolveRatRaceLanding({ G, playerID, tile, random, ctx }, deps) {
	const player = G.players[playerID];
	if (!tile || !player) return;

	switch (tile.type) {
		case TILE_TYPES.DEAL:
			G.isSelectingDeal = true;
			break;
		case TILE_TYPES.MARKET:
			deps.drawRatRaceMarketCard(G, playerID, random, ctx);
			break;
		case TILE_TYPES.DOODAD:
			deps.drawDoodadPrompt(G, playerID, random);
			break;
		case TILE_TYPES.BABY:
			if ((player.childCount || 0) < deps.childLimit) {
				player.childCount += 1;
				G.gameLog.push({
					type: 'baby',
					playerID,
					message: `${deps.getPlayerLabel(G, playerID)} welcomed a child. Total children: ${player.childCount}.`,
					timestamp: deps.createTimestamp(),
				});
				deps.syncBankruptcyState(G, playerID);
			} else {
				G.gameLog.push({
					type: 'baby',
					playerID,
					message: `${deps.getPlayerLabel(G, playerID)} is already at the child limit.`,
					timestamp: deps.createTimestamp(),
				});
			}
			break;
		case TILE_TYPES.DOWNSIZE: {
			const expenseHit = calcTotalExpenses(player);
			player.downsizeTurns = 2;
			player.charityTurns = 0;
			deps.payMandatoryAmount(G, playerID, expenseHit, 'Downsize expenses');
			G.gameLog.push({
				type: 'downsize',
				playerID,
				message: `${deps.getPlayerLabel(G, playerID)} downsized and paid $${expenseHit.toLocaleString()} in expenses.`,
				timestamp: deps.createTimestamp(),
			});
			deps.syncBankruptcyState(G, playerID);
			break;
		}
		case TILE_TYPES.CHARITY: {
			const charityCost = Math.ceil(calcTotalIncome(player) * 0.1);
			G.currentDeal = {
				id: deps.getPromptId('charity'),
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
			deps.drawBoombustMarketEvent(G, playerID, random, ctx);
			G.gameLog.push({
				type: 'market',
				playerID,
				message: `${deps.getPlayerLabel(G, playerID)} reached the Fed Meeting. Macro policy is watching the market.`,
				timestamp: deps.createTimestamp(),
			});
			break;
		case TILE_TYPES.BANKRUPTCY:
			G.gameLog.push({
				type: 'bankrupt',
				playerID,
				message: `${deps.getPlayerLabel(G, playerID)} visited Bankruptcy Court. Full audit mechanics are not active yet.`,
				timestamp: deps.createTimestamp(),
			});
			break;
		case TILE_TYPES.STORY:
			G.gameLog.push({
				type: 'story',
				playerID,
				message: `${deps.getPlayerLabel(G, playerID)} hit a story beat in the ${G.stage?.currentStageId || 'current'} stage.`,
				timestamp: deps.createTimestamp(),
			});
			break;
		default:
			break;
	}
}

export function resolveFastTrackLanding({ G, playerID, space, random }, deps) {
	const player = G.players[playerID];
	if (!space || !player) return;

	if (space.type === 'cashflowDay') {
		deps.collectFastTrackCashFlowDay(G, playerID);
		return;
	}

	if (space.type === 'risk') {
		deps.applyRiskCard(G, playerID, random);
		return;
	}

	G.currentFastTrackSpace = {
		...space,
		description: [space.copy1, space.copy2].filter(Boolean).join(' '),
	};
}
