import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AssetPanel = ({ priceHistory, assets }) => {
  if (!priceHistory || !assets || Object.keys(priceHistory).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Asset Prices</h2>
        <p className="text-gray-600">Loading asset data...</p>
      </div>
    );
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
    return `$${value.toFixed(2)}`;
  };

  // Asset colors
  const assetColors = {
    BTC: '#f59e0b',
    ETH: '#3b82f6',
    DOGE: '#10b981'
  };

  // Create chart data for each asset
  const createChartData = (assetId) => {
    const history = priceHistory[assetId] || [];
    return history.map(point => ({
      date: point.date,
      price: point.price
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Asset Prices</h2>
      <div className="space-y-8">
        {Object.keys(assets).map(assetId => {
          const asset = assets[assetId];
          const chartData = createChartData(assetId);
          const color = assetColors[assetId] || '#6b7280';

          return (
            <div key={assetId} className="flex gap-4">
              {/* Asset name on the left */}
              <div className="flex-shrink-0 w-32 flex items-center">
                <h3 className="text-lg font-bold text-gray-800">{asset.name}</h3>
              </div>
              
              {/* Chart on the right */}
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <YAxis 
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip 
                      formatter={(value) => formatPrice(value)}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={color} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetPanel;

