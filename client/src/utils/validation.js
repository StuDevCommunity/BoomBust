/**
 * Validation utilities for Boombust
 * Provides validation functions for assets, liabilities, and transactions
 */

/**
 * Validate asset data before adding
 * @param {Object} asset - Asset object to validate
 * @param {number} currentCash - Current cash available
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateAsset = (asset, currentCash) => {
    const errors = {};

    // Name validation
    if (!asset.name?.trim()) {
        errors.name = 'Asset name is required';
    } else if (asset.name.length > 50) {
        errors.name = 'Name must be 50 characters or less';
    }

    // Type validation
    const validTypes = [
        'REAL_ESTATE', 'STOCK', 'STOCK_CALL', 'STOCK_PUT', 'STOCK_SHORT',
        'BUSINESS', 'PERSONAL_LOAN', 'LAND', 'CERTIFICATE_OF_DEPOSIT', 'DIVIDEND'
    ];
    if (asset.type && !validTypes.includes(asset.type)) {
        errors.type = 'Invalid asset type';
    }

    // Price validation
    if (asset.purchasePrice === undefined || asset.purchasePrice === null) {
        errors.purchasePrice = 'Purchase price is required';
    } else if (asset.purchasePrice < 0) {
        errors.purchasePrice = 'Purchase price cannot be negative';
    }

    // Units validation (for stocks)
    const isStockType = ['STOCK', 'STOCK_CALL', 'STOCK_PUT', 'STOCK_SHORT'].includes(asset.type);
    if (isStockType) {
        if (!asset.units || asset.units <= 0) {
            errors.units = 'Number of shares must be at least 1';
        } else if (!Number.isInteger(asset.units)) {
            errors.units = 'Shares must be a whole number';
        }
    }

    // Down payment validation (for real estate)
    if (asset.type === 'REAL_ESTATE') {
        if (asset.downPayment === undefined || asset.downPayment < 0) {
            errors.downPayment = 'Down payment cannot be negative';
        }
        if (asset.downPayment > asset.purchasePrice) {
            errors.downPayment = 'Down payment cannot exceed purchase price';
        }
    }

    // Mortgage validation
    if (asset.mortgage !== undefined && asset.mortgage < 0) {
        errors.mortgage = 'Mortgage cannot be negative';
    }

    // Calculate required cash
    let requiredCash = 0;
    if (isStockType) {
        requiredCash = (asset.purchasePrice || 0) * (asset.units || 0);
    } else {
        requiredCash = asset.downPayment || 0;
    }

    if (requiredCash > currentCash) {
        errors.cash = `Insufficient funds. Need $${requiredCash.toLocaleString()}, have $${currentCash.toLocaleString()}`;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        requiredCash
    };
};

/**
 * Validate liability data before adding
 * @param {Object} liability - Liability object to validate
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateLiability = (liability) => {
    const errors = {};

    // Name validation
    if (!liability.name?.trim()) {
        errors.name = 'Liability name is required';
    } else if (liability.name.length > 50) {
        errors.name = 'Name must be 50 characters or less';
    }

    // Amount validation
    if (!liability.amount || liability.amount <= 0) {
        errors.amount = 'Loan amount must be greater than 0';
    }

    // Payment validation
    if (liability.payment === undefined || liability.payment < 0) {
        errors.payment = 'Monthly payment cannot be negative';
    }

    // Validate payment is reasonable
    if (liability.payment > liability.amount) {
        errors.payment = 'Monthly payment should not exceed loan amount';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate sell transaction
 * @param {Object} asset - Asset to sell
 * @param {number} salePrice - Proposed sale price
 * @param {number} unitsToSell - Number of units to sell
 * @param {number} currentCash - Current cash available
 * @returns {{ isValid: boolean, errors: Object, netProceeds: number, mortgagePortion: number }}
 */
