export const LIABILITY_TO_EXPENSE_KEY = {
	homeMortgage: 'homeMortgage',
	schoolLoans: 'schoolLoan',
	carLoans: 'carLoan',
	creditCards: 'creditCard',
	retail: 'retail',
	bankLoan: 'bankLoanPayment',
	boatLoan: 'boatPayment',
};

export const EXPENSE_TO_LIABILITY_KEY = Object.fromEntries(
	Object.entries(LIABILITY_TO_EXPENSE_KEY).map(([liabilityKey, expenseKey]) => [expenseKey, liabilityKey])
);

export const LIABILITY_KEYS = Object.keys(LIABILITY_TO_EXPENSE_KEY);

export const LIABILITY_LABELS = {
	homeMortgage: 'Home Mortgage',
	schoolLoans: 'School Loans',
	carLoans: 'Car Loans',
	creditCards: 'Credit Cards',
	retail: 'Retail Debt',
	bankLoan: 'Bank Loan',
	boatLoan: 'Boat Loan',
};

export const EXPENSE_LABELS = {
	taxes: 'Taxes',
	homeMortgage: 'Home Mortgage',
	schoolLoan: 'School Loan',
	carLoan: 'Car Loan',
	creditCard: 'Credit Card',
	retail: 'Retail / Other Debt',
	bankLoanPayment: 'Bank Loan Payment',
	boatPayment: 'Boat Payment',
	other: 'Other Expenses',
};
