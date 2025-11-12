// Generate simulated price data for assets
export const generatePriceHistory = (assetId, days, basePrice, volatility, trend = 0) => {
  const prices = [];
  let currentPrice = basePrice;
  
  // Trend: positive value means upward trend (appreciation), negative means downward
  // Default is 0 (no trend, just random walk)
  // For BTC, we'll add a positive trend to make it more profitable
  const dailyTrend = trend / days; // Convert annual trend to daily
  
  for (let i = 0; i < days; i++) {
    // Random walk with volatility and optional trend
    const randomChange = (Math.random() - 0.5) * volatility * currentPrice;
    const trendChange = dailyTrend * currentPrice;
    currentPrice = Math.max(currentPrice + randomChange + trendChange, basePrice * 0.5); // Don't go below 50% of base
    prices.push({
      date: new Date(2024, 0, 1 + i),
      price: Number(currentPrice.toFixed(2))
    });
  }
  
  return prices;
};

// Generate transactions for different scenarios
export const generateTransactions = (scenario, assets, initialValue, days, priceHistory) => {
  const transactions = [];
  const allocations = {
    BTC: 0.5,
    ETH: 0.3,
    DOGE: 0.2
  };
  
  let portfolio = {
    USD: initialValue,
    BTC: 0,
    ETH: 0,
    DOGE: 0
  };
  
  const getPrice = (assetId, day) => {
    const history = priceHistory[assetId];
    if (!history || history.length === 0) return 1;
    if (day < 0) return history[0].price;
    if (day >= history.length) return history[history.length - 1].price;
    return history[day].price;
  };
  
  // Helper to get price trend (looking ahead/behind to simulate good/bad timing)
  const getPriceTrend = (assetId, day, lookAhead = 5) => {
    const currentPrice = getPrice(assetId, day);
    const futurePrice = getPrice(assetId, Math.min(day + lookAhead, days - 1));
    return futurePrice > currentPrice ? 'up' : 'down';
  };

  if (scenario === 'bad') {
    // Bad Trader: Buys high, sells low - loses money on most trades
    // Initial allocation first
    const btcPrice = getPrice('BTC', 0);
    const ethPrice = getPrice('ETH', 0);
    const dogePrice = getPrice('DOGE', 0);
    
    const btcQty = (initialValue * allocations.BTC) / btcPrice;
    const ethQty = (initialValue * allocations.ETH) / ethPrice;
    const dogeQty = (initialValue * allocations.DOGE) / dogePrice;
    
    portfolio.USD -= (btcQty * btcPrice + ethQty * ethPrice + dogeQty * dogePrice);
    portfolio.BTC += btcQty;
    portfolio.ETH += ethQty;
    portfolio.DOGE += dogeQty;
    
    transactions.push(
      {
        id: 'tx-0-0',
        type: 'buy',
        assetId: 'BTC',
        quantity: Number(btcQty.toFixed(6)),
        price: Number(btcPrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'bad'
      },
      {
        id: 'tx-0-1',
        type: 'buy',
        assetId: 'ETH',
        quantity: Number(ethQty.toFixed(6)),
        price: Number(ethPrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'bad'
      },
      {
        id: 'tx-0-2',
        type: 'buy',
        assetId: 'DOGE',
        quantity: Number(dogeQty.toFixed(6)),
        price: Number(dogePrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'bad'
      }
    );

    // Bad trader: Trades frequently but with poor timing
    for (let day = 7; day < days; day += Math.floor(Math.random() * 5) + 3) {
      const assetId = ['BTC', 'ETH', 'DOGE'][Math.floor(Math.random() * 3)];
      const price = getPrice(assetId, day);
      const trend = getPriceTrend(assetId, day);
      
      // Bad trader: Buys when price is going down, sells when price is going up
      // Uses larger trade sizes to make losses more visible
      if (trend === 'down' && portfolio.USD > price * 100) {
        // Buy when price is about to drop (bad timing) - use 30-50% of USD
        const quantity = (portfolio.USD / price) * (0.30 + Math.random() * 0.20);
        const cost = quantity * price;
        portfolio.USD -= cost;
        portfolio[assetId] += quantity;
        
        transactions.push({
          id: `tx-${day}-buy`,
          type: 'buy',
          assetId,
          quantity: Number(quantity.toFixed(6)),
          price: Number(price.toFixed(2)),
          timestamp: new Date(2024, 0, 1 + day),
          scenario: 'bad'
        });
      } else if (trend === 'up' && portfolio[assetId] > 0) {
        // Sell when price is about to rise (bad timing) - use 40-60% of holdings
        const quantity = portfolio[assetId] * (0.40 + Math.random() * 0.20);
        const revenue = quantity * price;
        portfolio.USD += revenue;
        portfolio[assetId] -= quantity;
        
        transactions.push({
          id: `tx-${day}-sell`,
          type: 'sell',
          assetId,
          quantity: Number(quantity.toFixed(6)),
          price: Number(price.toFixed(2)),
          timestamp: new Date(2024, 0, 1 + day),
          scenario: 'bad'
        });
      }
    }
  } else if (scenario === 'good') {
    // Good Trader: Buys low, sells high - makes money on most trades
    // Initial allocation first
    const btcPrice = getPrice('BTC', 0);
    const ethPrice = getPrice('ETH', 0);
    const dogePrice = getPrice('DOGE', 0);
    
    const btcQty = (initialValue * allocations.BTC) / btcPrice;
    const ethQty = (initialValue * allocations.ETH) / ethPrice;
    const dogeQty = (initialValue * allocations.DOGE) / dogePrice;
    
    portfolio.USD -= (btcQty * btcPrice + ethQty * ethPrice + dogeQty * dogePrice);
    portfolio.BTC += btcQty;
    portfolio.ETH += ethQty;
    portfolio.DOGE += dogeQty;
    
    transactions.push(
      {
        id: 'tx-0-0',
        type: 'buy',
        assetId: 'BTC',
        quantity: Number(btcQty.toFixed(6)),
        price: Number(btcPrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'good'
      },
      {
        id: 'tx-0-1',
        type: 'buy',
        assetId: 'ETH',
        quantity: Number(ethQty.toFixed(6)),
        price: Number(ethPrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'good'
      },
      {
        id: 'tx-0-2',
        type: 'buy',
        assetId: 'DOGE',
        quantity: Number(dogeQty.toFixed(6)),
        price: Number(dogePrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'good'
      }
    );

    // Good trader: Trades with good timing
    for (let day = 7; day < days; day += Math.floor(Math.random() * 7) + 5) {
      const assetId = ['BTC', 'ETH', 'DOGE'][Math.floor(Math.random() * 3)];
      const price = getPrice(assetId, day);
      const trend = getPriceTrend(assetId, day);
      
      // Good trader: Buys when price is going up, sells when price is going down
      // Uses larger trade sizes to make gains more visible
      if (trend === 'up' && portfolio.USD > price * 100) {
        // Buy when price is about to rise (good timing) - use 25-40% of USD
        const quantity = (portfolio.USD / price) * (0.25 + Math.random() * 0.15);
        const cost = quantity * price;
        portfolio.USD -= cost;
        portfolio[assetId] += quantity;
        
        transactions.push({
          id: `tx-${day}-buy`,
          type: 'buy',
          assetId,
          quantity: Number(quantity.toFixed(6)),
          price: Number(price.toFixed(2)),
          timestamp: new Date(2024, 0, 1 + day),
          scenario: 'good'
        });
      } else if (trend === 'down' && portfolio[assetId] > 0) {
        // Sell when price is about to drop (good timing) - use 35-50% of holdings
        const quantity = portfolio[assetId] * (0.35 + Math.random() * 0.15);
        const revenue = quantity * price;
        portfolio.USD += revenue;
        portfolio[assetId] -= quantity;
        
        transactions.push({
          id: `tx-${day}-sell`,
          type: 'sell',
          assetId,
          quantity: Number(quantity.toFixed(6)),
          price: Number(price.toFixed(2)),
          timestamp: new Date(2024, 0, 1 + day),
          scenario: 'good'
        });
      }
    }
  } else if (scenario === 'hold') {
    // Buy and Hold: Initial purchase, minimal transactions
    // Initial allocation
    const btcPrice = getPrice('BTC', 0);
    const ethPrice = getPrice('ETH', 0);
    const dogePrice = getPrice('DOGE', 0);
    
    const btcQty = (initialValue * allocations.BTC) / btcPrice;
    const ethQty = (initialValue * allocations.ETH) / ethPrice;
    const dogeQty = (initialValue * allocations.DOGE) / dogePrice;
    
    // Update portfolio state
    portfolio.USD -= (btcQty * btcPrice + ethQty * ethPrice + dogeQty * dogePrice);
    portfolio.BTC += btcQty;
    portfolio.ETH += ethQty;
    portfolio.DOGE += dogeQty;
    
    transactions.push(
      {
        id: 'tx-0-0',
        type: 'buy',
        assetId: 'BTC',
        quantity: Number(btcQty.toFixed(6)),
        price: Number(btcPrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'hold'
      },
      {
        id: 'tx-0-1',
        type: 'buy',
        assetId: 'ETH',
        quantity: Number(ethQty.toFixed(6)),
        price: Number(ethPrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'hold'
      },
      {
        id: 'tx-0-2',
        type: 'buy',
        assetId: 'DOGE',
        quantity: Number(dogeQty.toFixed(6)),
        price: Number(dogePrice.toFixed(2)),
        timestamp: new Date(2024, 0, 1),
        scenario: 'hold'
      }
    );
    
    // Buy and Hold: No additional transactions, just hold
    // Portfolio value will change only with asset price movements
  }
  
  return transactions.sort((a, b) => a.timestamp - b.timestamp);
};

// Initialize assets with price history
export const initializeAssets = (days = 1095) => {
  const assets = {
    BTC: {
      id: 'BTC',
      name: 'Bitcoin',
      basePrice: 45000,
      volatility: 0.03,
      trend: 0.30 // 30% annual appreciation for BTC (makes good trader more profitable)
    },
    ETH: {
      id: 'ETH',
      name: 'Ethereum',
      basePrice: 2500,
      volatility: 0.05,
      trend: 0.40 // 40% annual appreciation for ETH
    },
    DOGE: {
      id: 'DOGE',
      name: 'Dogecoin',
      basePrice: 0.08,
      volatility: 0.08,
      trend: 0.50 // 50% annual appreciation for DOGE
    }
  };
  
  const priceHistory = {};
  Object.keys(assets).forEach(assetId => {
    priceHistory[assetId] = generatePriceHistory(
      assetId,
      days,
      assets[assetId].basePrice,
      assets[assetId].volatility,
      assets[assetId].trend
    );
  });
  
  return { assets, priceHistory };
};

