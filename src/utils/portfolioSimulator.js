import { initializeAssets, generateTransactions } from './dataGenerator';
import { calculateTransactionTax, calculatePortfolioTax, calculatePortfolioValueOverTime } from './taxCalculations';

export const simulatePortfolio = (config) => {
  const {
    initialValue = 100000,
    days = 1095,
    taxRate = 0.39
  } = config;
  
  // Initialize assets and price history
  const { assets, priceHistory } = initializeAssets(days);
  
  // Generate scenarios
  const scenarios = ['bad', 'good', 'hold'];
  const scenarioNames = {
    bad: 'Bad Trader',
    good: 'Good Trader',
    hold: 'Buy and Hold'
  };
  
  const results = scenarios.map(scenarioId => {
    // Generate transactions for this scenario
    const transactions = generateTransactions(
      scenarioId,
      assets,
      initialValue,
      days,
      priceHistory
    );
    
    // Calculate tax for both strategies
    const transactionTax = calculateTransactionTax(transactions, taxRate);
    const portfolioTax = calculatePortfolioTax(transactions, initialValue, priceHistory, taxRate);
    
    // Calculate portfolio value over time
    // For transaction-based tax, we need to calculate two timelines:
    // 1. With tax deducted (transaction-based)
    // 2. Without tax deducted (portfolio-level, for comparison)
    const portfolioTimelineTransaction = calculatePortfolioValueOverTime(
      transactions,
      initialValue,
      priceHistory,
      days,
      taxRate,
      'transaction'
    );
    const portfolioTimelinePortfolio = calculatePortfolioValueOverTime(
      transactions,
      initialValue,
      priceHistory,
      days,
      taxRate,
      'portfolio'
    );
    
    // Return both timelines - transaction-based (with tax deducted) and portfolio-level (without tax deducted)
    const portfolioTimeline = portfolioTimelineTransaction;
    const portfolioTimelinePortfolioLevel = portfolioTimelinePortfolio;
    
    // Calculate cumulative tax over time for transaction-based
    // Map tax to portfolio timeline dates
    // This should match exactly what's shown in the transaction breakdown table
    const cumulativeTaxTimeline = portfolioTimeline.map(point => {
      // Find all transactions up to this point (including transactions on the same day)
      // Normalize dates to midnight for comparison
      const pointDate = new Date(point.date);
      pointDate.setHours(0, 0, 0, 0);
      
      const transactionsUpToPoint = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        txDate.setHours(0, 0, 0, 0);
        return txDate <= pointDate;
      });
      
      // Calculate cumulative tax up to this point - same logic as table
      // Iterate in transaction order and sum tax events for sell transactions
      let runningTax = 0;
      transactionsUpToPoint.forEach(tx => {
        if (tx.type === 'sell') {
          const taxEvent = transactionTax.taxEvents.find(te => te.transactionId === tx.id);
          if (taxEvent) {
            runningTax += taxEvent.tax;
          }
        }
      });
      
      return {
        date: point.date,
        tax: Number(runningTax.toFixed(2))
      };
    });
    
    // Calculate portfolio-level tax over time (owed tax at each point)
    // Tax is calculated as if entire portfolio was sold at that point
    // Use portfolio-level timeline (without tax deducted) to match table calculation
    const portfolioTaxTimeline = portfolioTimeline.map((point, index) => {
      // Find matching portfolio-level point by date (without tax deducted)
      const portfolioLevelPoint = portfolioTimelinePortfolioLevel.find(
        p => p.date.getTime() === point.date.getTime()
      );
      
      // Use portfolio value without tax deducted (matches table calculation)
      const portfolioValue = portfolioLevelPoint?.value || point.value;
      
      // Portfolio-level tax: Calculate as profit from initial investment
      // Tax = (Current Portfolio Value - Initial Investment) * Tax Rate
      // Negative tax is allowed (represents tax write-off/credit when portfolio is at a loss)
      // This matches the TransactionBreakdown table calculation exactly
      const profit = portfolioValue - initialValue;
      const owedTax = profit * taxRate;
      
      return {
        date: point.date,
        tax: Number(owedTax.toFixed(2))
      };
    });
    
    return {
      id: scenarioId,
      name: scenarioNames[scenarioId],
      transactions,
      transactionTax,
      portfolioTax,
      portfolioTimeline,
      portfolioTimelinePortfolioLevel,
      cumulativeTaxTimeline,
      portfolioTaxTimeline,
      priceHistory
    };
  });
  
  return {
    assets,
    priceHistory,
    scenarios: results,
    config: { initialValue, days, taxRate }
  };
};

