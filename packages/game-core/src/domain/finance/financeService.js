import {
	EXPENSE_TO_LIABILITY_KEY,
	LIABILITY_TO_EXPENSE_KEY,
} from '../../financeConfig.js';

export const BANK_LOAN_STEP = 1000;
export const BANK_LOAN_PAYMENT_PER_STEP = 100;

export function calcBaseExpenses(player) {
	return Object.entries(player?.expenses || {}).reduce((sum, [expenseKey, value]) => {
		const liabilityKey = EXPENSE_TO_LIABILITY_KEY[expenseKey];
		if (liabilityKey && (player.paidOffLiabilities || []).includes(liabilityKey)) {
			return sum;
		}
		return sum + (value || 0);
	}, 0);
}

export function calcChildExpenses(player) {
	return (player?.childCount || 0) * (player?.perChildExpense || 0);
}

export function calcTotalExpenses(player) {
	return calcBaseExpenses(player) + calcChildExpenses(player);
}

export function calcPassiveIncome(player) {
	return (player?.assets || []).reduce(
		(sum, asset) => sum + (asset.cashFlow || 0) * (asset.units || 1),
		0
	);
}

export function calcTotalIncome(player) {
	return (player?.salary || 0) + calcPassiveIncome(player);
}

export function calcPayday(player) {
	return calcTotalIncome(player) - calcTotalExpenses(player);
}

export function calcAssetMortgageTotal(player) {
	return (player?.assets || []).reduce((sum, asset) => sum + (asset.mortgage || 0), 0);
}

export function calcTotalLiabilities(player) {
	const baseLiabilities = Object.values(player?.liabilities || {}).reduce(
		(sum, value) => sum + (value || 0),
		0
	);
	return baseLiabilities + calcAssetMortgageTotal(player);
}

export function calcRatRaceEscapeProgress(player) {
	const passiveIncome = calcPassiveIncome(player);
	const totalExpenses = calcTotalExpenses(player);
	return totalExpenses > 0 ? Math.min(100, (passiveIncome / totalExpenses) * 100) : 100;
}

export function canEscapeRatRace(player) {
	return calcPassiveIncome(player) > calcTotalExpenses(player);
}

export function createFinancialStatementSummary(player) {
	const passiveIncome = calcPassiveIncome(player);
	const baseExpenses = calcBaseExpenses(player);
	const childExpenses = calcChildExpenses(player);
	const totalIncome = (player?.salary || 0) + passiveIncome;
	const totalExpenses = baseExpenses + childExpenses;
	const payday = totalIncome - totalExpenses;

	return {
		cash: player?.cash || 0,
		salary: player?.salary || 0,
		baseExpenses,
		childExpenses,
		totalExpenses,
		passiveIncome,
		totalIncome,
		payday,
		cashFlow: payday,
		escapeProgress: totalExpenses > 0 ? Math.min(100, (passiveIncome / totalExpenses) * 100) : 100,
		canEscapeRatRace: passiveIncome > totalExpenses,
		assetMortgages: (player?.assets || []).filter((asset) => (asset.mortgage || 0) > 0),
		totalLiabilities: calcTotalLiabilities(player),
	};
}

export function clearPaidOffLiability(player, liabilityKey) {
	player.paidOffLiabilities = (player.paidOffLiabilities || []).filter((key) => key !== liabilityKey);
}

export function syncPaidOffLiability(player, liabilityKey) {
	if (!player.paidOffLiabilities.includes(liabilityKey)) {
		player.paidOffLiabilities.push(liabilityKey);
	}
	const expenseKey = LIABILITY_TO_EXPENSE_KEY[liabilityKey];
	if (expenseKey && expenseKey in player.expenses) {
		player.expenses[expenseKey] = 0;
	}
}

export function applyBankLoan(player, amount) {
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

export function applyLiabilityPayment(player, liabilityKey, amount) {
	const currentAmount = Number(player.liabilities[liabilityKey] || 0);
	const paymentAmount = Number(amount || 0);

	player.cash -= paymentAmount;
	player.liabilities[liabilityKey] = currentAmount - paymentAmount;
	if (player.liabilities[liabilityKey] <= 0) {
		player.liabilities[liabilityKey] = 0;
		syncPaidOffLiability(player, liabilityKey);
	}

	return paymentAmount;
}
