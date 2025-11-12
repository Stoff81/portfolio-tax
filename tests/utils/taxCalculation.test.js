import { describe, it, expect } from 'vitest';
import { calculateTransactionTax, calculatePortfolioTax, calculatePortfolioValueOverTime } from '../../src/utils/taxCalculations.js';

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

  describe('Portfolio Value with Transaction-Based Tax', () => {
    it('should deduct tax from portfolio value when tax is paid', () => {
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
          price: 3000, // Gain of 5000
          timestamp: new Date(2024, 0, 2)
        }
      ];

      const initialValue = 100000;
      const taxRate = 0.20;
      const priceHistory = {
        ETH: [
          { date: new Date(2024, 0, 1), price: 2500 },
          { date: new Date(2024, 0, 2), price: 3000 }
        ]
      };

      // Calculate portfolio value with transaction-based tax
      const timeline = calculatePortfolioValueOverTime(
        transactions,
        initialValue,
        priceHistory,
        365,
        taxRate,
        'transaction'
      );

      // After buy: USD = 100000 - (10 * 2500) = 75000, ETH = 10
      // After sell: USD = 75000 + (10 * 3000) = 105000, ETH = 0
      // Tax on gain of 5000: 5000 * 0.20 = 1000
      // Final USD after tax: 105000 - 1000 = 104000
      // Portfolio value: 104000 (no ETH holdings)
      
      const finalValue = timeline[timeline.length - 1].value;
      expect(finalValue).toBeCloseTo(104000, 2);
    });

    it('should not change portfolio value when tax is negative (write-off)', () => {
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

      const initialValue = 100000;
      const taxRate = 0.20;
      const priceHistory = {
        ETH: [
          { date: new Date(2024, 0, 1), price: 2500 },
          { date: new Date(2024, 0, 2), price: 2000 }
        ]
      };

      // Calculate portfolio value with transaction-based tax
      const timeline = calculatePortfolioValueOverTime(
        transactions,
        initialValue,
        priceHistory,
        365,
        taxRate,
        'transaction'
      );

      // After buy: USD = 100000 - (10 * 2500) = 75000, ETH = 10
      // After sell: USD = 75000 + (10 * 2000) = 95000, ETH = 0
      // Tax on loss of -5000: -5000 * 0.20 = -1000 (write-off, no cash refund)
      // Final USD: 95000 (tax write-off doesn't add money back)
      // Portfolio value: 95000
      
      const finalValue = timeline[timeline.length - 1].value;
      expect(finalValue).toBeCloseTo(95000, 2);
    });

    it('should deduct tax when gains exceed losses', () => {
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

      const initialValue = 100000;
      const taxRate = 0.20;
      const priceHistory = {
        BTC: [
          { date: new Date(2024, 0, 1), price: 45000 },
          { date: new Date(2024, 0, 2), price: 50000 }
        ],
        ETH: [
          { date: new Date(2024, 0, 3), price: 2500 },
          { date: new Date(2024, 0, 4), price: 2400 }
        ]
      };

      const timeline = calculatePortfolioValueOverTime(
        transactions,
        initialValue,
        priceHistory,
        365,
        taxRate,
        'transaction'
      );

      // Net gains: 5000 - 1000 = 4000
      // Tax: 4000 * 0.20 = 800
      // After all transactions: USD should be reduced by 800 tax
      // Initial: 100000
      // After BTC buy: 100000 - 45000 = 55000
      // After BTC sell: 55000 + 50000 = 105000, tax on 5000 gain = 1000, USD = 104000
      // After ETH buy: 104000 - 25000 = 79000
      // After ETH sell: 79000 + 24000 = 103000, net gains now 4000, tax = 800
      // Tax change from this transaction: 800 - 1000 = -200 (reduces tax)
      // But we already paid 1000, so we get 200 back? No, we track net tax
      // Actually: net gains after BTC = 5000, tax = 1000 (paid)
      // After ETH: net gains = 4000, tax = 800 (total)
      // Tax for ETH transaction = 800 - 1000 = -200 (reduces tax owed)
      // But we already paid 1000, so we should get 200 back? No, tax write-offs don't refund
      
      // Let me recalculate:
      // After BTC sell: gain 5000, net gains 5000, tax 1000, USD = 105000 - 1000 = 104000
      // After ETH sell: loss 1000, net gains 4000, tax 800, tax change = 800 - 1000 = -200
      // Since tax is negative (reduction), we don't add money back
      // Final USD: 103000 (from ETH sell) - 0 (no additional tax) = 103000
      // Wait, we already paid 1000, so we should have 104000 - 25000 + 24000 = 103000
      // But we paid 1000 tax, so we should have 102000? No, the tax was already deducted
      
      // Let me think through this more carefully:
      // 1. Buy BTC: USD = 55000, BTC = 1
      // 2. Sell BTC: gain 5000, net gains 5000, tax 1000, USD = 55000 + 50000 - 1000 = 104000
      // 3. Buy ETH: USD = 104000 - 25000 = 79000, ETH = 10
      // 4. Sell ETH: loss 1000, net gains 4000, tax 800, tax change = -200
      // Since tax change is negative, we don't refund, so USD = 79000 + 24000 = 103000
      
      const finalValue = timeline[timeline.length - 1].value;
      // After all: USD = 103000 (no additional tax on the loss since it's a write-off)
      expect(finalValue).toBeCloseTo(103000, 2);
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

