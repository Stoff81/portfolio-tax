import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AssetPanel = ({ priceHistory, assets }) => {
  if (!priceHistory || !assets || Object.keys(priceHistory).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Asset Prices</h2>
        <p className="text-gray-600">Loading asset data...</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = [];
  const priceHistoryLengths = Object.values(priceHistory).map(h => h?.length || 0);
  const maxLength = priceHistoryLengths.length > 0 ? Math.max(...priceHistoryLengths) : 0;
  
  for (let i = 0; i < maxLength; i++) {
    const dataPoint = {
      date: priceHistory.BTC[i]?.date || new Date(2024, 0, 1 + i)
    };
    
    Object.keys(priceHistory).forEach(assetId => {
      const price = priceHistory[assetId][i]?.price || priceHistory[assetId][priceHistory[assetId].length - 1]?.price || 0;
      // Ensure price is positive for logarithmic scale (log scale requires values > 0)
      // Use actual price if > 0, otherwise use a small positive value
      dataPoint[assetId] = price > 0 ? Number(price.toFixed(2)) : 0.01;
    });
    
    chartData.push(dataPoint);
  }

  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date;
  };

  const formatPrice = (value) => {
    if (value < 1) return `$${value.toFixed(4)}`;
    if (value < 1000) return `$${value.toFixed(2)}`;
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  // Format Y-axis: scale by 1000 and remove decimals for large numbers
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Calculate min and max prices for log scale domain
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  chartData.forEach(point => {
    Object.keys(priceHistory).forEach(assetId => {
      const price = point[assetId];
      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });
  });
  
  // Set domain for log scale (ensure min is > 0)
  const logDomain = [Math.max(0.01, minPrice * 0.9), maxPrice * 1.1];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Asset Prices</h2>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.keys(assets).map(assetId => {
          const asset = assets[assetId];
          const latestPrice = priceHistory[assetId]?.[priceHistory[assetId].length - 1]?.price || 0;
          return (
            <div key={assetId} className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">{asset.name}</div>
              <div className="text-xl font-bold text-gray-800">{formatPrice(latestPrice)}</div>
            </div>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            scale="log"
            type="number"
            domain={logDomain}
          />
          <Tooltip 
            formatter={(value) => formatPrice(value)}
            labelFormatter={(label) => formatDate(label)}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="BTC" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="Bitcoin"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="ETH" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Ethereum"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="DOGE" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Dogecoin"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AssetPanel;

