/**
 * @typedef {'gameStart' | 'marketTile' | 'turnStart' | 'manual'} StageTriggerDefinition
 *
 * @typedef {Object} StageDefinition
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} description
 * @property {string} mood
 * @property {StageTriggerDefinition[]} triggers
 * @property {string[]} eventPool
 *
 * @typedef {Object} StockDefinition
 * @property {string} symbol
 * @property {string} name
 * @property {string} sector
 * @property {number} startingPrice
 *
 * @typedef {Object} StockPriceHistoryEntry
 * @property {number} turn
 * @property {string} eventId
 * @property {number} before
 * @property {number} after
 *
 * @typedef {Object} StockRuntimeState
 * @property {string} symbol
 * @property {number} price
 * @property {StockPriceHistoryEntry[]} history
 *
 * @typedef {Object} StockMarketState
 * @property {Object.<string, StockRuntimeState>} stocks
 * @property {string[]} watchlist
 *
 * @typedef {'set' | 'add' | 'multiply' | 'randomDelta'} GameEventEffect
 *
 * @typedef {Object} StockSelector
 * @property {string=} symbol
 * @property {string=} sector
 *
 * @typedef {Object} GameEventDefinition
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} weight
 * @property {StockSelector} selector
 * @property {{ type: GameEventEffect, value?: number, min?: number, max?: number }} effect
 *
 * @typedef {Object} MarketEffectResult
 * @property {string} symbol
 * @property {number} before
 * @property {number} after
 * @property {number} delta
 *
 * @typedef {Object} EventLogEntry
 * @property {string} id
 * @property {string} eventId
 * @property {string} stageId
 * @property {string} title
 * @property {string} description
 * @property {number} turn
 * @property {number} timestamp
 * @property {MarketEffectResult[]} results
 *
 * @typedef {Object} ContextModalData
 * @property {'stage' | 'marketEvent'} kind
 * @property {string} title
 * @property {string} subtitle
 * @property {string} description
 * @property {string} mood
 * @property {MarketEffectResult[]=} results
 */

export {};
