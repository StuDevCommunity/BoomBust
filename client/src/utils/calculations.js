export const formatCurrency = (amount, showSymbol = true) => {
    const absAmount = Math.abs(amount || 0);
    const formatted = absAmount.toLocaleString('en-US');
    return showSymbol ? formatted : formatted;
};

export const formatCurrencyWithSign = (amount) => {
    const absAmount = Math.abs(amount || 0);
    const formatted = absAmount.toLocaleString('en-US');
    const prefix = amount >= 0 ? '+' : '-';
    return { prefix, value: formatted };
};

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const calculatePassiveIncome = (assets) => {
    return assets.reduce((total, asset) => total + (asset.cashFlow || 0), 0);
};

export const calculateBaseExpenses = (expenses) => {
    return Object.values(expenses).reduce((total, expense) => total + (expense || 0), 0);
};

export const calculateChildExpenses = (childCount, perChildExpense) => {
    return childCount * perChildExpense;
};

export const calculateTotalExpenses = (expenses, childCount, perChildExpense) => {
    const baseExpenses = calculateBaseExpenses(expenses);
    const childExpenses = calculateChildExpenses(childCount, perChildExpense);
    return baseExpenses + childExpenses;
};

export const calculateMonthlyCashFlow = (totalIncome, totalExpenses) => {
    return totalIncome - totalExpenses;
};

export const calculateTotalLiabilities = (liabilities, assets) => {
    const baseLiabilities = Object.values(liabilities).reduce((sum, val) => sum + (val || 0), 0);
    const assetMortgages = assets.reduce((sum, asset) => sum + (asset.mortgage || 0), 0);
    return baseLiabilities + assetMortgages;
};

export const calculateVictoryProgress = (passiveIncome, totalExpenses) => {
    if (totalExpenses === 0) return 100;
    return Math.min(100, (passiveIncome / totalExpenses) * 100);
};

export const checkVictory = (passiveIncome, totalExpenses) => {
    return passiveIncome > totalExpenses;
};

export const calculateFastTrackProgress = (passiveIncome, targetIncome = 50000) => {
    return Math.min(100, (passiveIncome / targetIncome) * 100);
};

export const checkFastTrackVictory = (passiveIncome, targetIncome = 50000) => {
    return passiveIncome >= targetIncome;
};

export const calculateAssetSalePrice = (purchasePrice, percentageIncrease) => {
    return Math.round(purchasePrice * (1 + percentageIncrease / 100));
};
