import boardTiles from '../../boardTiles.js';
import { stageDefinitions } from '../../data/boombust/stages.js';
import { stockDefinitions } from '../../data/boombust/stocks.js';
import { marketEventDefinitions } from '../../data/boombust/marketEvents.js';
import { FAST_TRACK_DREAMS, FAST_TRACK_RISK_CARDS, FAST_TRACK_SPACES } from '../../fastTrackConfig.js';
import smallDeals from '../../data/smalldeal.json' with { type: 'json' };
import bigDeals from '../../data/bigdeal.json' with { type: 'json' };
import marketCards from '../../data/market.json' with { type: 'json' };
import doodadCards from '../../data/doodads.json' with { type: 'json' };
import careersData from '../../data/careers.json' with { type: 'json' };
import fastTrackData from '../../data/fasttrack.json' with { type: 'json' };
import vocabData from '../../data/vocab_en_us.json' with { type: 'json' };

export const DEFAULT_DATASET_ID = 'boombust-default';
export const DEFAULT_DATASET_VERSION = '0.1.0';

export function transformCareerData(career) {
	return {
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
		assets: {
			savings: career.savings,
		},
		perChildExpense: career.childPerExpense,
	};
}

export function createDefaultDataset() {
	const careers = careersData?.careers?.careerData || [];

	return {
		id: DEFAULT_DATASET_ID,
		version: DEFAULT_DATASET_VERSION,
		board: {
			ratRaceTiles: boardTiles,
			fastTrackSpaces: FAST_TRACK_SPACES,
			fastTrackDreams: FAST_TRACK_DREAMS,
			fastTrackRiskCards: FAST_TRACK_RISK_CARDS,
		},
		careers: {
			raw: careersData,
			professions: careers.map(transformCareerData),
		},
		deals: {
			small: smallDeals,
			big: bigDeals,
		},
		market: {
			cards: marketCards,
			events: marketEventDefinitions,
		},
		doodads: doodadCards,
		fastTrack: fastTrackData,
		boombust: {
			stages: stageDefinitions,
			stocks: stockDefinitions,
			marketEvents: marketEventDefinitions,
		},
		vocab: vocabData,
	};
}

export const defaultDataset = createDefaultDataset();

export function getDataset(datasetId = DEFAULT_DATASET_ID) {
	if (datasetId === DEFAULT_DATASET_ID) return defaultDataset;
	return null;
}
