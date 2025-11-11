// Calculate tax for transaction-based strategy
// Losses offset gains (tax write-offs)
export const calculateTransactionTax = (transactions, taxRate = 0.20) => {
  const holdings = {}; // Track cost basis for each asset
  const taxEvents = [];
  let netGains = 0; // Track cumulative net gains/losses
  
  transactions.forEach(transaction => {
    const { type, assetId, quantity, price } = transaction;
    
    if (type === 'buy') {
      // Add to holdings with cost basis
      if (!holdings[assetId]) {
        holdings[assetId] = [];
      }
      holdings[assetId].push({
        quantity,
        costBasis: price,
        timestamp: transaction.timestamp
      });
    } else if (type === 'sell') {
      // Calculate capital gain/loss using FIFO
      let remainingQty = quantity;
      let totalGain = 0;
      
      if (!holdings[assetId] || holdings[assetId].length === 0) {
        return; // Can't sell what we don't have
      }
      
      while (remainingQty > 0 && holdings[assetId].length > 0) {
        const holding = holdings[assetId][0];
        const qtyToSell = Math.min(remainingQty, holding.quantity);
        const gain = (price - holding.costBasis) * qtyToSell;
        
        totalGain += gain;
        remainingQty -= qtyToSell;
        holding.quantity -= qtyToSell;
        
        if (holding.quantity <= 0) {
          holdings[assetId].shift();
        }
      }
      
      // Add this transaction's gain/loss to net gains
      netGains += totalGain;
      
      // Calculate tax on net gains (losses offset gains)
      // Negative tax is allowed (represents tax write-off/credit)
      const netTax = netGains * taxRate;
      
      // Calculate tax for this specific transaction
      // This is the incremental tax change from this transaction
      const previousNetGains = netGains - totalGain;
      const previousNetTax = previousNetGains * taxRate;
      const taxForThisTx = netTax - previousNetTax;
      
      taxEvents.push({
        transactionId: transaction.id,
        gain: Number(totalGain.toFixed(2)),
        tax: Number(taxForThisTx.toFixed(2)),
        netGains: Number(netGains.toFixed(2)),
        timestamp: transaction.timestamp
      });
    }
  });
  
  // Final tax is on net gains (after all losses offset gains)
  // Negative tax is allowed (represents tax write-off/credit)
  const totalTax = netGains * taxRate;
  
  return {
    totalTax: Number(totalTax.toFixed(2)),
    taxEvents,
    holdings,
    netGains: Number(netGains.toFixed(2))
  };
};

