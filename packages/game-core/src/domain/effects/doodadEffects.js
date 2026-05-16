import { clearPaidOffLiability } from '../../domain/finance/financeService.js';

export function createDoodadPrompt(player, card) {
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

export function applyDoodadPayment(player, prompt, mode) {
	if (prompt.title === 'BUY BIG SCREEN TV' && mode === 'credit') {
		player.liabilities.creditCards += prompt.cost;
		player.expenses.creditCard = (player.expenses.creditCard || 0) + prompt.payment;
		clearPaidOffLiability(player, 'creditCards');
		return { ok: true };
	}

	if (prompt.title === 'NEW BOAT' && mode === 'finance') {
		if (player.cash < Number(prompt.downPayment || 0)) {
			return { ok: false, message: 'You need cash for the boat down payment.' };
		}

		player.cash -= Number(prompt.downPayment || 0);
		player.liabilities.boatLoan += Number(prompt.financedAmount || 0);
		player.expenses.boatPayment = (player.expenses.boatPayment || 0) + Number(prompt.payment || 0);
		clearPaidOffLiability(player, 'boatLoan');
		return { ok: true };
	}

	if (player.cash < prompt.cost) {
		return { ok: false, message: `You need $${prompt.cost.toLocaleString()} cash to pay this doodad.` };
	}

	player.cash -= prompt.cost;
	return { ok: true };
}
