/**
 * Profession data based on Cash Flow boardgame
 * Extracted from official APK (gamedata/careers.json)
 */

import careersData from '../data/careers.json';

// Transform APK data format to our app format
const transformCareerData = (career) => ({
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
        other: career.otherExpenses
    },
    liabilities: {
        homeMortgage: career.mortgageLiability,
        schoolLoans: career.schoolLoanLiability,
        carLoans: career.carLoanLiability,
        creditCards: career.creditCardLiability,
        retail: career.retailDebtLiability
    },
    assets: {
        savings: career.savings
    },
    perChildExpense: career.childPerExpense
});

export const PROFESSIONS = careersData.careers.careerData.map(transformCareerData);

export const ASSET_TYPES = {
    REAL_ESTATE: 'REAL_ESTATE',
    STOCK: 'STOCK',
    STOCK_CALL: 'STOCK_CALL',
    STOCK_PUT: 'STOCK_PUT',
    STOCK_SHORT: 'STOCK_SHORT',
    BUSINESS: 'BUSINESS',
    PERSONAL_LOAN: 'PERSONAL_LOAN',
    LAND: 'LAND',
    CERTIFICATE_OF_DEPOSIT: 'CERTIFICATE_OF_DEPOSIT',
    DIVIDEND: 'DIVIDEND'
};

export const ASSET_TYPE_LABELS = {
    [ASSET_TYPES.REAL_ESTATE]: 'Real Estate',
    [ASSET_TYPES.STOCK]: 'Stock/Coin',
    [ASSET_TYPES.STOCK_CALL]: 'Stock (Call)',
    [ASSET_TYPES.STOCK_PUT]: 'Stock (Put)',
    [ASSET_TYPES.STOCK_SHORT]: 'Stock (Short)',
    [ASSET_TYPES.BUSINESS]: 'Business',
    [ASSET_TYPES.PERSONAL_LOAN]: 'Personal Loan',
    [ASSET_TYPES.LAND]: 'Land',
    [ASSET_TYPES.CERTIFICATE_OF_DEPOSIT]: 'CD',
    [ASSET_TYPES.DIVIDEND]: 'Dividend'
};
