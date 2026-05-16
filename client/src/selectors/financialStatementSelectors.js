import { createFinancialStatementSummary } from '@boombust/game-core/domain/finance/financeService';
import {
	EXPENSE_LABELS,
	EXPENSE_TO_LIABILITY_KEY,
	LIABILITY_KEYS,
	LIABILITY_LABELS,
} from '@boombust/game-core/financeConfig';

export function selectFinancialStatement(player) {
	const summary = createFinancialStatementSummary(player);
	const paidOffLiabilities = player?.paidOffLiabilities || [];
	const assets = player?.assets || [];

	return {
		...summary,
		paidOffLiabilities,
		assets,
		incomeRows: selectIncomeRows(player, summary),
		expenseRows: selectExpenseRows(player, paidOffLiabilities, summary),
		assetRows: selectAssetRows(assets),
		liabilityRows: selectLiabilityRows(player, paidOffLiabilities),
	};
}

export function selectIncomeRows(player, summary = createFinancialStatementSummary(player)) {
	const assets = player?.assets || [];
	const rows = [
		{
			key: 'salary',
			label: 'Salary',
			value: player?.salary || 0,
		},
	];

	assets
		.filter((asset) => (asset.cashFlow || 0) > 0)
		.forEach((asset) => {
			rows.push({
				key: asset.id,
				label: `${asset.name}${asset.units > 1 ? ` ×${asset.units}` : ''}`,
				value: (asset.cashFlow || 0) * (asset.units || 1),
			});
		});

	if (summary.passiveIncome > 0) {
		rows.push({
			key: 'passive-income',
			label: 'Passive Income',
			value: summary.passiveIncome,
			isTotal: true,
		});
	}

	return rows;
}

export function selectExpenseRows(player, paidOffLiabilities = player?.paidOffLiabilities || [], summary = createFinancialStatementSummary(player)) {
	const rows = Object.entries(player?.expenses || {}).flatMap(([expenseKey, value]) => {
		const liabilityKey = EXPENSE_TO_LIABILITY_KEY[expenseKey];
		const isPaidOff = liabilityKey ? paidOffLiabilities.includes(liabilityKey) : false;
		if (value <= 0 && !isPaidOff) return [];

		return {
			key: expenseKey,
			label: `${EXPENSE_LABELS[expenseKey] || expenseKey}${isPaidOff ? ' (paid off)' : ''}`,
			value: isPaidOff ? 0 : value,
			isPaidOff,
		};
	});

	if ((player?.childCount || 0) > 0) {
		rows.push({
			key: 'children',
			label: `Children ×${player.childCount}`,
			value: summary.childExpenses,
			isChildExpense: true,
		});
	}

	return rows;
}

export function selectAssetRows(assets = []) {
	const groups = [];

	for (const asset of assets) {
		const isStock = asset.isStockLike || ['gold', 'coin', 'cd'].includes(asset.key);
		if (isStock) {
			const existing = groups.find(
				(group) => group.isStockGroup && group.key === asset.key && group.purchasePrice === asset.purchasePrice
			);
			if (existing) {
				existing.units += asset.units || 1;
				existing.cashFlow += (asset.cashFlow || 0) * (asset.units || 1);
			} else {
				groups.push({
					...asset,
					units: asset.units || 1,
					cashFlow: (asset.cashFlow || 0) * (asset.units || 1),
					isStockGroup: true,
					isStock,
				});
			}
		} else {
			groups.push({ ...asset, isStockGroup: false, isStock });
		}
	}

	return groups;
}

export function selectLiabilityRows(player, paidOffLiabilities = player?.paidOffLiabilities || []) {
	return LIABILITY_KEYS.flatMap((liabilityKey) => {
		const value = player?.liabilities?.[liabilityKey] || 0;
		const isPaidOff = paidOffLiabilities.includes(liabilityKey);
		if (value <= 0 && !isPaidOff) return [];

		return {
			key: liabilityKey,
			label: `${LIABILITY_LABELS[liabilityKey]}${isPaidOff ? ' (paid off)' : ''}`,
			rawLabel: LIABILITY_LABELS[liabilityKey],
			value,
			isPaidOff,
		};
	});
}
