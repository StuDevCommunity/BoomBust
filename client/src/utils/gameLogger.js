/**
 * Game Action Logger
 * Tracks all balance changes and user actions during gameplay
 */

const LOG_STORAGE_KEY = 'boombust-game-logs';
const MAX_LOGS = 500;

export const LOG_TYPES = {
    GAME_START: 'GAME_START',
    GAME_RESET: 'GAME_RESET',
    PAYDAY: 'PAYDAY',
    CASH_ADJUST: 'CASH_ADJUST',
    ASSET_BUY: 'ASSET_BUY',
    ASSET_SELL: 'ASSET_SELL',
    LIABILITY_ADD: 'LIABILITY_ADD',
    LIABILITY_PAYOFF: 'LIABILITY_PAYOFF',
    LIABILITY_REMOVE: 'LIABILITY_REMOVE',
    CHILD_ADD: 'CHILD_ADD',
    FAST_TRACK_ENTER: 'FAST_TRACK_ENTER',
    FAST_TRACK_INCOME: 'FAST_TRACK_INCOME',
    EXPENSE_UPDATE: 'EXPENSE_UPDATE'
};

class GameLogger {
    constructor() {
        this.logs = this.loadLogs();
    }

    loadLogs() {
        try {
            const saved = localStorage.getItem(LOG_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    saveLogs() {
        try {
            // Keep only last MAX_LOGS entries
            const logsToSave = this.logs.slice(-MAX_LOGS);
            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logsToSave));
        } catch (e) {
            console.error('Failed to save logs:', e);
        }
    }

    log(type, data = {}) {
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type,
            ...data
        };

        this.logs.push(entry);
        this.saveLogs();

        return entry;
    }

    // Game lifecycle
    logGameStart(profession, startingCash) {
        return this.log(LOG_TYPES.GAME_START, {
            profession: profession.title,
            startingCash,
            message: `Started game as ${profession.title} with $${startingCash.toLocaleString()}`
        });
    }

    logGameReset() {
        return this.log(LOG_TYPES.GAME_RESET, {
            message: 'Game reset'
        });
    }

    // Cash operations
    logPayday(amount, previousBalance, newBalance) {
        return this.log(LOG_TYPES.PAYDAY, {
            amount,
            previousBalance,
            newBalance,
            message: `Payday: +$${amount.toLocaleString()} ($${previousBalance.toLocaleString()} -> $${newBalance.toLocaleString()})`
        });
    }

    logCashAdjust(amount, reason, previousBalance, newBalance) {
        const sign = amount >= 0 ? '+' : '';
        return this.log(LOG_TYPES.CASH_ADJUST, {
            amount,
            reason,
            previousBalance,
            newBalance,
            message: `Cash ${reason}: ${sign}$${amount.toLocaleString()} ($${previousBalance.toLocaleString()} -> $${newBalance.toLocaleString()})`
        });
    }

    // Asset operations
    logAssetBuy(asset, cost, previousBalance, newBalance) {
        return this.log(LOG_TYPES.ASSET_BUY, {
            assetName: asset.name,
            assetType: asset.type,
            cost,
            cashflow: asset.cashFlow,
            previousBalance,
            newBalance,
            message: `Bought ${asset.name} for $${cost.toLocaleString()}, CF: $${asset.cashFlow.toLocaleString()}/mo`
        });
    }

    logAssetSell(asset, price, previousBalance, newBalance) {
        return this.log(LOG_TYPES.ASSET_SELL, {
            assetName: asset.name,
            assetType: asset.type,
            price,
            previousBalance,
            newBalance,
            message: `Sold ${asset.name} for $${price.toLocaleString()}`
        });
    }

    // Liability operations
    logLiabilityAdd(name, amount, payment) {
        return this.log(LOG_TYPES.LIABILITY_ADD, {
            name,
            amount,
            payment,
            message: `Added loan: ${name} - $${amount.toLocaleString()} ($${payment}/mo)`
        });
    }

    logLiabilityPayoff(key, amount, previousBalance, newBalance) {
        return this.log(LOG_TYPES.LIABILITY_PAYOFF, {
            key,
            amount,
            previousBalance,
            newBalance,
            message: `Paid off ${key}: $${amount.toLocaleString()} ($${previousBalance.toLocaleString()} -> $${newBalance.toLocaleString()})`
        });
    }

    // Child operations
    logChildAdd(childCount, expensePerChild) {
        return this.log(LOG_TYPES.CHILD_ADD, {
            childCount,
            expensePerChild,
            message: `Child added. Total: ${childCount}, Expense: $${expensePerChild}/child`
        });
    }

    // Fast Track
    logFastTrackEnter(startingCash, startingCashFlow) {
        return this.log(LOG_TYPES.FAST_TRACK_ENTER, {
            startingCash,
            startingCashFlow,
            message: `Entered Fast Track with $${startingCash.toLocaleString()} cash, $${startingCashFlow.toLocaleString()} cash flow`
        });
    }

    logFastTrackIncome(amount, previousBalance, newBalance) {
        return this.log(LOG_TYPES.FAST_TRACK_INCOME, {
            amount,
            previousBalance,
            newBalance,
            message: `Fast Track Cash Flow Day: +$${amount.toLocaleString()}`
        });
    }

    // Get logs
    getLogs(limit = 100) {
        return this.logs.slice(-limit).reverse();
    }

    getLogsByType(type, limit = 50) {
        return this.logs
            .filter(log => log.type === type)
            .slice(-limit)
            .reverse();
    }

    getLogsSince(timestamp) {
        return this.logs
            .filter(log => new Date(log.timestamp) > new Date(timestamp))
            .reverse();
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem(LOG_STORAGE_KEY);
    }

    // Get summary
    getSummary() {
        const summary = {
            totalLogs: this.logs.length,
            byType: {}
        };

        this.logs.forEach(log => {
            summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;
        });

        return summary;
    }
}

// Singleton instance
const gameLogger = new GameLogger();

export default gameLogger;
