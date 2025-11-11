import { describe, it, expect } from 'vitest';
import { calculateTransactionTax, calculatePortfolioTax } from '../../src/utils/taxCalculations.js';

describe('Tax Calculations', () => {
  describe('Transaction-Based Tax', () => {
    it('should calculate tax correctly for buy and sell transactions', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'ETH',
          quantity: 12.070735,
          price: 2485.35,
          timestamp: new Date(2024, 0, 1) // Jan 1, 2024
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'ETH',
          quantity: 2.880243,
          price: 2532.89,
          timestamp: new Date(2024, 0, 8) // Jan 8, 2024
        }
      ];

      const taxRate = 0.20; // 20%
      const result = calculateTransactionTax(transactions, taxRate);

      // Calculate expected values
      // Capital gain = (sellPrice - buyPrice) * quantity
      // = (2532.89 - 2485.35) * 2.880243
      // = 47.54 * 2.880243
      // = 136.95 (approximately)
      const expectedGain = (2532.89 - 2485.35) * 2.880243;
      const expectedTax = expectedGain * taxRate;

      // Verify total tax
      expect(result.totalTax).toBeCloseTo(expectedTax, 2);
      expect(result.totalTax).toBeCloseTo(27.39, 2);

      // Verify tax events
      expect(result.taxEvents).toHaveLength(1);
      expect(result.taxEvents[0].transactionId).toBe('tx-2');
      expect(result.taxEvents[0].gain).toBeCloseTo(expectedGain, 2);
      expect(result.taxEvents[0].tax).toBeCloseTo(expectedTax, 2);
      expect(result.taxEvents[0].tax).toBeCloseTo(27.39, 2);

      // Verify holdings after sell
      // Remaining ETH: 12.070735 - 2.880243 = 9.190492
      expect(result.holdings.ETH).toBeDefined();
      expect(result.holdings.ETH).toHaveLength(1);
      expect(result.holdings.ETH[0].quantity).toBeCloseTo(9.190492, 6);
      expect(result.holdings.ETH[0].costBasis).toBe(2485.35);
    });

    it('should handle multiple sells with FIFO correctly', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'BTC',
          quantity: 1.0,
          price: 45000,
          timestamp: new Date(2024, 0, 1)
        },
        {
          id: 'tx-2',
          type: 'buy',
          assetId: 'BTC',
          quantity: 1.0,
          price: 46000,
          timestamp: new Date(2024, 0, 2)
        },
        {
          id: 'tx-3',
          type: 'sell',
          assetId: 'BTC',
          quantity: 1.5,
          price: 47000,
          timestamp: new Date(2024, 0, 3)
        }
      ];

      const taxRate = 0.20;
      const result = calculateTransactionTax(transactions, taxRate);

      // First 1.0 BTC sold at cost basis 45000: gain = (47000 - 45000) * 1.0 = 2000
      // Next 0.5 BTC sold at cost basis 46000: gain = (47000 - 46000) * 0.5 = 500
      // Total gain = 2500
      // Total tax = 2500 * 0.20 = 500
      const expectedGain = (47000 - 45000) * 1.0 + (47000 - 46000) * 0.5;
      const expectedTax = expectedGain * taxRate;

      expect(result.totalTax).toBeCloseTo(expectedTax, 2);
      expect(result.totalTax).toBe(500);

      // Remaining: 0.5 BTC at cost basis 46000
      expect(result.holdings.BTC).toHaveLength(1);
      expect(result.holdings.BTC[0].quantity).toBeCloseTo(0.5, 6);
      expect(result.holdings.BTC[0].costBasis).toBe(46000);
    });

    it('should not tax losses', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2500,
          timestamp: new Date(2024, 0, 1)
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'ETH',
          quantity: 5.0,
          price: 2400, // Sold at a loss
          timestamp: new Date(2024, 0, 2)
        }
      ];

      const taxRate = 0.20;
      const result = calculateTransactionTax(transactions, taxRate);

      // Loss = (2400 - 2500) * 5.0 = -500
      // Tax on loss = -500 * 0.20 = -100 (tax write-off)
      expect(result.totalTax).toBeCloseTo(-100, 2);
      expect(result.netGains).toBeCloseTo(-500, 2);
      expect(result.taxEvents).toHaveLength(1);
      expect(result.taxEvents[0].gain).toBeCloseTo(-500, 2);
      expect(result.taxEvents[0].tax).toBeCloseTo(-100, 2);
    });

    it('should offset gains with losses (tax write-offs)', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'BTC',
          quantity: 1.0,
          price: 45000,
          timestamp: new Date(2024, 0, 1)
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'BTC',
          quantity: 1.0,
          price: 50000, // Gain of 5000
          timestamp: new Date(2024, 0, 2)
        },
        {
          id: 'tx-3',
          type: 'buy',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2500,
          timestamp: new Date(2024, 0, 3)
        },
        {
          id: 'tx-4',
          type: 'sell',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2000, // Loss of 5000
          timestamp: new Date(2024, 0, 4)
        }
      ];

      const taxRate = 0.20;
      const result = calculateTransactionTax(transactions, taxRate);

      // Gain: 5000, Loss: -5000
      // Net gain: 0
      // Tax: 0 (losses offset gains)
      expect(result.totalTax).toBe(0);
      expect(result.taxEvents).toHaveLength(2);
      expect(result.taxEvents[0].gain).toBeCloseTo(5000, 2);
      expect(result.taxEvents[1].gain).toBeCloseTo(-5000, 2);
    });

    it('should partially offset gains with losses', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'BTC',
          quantity: 1.0,
          price: 45000,
          timestamp: new Date(2024, 0, 1)
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'BTC',
          quantity: 1.0,
          price: 50000, // Gain of 5000
          timestamp: new Date(2024, 0, 2)
        },
        {
          id: 'tx-3',
          type: 'buy',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2500,
          timestamp: new Date(2024, 0, 3)
        },
        {
          id: 'tx-4',
          type: 'sell',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2400, // Loss of 1000
          timestamp: new Date(2024, 0, 4)
        }
      ];

      const taxRate = 0.20;
      const result = calculateTransactionTax(transactions, taxRate);

      // Gain: 5000, Loss: -1000
      // Net gain: 4000
      // Tax: 4000 * 0.20 = 800
      expect(result.totalTax).toBeCloseTo(800, 2);
      expect(result.taxEvents).toHaveLength(2);
      expect(result.taxEvents[0].gain).toBeCloseTo(5000, 2);
      expect(result.taxEvents[1].gain).toBeCloseTo(-1000, 2);
    });

    it('should allow negative tax when losses exceed gains (tax write-off)', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'BTC',
          quantity: 1.0,
          price: 45000,
          timestamp: new Date(2024, 0, 1)
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'BTC',
          quantity: 1.0,
          price: 50000, // Gain of 5000
          timestamp: new Date(2024, 0, 2)
        },
        {
          id: 'tx-3',
          type: 'buy',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2500,
          timestamp: new Date(2024, 0, 3)
        },
        {
          id: 'tx-4',
          type: 'sell',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2000, // Loss of 5000
          timestamp: new Date(2024, 0, 4)
        },
        {
          id: 'tx-5',
          type: 'buy',
          assetId: 'DOGE',
          quantity: 1000.0,
          price: 0.10,
          timestamp: new Date(2024, 0, 5)
        },
        {
          id: 'tx-6',
          type: 'sell',
          assetId: 'DOGE',
          quantity: 1000.0,
          price: 0.05, // Loss of 50
          timestamp: new Date(2024, 0, 6)
        }
      ];

      const taxRate = 0.20;
      const result = calculateTransactionTax(transactions, taxRate);

      // Gain: 5000, Losses: -5000 - 50 = -5050
      // Net gain: -50 (more losses than gains)
      // Tax: -50 * 0.20 = -10 (negative tax = tax write-off/credit)
      expect(result.totalTax).toBeCloseTo(-10, 2);
      expect(result.netGains).toBeCloseTo(-50, 2);
      expect(result.taxEvents).toHaveLength(3);
      // First transaction: gain of 5000, tax = 5000 * 0.20 = 1000
      expect(result.taxEvents[0].tax).toBeCloseTo(1000, 2);
      // Second transaction: loss of 5000, net gains = 0, tax = 0 - 1000 = -1000
      expect(result.taxEvents[1].tax).toBeCloseTo(-1000, 2);
      // Third transaction: loss of 50, net gains = -50, tax = -10 - 0 = -10
      expect(result.taxEvents[2].tax).toBeCloseTo(-10, 2);
    });

    it('should show negative tax for pure loss scenario', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2500,
          timestamp: new Date(2024, 0, 1)
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'ETH',
          quantity: 10.0,
          price: 2000, // Loss of 5000
          timestamp: new Date(2024, 0, 2)
        }
      ];

      const taxRate = 0.20;
      const result = calculateTransactionTax(transactions, taxRate);

      // Loss: -5000
      // Net gain: -5000
      // Tax: -5000 * 0.20 = -1000 (tax write-off)
      expect(result.totalTax).toBeCloseTo(-1000, 2);
      expect(result.netGains).toBeCloseTo(-5000, 2);
      expect(result.taxEvents).toHaveLength(1);
      expect(result.taxEvents[0].gain).toBeCloseTo(-5000, 2);
      expect(result.taxEvents[0].tax).toBeCloseTo(-1000, 2);
    });
  });

  describe('Portfolio-Level Tax', () => {
    it('should calculate tax as if entire portfolio was sold', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'ETH',
          quantity: 12.070735,
          price: 2485.35,
          timestamp: new Date(2024, 0, 1)
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'ETH',
          quantity: 2.880243,
          price: 2532.89,
          timestamp: new Date(2024, 0, 8)
        }
      ];

      const initialValue = 100000;
      const taxRate = 0.20;

      // Mock price history - current price at end should be around 2532.89
      const priceHistory = {
        ETH: [
          { date: new Date(2024, 0, 1), price: 2485.35 },
          { date: new Date(2024, 0, 8), price: 2532.89 }
        ]
      };

      const result = calculatePortfolioTax(transactions, initialValue, priceHistory, taxRate);

      // After transactions:
      // - USD: 100000 - (12.070735 * 2485.35) + (2.880243 * 2532.89)
      //   = 100000 - 30000 + 7291.39 = 77291.39 (approximately)
      // - ETH remaining: 12.070735 - 2.880243 = 9.190492
      // - Current ETH value: 9.190492 * 2532.89 = 23291.39 (approximately)
      // - Total portfolio value: 77291.39 + 23291.39 = 100582.78 (approximately)
      // - Cost basis: 100000 (initial) - 30000 (spent) + 7291.39 (received) = 77291.39
      //   Plus remaining ETH cost basis: 9.190492 * 2485.35 = 22850.00 (approximately)
      //   Total cost basis: 77291.39 + 22850.00 = 100141.39 (approximately)
      // - Capital gains: 100582.78 - 100141.39 = 441.39 (approximately)
      // - Tax: 441.39 * 0.20 = 88.28 (approximately)

      // Portfolio-level tax is now calculated as: (Current Value - Initial Investment) * Tax Rate
      // More accurate calculation:
      const ethBought = 12.070735;
      const ethBoughtPrice = 2485.35;
      const ethSold = 2.880243;
      const ethSoldPrice = 2532.89;
      const ethRemaining = ethBought - ethSold;
      const currentEthPrice = 2532.89; // Latest price

      const usdAfterTransactions = initialValue - (ethBought * ethBoughtPrice) + (ethSold * ethSoldPrice);
      const currentEthValue = ethRemaining * currentEthPrice;
      const totalPortfolioValue = usdAfterTransactions + currentEthValue;
      
      // Portfolio-level tax: profit from initial investment
      // Negative tax is allowed (tax write-off when portfolio is at a loss)
      const profit = totalPortfolioValue - initialValue;
      const expectedTax = profit * taxRate;

      expect(result.totalTax).toBeCloseTo(expectedTax, 2);
      expect(result.currentPortfolioValue).toBeCloseTo(totalPortfolioValue, 2);
    });

    it('should handle buy and hold scenario correctly', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'BTC',
          quantity: 2.0,
          price: 45000,
          timestamp: new Date(2024, 0, 1)
        }
      ];

      const initialValue = 100000;
      const taxRate = 0.20;

      const priceHistory = {
        BTC: [
          { date: new Date(2024, 0, 1), price: 45000 },
          { date: new Date(2024, 0, 365), price: 50000 } // Price increased
        ]
      };

      const result = calculatePortfolioTax(transactions, initialValue, priceHistory, taxRate);

      // USD after buy: 100000 - (2.0 * 45000) = 10000
      // BTC value at end: 2.0 * 50000 = 100000
      // Total portfolio value: 10000 + 100000 = 110000
      // Profit: 110000 - 100000 = 10000
      // Tax: 10000 * 0.20 = 2000

      expect(result.currentPortfolioValue).toBeCloseTo(110000, 2);
      expect(result.totalTax).toBeCloseTo(2000, 2);
    });

    it('should show negative tax when portfolio is sold at a loss (tax write-off)', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'BTC',
          quantity: 2.0,
          price: 45000,
          timestamp: new Date(2024, 0, 1)
        }
      ];

      const initialValue = 100000;
      const taxRate = 0.20;

      const priceHistory = {
        BTC: [
          { date: new Date(2024, 0, 1), price: 45000 },
          { date: new Date(2024, 0, 365), price: 40000 } // Price decreased
        ]
      };

      const result = calculatePortfolioTax(transactions, initialValue, priceHistory, taxRate);

      // USD after buy: 100000 - (2.0 * 45000) = 10000
      // BTC value at end: 2.0 * 40000 = 80000
      // Total portfolio value: 10000 + 80000 = 90000
      // Profit: 90000 - 100000 = -10000 (loss)
      // Tax: -10000 * 0.20 = -2000 (tax write-off)

      expect(result.currentPortfolioValue).toBeCloseTo(90000, 2);
      expect(result.totalTax).toBeCloseTo(-2000, 2);
    });

    it('should show zero tax when portfolio value equals initial investment', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'BTC',
          quantity: 2.0,
          price: 45000,
          timestamp: new Date(2024, 0, 1)
        }
      ];

      const initialValue = 100000;
      const taxRate = 0.20;

      const priceHistory = {
        BTC: [
          { date: new Date(2024, 0, 1), price: 45000 },
          { date: new Date(2024, 0, 365), price: 45000 } // Price unchanged
        ]
      };

      const result = calculatePortfolioTax(transactions, initialValue, priceHistory, taxRate);

      // USD after buy: 100000 - (2.0 * 45000) = 10000
      // BTC value at end: 2.0 * 45000 = 90000
      // Total portfolio value: 10000 + 90000 = 100000
      // Profit: 100000 - 100000 = 0
      // Tax: 0 * 0.20 = 0

      expect(result.currentPortfolioValue).toBeCloseTo(100000, 2);
      expect(result.totalTax).toBe(0);
    });

    it('should calculate tax correctly for buy and sell - portfolio level (user example)', () => {
      const transactions = [
        {
          id: 'tx-1',
          type: 'buy',
          assetId: 'ETH',
          quantity: 11.979443,
          price: 2504.29,
          timestamp: new Date(2024, 0, 1) // Jan 1, 2024
        },
        {
          id: 'tx-2',
          type: 'sell',
          assetId: 'ETH',
          quantity: 2.486699,
          price: 2496.25,
          timestamp: new Date(2024, 0, 8) // Jan 8, 2024
        }
      ];

      const initialValue = 100000;
      const taxRate = 0.20;

      // Calculate what current price gives portfolio value of 100,048.22
      const ethBought = 11.979443;
      const ethBoughtPrice = 2504.29;
      const ethSold = 2.486699;
      const ethSoldPrice = 2496.25;
      const ethRemaining = ethBought - ethSold;
      
      const usdAfterBuy = initialValue - (ethBought * ethBoughtPrice);
      const usdAfterSell = usdAfterBuy + (ethSold * ethSoldPrice);
      
      // User reports portfolio value of 100,048.22
      // So: USD + (ETH remaining * current price) = 100,048.22
      // currentPrice = (100,048.22 - usdAfterSell) / ethRemaining
      const reportedPortfolioValue = 100048.22;
      const currentEthPrice = (reportedPortfolioValue - usdAfterSell) / ethRemaining;
      
      // Price history with the price that gives the reported portfolio value
      const priceHistory = {
        ETH: [
          { date: new Date(2024, 0, 1), price: 2504.29 },
          { date: new Date(2024, 0, 8), price: currentEthPrice }
        ]
      };

      const result = calculatePortfolioTax(transactions, initialValue, priceHistory, taxRate);

      // User's expectation: Tax should be on the $48.22 profit
      // Profit = 100,048.22 - 100,000 = 48.22
      // Expected tax = 48.22 * 0.20 = 9.64
      
      // Portfolio-level tax is now calculated as: (Current Value - Initial Investment) * Tax Rate
      const expectedProfit = reportedPortfolioValue - initialValue;
      const expectedTax = Math.max(0, expectedProfit * taxRate);
      
      // Verify the calculation matches user expectation
      expect(result.currentPortfolioValue).toBeCloseTo(reportedPortfolioValue, 2);
      expect(result.totalTax).toBeCloseTo(expectedTax, 2);
      expect(result.totalTax).toBeCloseTo(9.64, 2); // $48.22 * 0.20 = $9.64
    });
  });
});

