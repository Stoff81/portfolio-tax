/**
 * Utility functions for comparing tax strategies
 */

/**
 * Determines which strategy has the higher current portfolio value
 * @param {number} transactionBasedValue - Current portfolio value for transaction-based strategy (with tax deducted)
 * @param {number} portfolioLevelValue - Current portfolio value for portfolio-level strategy (without tax deducted)
 * @returns {'transaction' | 'portfolio' | null} - The strategy with higher value, or null if equal
 */
export const getHigherPortfolioValueStrategy = (transactionBasedValue, portfolioLevelValue) => {
  if (transactionBasedValue > portfolioLevelValue) {
    return 'transaction';
  } else if (portfolioLevelValue > transactionBasedValue) {
    return 'portfolio';
  }
  return null; // Equal values
};

/**
 * Determines which strategy has the higher tax amount
 * @param {number} transactionTax - Tax paid for transaction-based strategy
 * @param {number} portfolioTax - Tax owed for portfolio-level strategy
 * @returns {'transaction' | 'portfolio' | null} - The strategy with higher tax, or null if equal
 */
export const getHigherTaxStrategy = (transactionTax, portfolioTax) => {
  if (transactionTax > portfolioTax) {
    return 'transaction';
  } else if (portfolioTax > transactionTax) {
    return 'portfolio';
  }
  return null; // Equal values
};

