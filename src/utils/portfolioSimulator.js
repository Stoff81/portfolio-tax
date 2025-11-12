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
    const cumulativeTaxTimeline = portfolioTimeline.map(point => {
      // Find all transactions up to this point
      const transactionsUpToPoint = transactions.filter(tx => 
        tx.timestamp <= point.date
      );
      
      // Calculate cumulative tax up to this point
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
    const portfolioTaxTimeline = portfolioTimeline.map((point, index) => {
      // Calculate cost basis and current value at this point
      const day = Math.floor((point.date - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24));
      
      // Rebuild holdings up to this point
      const pointHoldings = {
        USD: initialValue,
        BTC: [],
        ETH: [],
        DOGE: []
      };
      
      const transactionsUpToPoint = transactions.filter(tx => tx.timestamp <= point.date);
      
      transactionsUpToPoint.forEach(tx => {
        if (tx.type === 'buy') {
          const cost = tx.quantity * tx.price;
          pointHoldings.USD -= cost;
          pointHoldings[tx.assetId].push({
            quantity: tx.quantity,
            costBasis: tx.price
          });
        } else if (tx.type === 'sell') {
          let remainingQty = tx.quantity;
          while (remainingQty > 0 && pointHoldings[tx.assetId].length > 0) {
            const holding = pointHoldings[tx.assetId][0];
            const qtyToSell = Math.min(remainingQty, holding.quantity);
            remainingQty -= qtyToSell;
            holding.quantity -= qtyToSell;
            if (holding.quantity <= 0) {
              pointHoldings[tx.assetId].shift();
            }
          }
          const revenue = tx.quantity * tx.price;
          pointHoldings.USD += revenue;
        }
      });
      
      // Portfolio-level tax: Calculate as profit from initial investment
      // Tax = (Current Portfolio Value - Initial Investment) * Tax Rate
      // Negative tax is allowed (represents tax write-off/credit when portfolio is at a loss)
      const profit = point.value - initialValue;
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