export const validateSell = (asset, salePrice, unitsToSell, currentCash) => {
    const errors = {};
    const totalUnits = asset.units || 1;

    // Units validation
    if (!unitsToSell || unitsToSell <= 0) {
        errors.units = 'Must sell at least 1 unit';
    } else if (unitsToSell > totalUnits) {
        errors.units = `Cannot sell more than ${totalUnits} units`;
    }

    // Sale price validation
    if (salePrice === undefined || salePrice < 0) {
        errors.salePrice = 'Sale price cannot be negative';
    }

    // Calculate net proceeds
    const mortgagePortion = asset.mortgage
        ? Math.round((asset.mortgage / totalUnits) * unitsToSell)
        : 0;
    const netProceeds = salePrice - mortgagePortion;

    // Check if sale would result in negative cash
    if (netProceeds < 0 && currentCash + netProceeds < 0) {
        errors.cash = `This sale would result in negative cash. You need at least $${Math.abs(currentCash + netProceeds).toLocaleString()} more.`;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        netProceeds,
        mortgagePortion
    };
};

/**
 * Validate payoff transaction
 * @param {number} amount - Amount to pay
 * @param {number} liabilityAmount - Total liability amount
 * @param {number} currentCash - Current cash available
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validatePayoff = (amount, liabilityAmount, currentCash) => {
    const errors = {};

    if (!amount || amount <= 0) {
        errors.amount = 'Payment amount must be greater than 0';
    }

    if (amount > liabilityAmount) {
        errors.amount = `Payment cannot exceed liability amount ($${liabilityAmount.toLocaleString()})`;
    }

    if (amount > currentCash) {
        errors.cash = `Insufficient funds. Need $${amount.toLocaleString()}, have $${currentCash.toLocaleString()}`;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Calculate investment metrics
 * @param {Object} asset - Asset object with purchasePrice, downPayment, cashFlow
 * @returns {{ roi: number, cashOnCash: number, capRate: number, recommendation: string }}
 */
export const calculateInvestmentMetrics = (asset) => {
    const annualCashFlow = (asset.cashFlow || 0) * 12;
    const investment = asset.downPayment || asset.purchasePrice || 1;

    const roi = (annualCashFlow / investment) * 100;
    const cashOnCash = (annualCashFlow / investment) * 100;
    const capRate = (annualCashFlow / (asset.purchasePrice || 1)) * 100;

    let recommendation;
    if (roi >= 20) {
        recommendation = 'excellent';
    } else if (roi >= 12) {
        recommendation = 'good';
    } else if (roi >= 8) {
        recommendation = 'fair';
    } else {
        recommendation = 'poor';
    }

    return {
        roi: Math.round(roi * 10) / 10,
        cashOnCash: Math.round(cashOnCash * 10) / 10,
        capRate: Math.round(capRate * 10) / 10,
        recommendation
    };
};

/**
 * Sanitize numeric input
 * @param {string|number} value - Input value
 * @param {Object} options - Options { allowNegative, allowDecimal, min, max }
 * @returns {number}
 */
export const sanitizeNumericInput = (value, options = {}) => {
    const {
        allowNegative = false,
        allowDecimal = true,
        min = null,
        max = null
    } = options;

    let num = allowDecimal ? parseFloat(value) : parseInt(value, 10);

    if (isNaN(num)) {
        return 0;
    }

    if (!allowNegative && num < 0) {
        num = Math.abs(num);
    }

    if (min !== null && num < min) {
        num = min;
    }

    if (max !== null && num > max) {
        num = max;
    }

    return num;
};

/**
 * Format validation errors for display
 * @param {Object} errors - Errors object from validation
 * @returns {string[]} Array of error messages
 */
export const formatValidationErrors = (errors) => {
    return Object.values(errors).filter(Boolean);
};

export default {
    validateAsset,
    validateLiability,
    validateSell,
    validatePayoff,
    calculateInvestmentMetrics,
    sanitizeNumericInput,
    formatValidationErrors
};
