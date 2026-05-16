import {
	acceptDealCommand,
	buyFastTrackSpaceCommand,
	declineDealCommand,
	declineFastTrackSpaceCommand,
	declareBankruptcyCommand,
	endTurnCommand,
	payDebtCommand,
	payDoodadCommand,
	resolveDownsizeTurnCommand,
	resolveMarketOfferCommand,
	rollDiceCommand,
	selectDealTypeCommand,
	sellAssetCommand,
	takeLoanCommand,
} from '@boombust/game-core/application/commands';

export function createBoardgameMoves(deps) {
	return {
		selectDealType: (context, dealType) => selectDealTypeCommand(context, dealType, deps),
		acceptDeal: (context, quantity = 1) => acceptDealCommand(context, quantity, deps),
		declineDeal: (context) => declineDealCommand(context, deps),
		payDoodad: (context, options = {}) => payDoodadCommand(context, options, deps),
		resolveMarketOffer: (context, payload = {}) => resolveMarketOfferCommand(context, payload, deps),
		sellAsset: (context, assetId) => sellAssetCommand(context, assetId, deps),
		declareBankruptcy: (context) => declareBankruptcyCommand(context, deps),
		takeLoan: (context, amount) => takeLoanCommand(context, amount, deps),
		payDebt: (context, liabilityKey, amount) => payDebtCommand(context, liabilityKey, amount, deps),
		resolveDownsizeTurn: (context) => resolveDownsizeTurnCommand(context, deps),
		setPlayerName: ({ G, playerID }, name) => {
			if (!name || typeof name !== 'string') return deps.invalidMove;
			if (!G.playerNames) G.playerNames = {};
			G.playerNames[playerID] = name.trim().slice(0, 30);
			return undefined;
		},
		dismissContextModal: ({ G }) => {
			G.contextModal = null;
		},
		checkDisconnectedPlayers: ({ G }) => deps.checkDisconnectedPlayers(G),
		rollDice: (context, requestedDiceCount = null) => rollDiceCommand(context, requestedDiceCount, deps),
		buyFastTrackSpace: (context) => buyFastTrackSpaceCommand(context, deps),
		declineFastTrackSpace: (context) => declineFastTrackSpaceCommand(context, deps),
		endTurn: (context) => endTurnCommand(context, deps),
	};
}
