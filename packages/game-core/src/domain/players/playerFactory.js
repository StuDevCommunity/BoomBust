export function createPlayerState(profession) {
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