// Calculate tax for portfolio-level strategy
// Tax is calculated as if the entire portfolio was sold and withdrawn at that point in time
export const calculatePortfolioTax = (transactions, initialValue, priceHistory, taxRate = 0.20) => {
  // Track holdings and cost basis using FIFO
  const holdings = {
    USD: initialValue,
    BTC: [],
    ETH: [],
    DOGE: []
  };
  
  // Process all transactions to build portfolio state with cost basis
  transactions.forEach(transaction => {
    const { type, assetId, quantity, price } = transaction;
    
    if (type === 'buy') {
      const cost = quantity * price;
      holdings.USD -= cost;
      // Add to holdings with cost basis
      holdings[assetId].push({
        quantity,
        costBasis: price
      });
    } else if (type === 'sell') {
      // Remove from holdings using FIFO
      let remainingQty = quantity;
      while (remainingQty > 0 && holdings[assetId].length > 0) {
        const holding = holdings[assetId][0];
        const qtyToSell = Math.min(remainingQty, holding.quantity);
        remainingQty -= qtyToSell;
        holding.quantity -= qtyToSell;
        
        if (holding.quantity <= 0) {
          holdings[assetId].shift();
        }
      }
      const revenue = quantity * price;
      holdings.USD += revenue;
    }
  });
  
  // Calculate current portfolio value if everything was sold
  const getCurrentPrice = (assetId, dayIndex) => {
    const history = priceHistory[assetId];
    if (!history || dayIndex < 0) {
      return history?.[0]?.price || 1;
    }
    if (dayIndex >= history.length) {
      return history?.[history.length - 1]?.price || 1;
    }
    return history[dayIndex].price;
  };
  
  const lastDay = Math.max(...Object.values(priceHistory).map(h => h?.length || 0)) - 1;
  
  // Calculate total cost basis and current value
  // Cost basis = current USD + cost basis of all assets held
  let totalCostBasis = holdings.USD; // Start with current USD holdings
  let totalCurrentValue = holdings.USD; // USD is already in current value
  
  // For each asset, calculate cost basis and current value
  ['BTC', 'ETH', 'DOGE'].forEach(assetId => {
    const currentPrice = getCurrentPrice(assetId, lastDay);
    let assetCostBasis = 0;
    let assetQuantity = 0;
    
    holdings[assetId].forEach(holding => {
      assetCostBasis += holding.quantity * holding.costBasis;
      assetQuantity += holding.quantity;
    });
    
    totalCostBasis += assetCostBasis;
    totalCurrentValue += assetQuantity * currentPrice;
  });
  
  // Portfolio-level tax: Calculate as if entire portfolio was sold
  // Tax is on the profit from initial investment, not cost basis
  // This is simpler and matches user expectation: tax on (current value - initial investment)
  // Negative tax is allowed (represents tax write-off/credit when portfolio is at a loss)
  const profit = totalCurrentValue - initialValue;
  const owedTax = profit * taxRate;
  
  return {
    totalTax: Number(owedTax.toFixed(2)), // Tax owed if entire portfolio was sold
    taxEvents: [{
      type: 'owed',
      gain: Number(profit.toFixed(2)),
      tax: Number(owedTax.toFixed(2)),
      timestamp: new Date()
    }],
    currentPortfolioValue: Number(totalCurrentValue.toFixed(2)),
    initialValue: Number(initialValue.toFixed(2)),
    costBasis: Number(totalCostBasis.toFixed(2))
  };
};

// Calculate portfolio value over time
// Includes monthly data points even when there are no trades
export const calculatePortfolioValueOverTime = (transactions, initialValue, priceHistory, days = 365) => {
  const timeline = [];
  const holdings = {
    USD: initialValue,
    BTC: 0,
    ETH: 0,
    DOGE: 0
  };
  
  // Get all unique days from transactions
  const transactionDays = new Set([0]); // Include day 0 (initial state)
  transactions.forEach(tx => {
    const day = Math.floor((tx.timestamp - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24));
    transactionDays.add(day);
  });
  
  // Add monthly data points (every ~30 days)
  const monthlyDays = new Set(transactionDays);
  for (let day = 0; day < days; day += 30) {
    monthlyDays.add(day);
  }
  monthlyDays.add(days - 1); // Include last day
  
  const sortedDays = Array.from(monthlyDays).sort((a, b) => a - b);
  
  sortedDays.forEach(day => {
    // Process all transactions up to this day
    const dayTransactions = transactions.filter(tx => {
      const txDay = Math.floor((tx.timestamp - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24));
      return txDay <= day;
    });
    
    // Reset and recalculate holdings
    holdings.USD = initialValue;
    holdings.BTC = 0;
    holdings.ETH = 0;
    holdings.DOGE = 0;
    
    dayTransactions.forEach(tx => {
      if (tx.type === 'buy') {
        const cost = tx.quantity * tx.price;
        holdings.USD -= cost;
        holdings[tx.assetId] += tx.quantity;
      } else if (tx.type === 'sell') {
        const revenue = tx.quantity * tx.price;
        holdings.USD += revenue;
        holdings[tx.assetId] -= tx.quantity;
      }
    });
    
    // Calculate portfolio value at this day
    const getPrice = (assetId, dayIndex) => {
      const history = priceHistory[assetId];
      if (!history || dayIndex < 0) {
        return history?.[0]?.price || 1;
      }
      if (dayIndex >= history.length) {
        return history?.[history.length - 1]?.price || 1;
      }
      return history[dayIndex].price;
    };
    
    const portfolioValue = 
      holdings.USD +
      holdings.BTC * getPrice('BTC', day) +
      holdings.ETH * getPrice('ETH', day) +
      holdings.DOGE * getPrice('DOGE', day);
    
    timeline.push({
      date: new Date(2024, 0, 1 + day),
      value: Number(portfolioValue.toFixed(2)),
      holdings: { ...holdings }
    });
  });
  
  return timeline;
};

