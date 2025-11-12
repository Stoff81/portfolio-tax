import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const TaxComparison = ({ scenarioData }) => {
  if (!scenarioData) return null;

  const { transactionTax, portfolioTax, portfolioTimeline, portfolioTimelinePortfolioLevel, cumulativeTaxTimeline } = scenarioData;

  const comparisonData = [
    {
      name: 'Transaction-Based',
      tax: transactionTax.totalTax,
      color: '#ef4444'
    },
    {
      name: 'Portfolio-Level',
      tax: portfolioTax.totalTax,
      color: '#3b82f6'
    }
  ];

  const formatCurrency = (value) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format Y-axis: scale by 1000 and remove decimals for large numbers
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Combine portfolio value and tax timeline
  // Match dates between transaction-based and portfolio-level timelines
  const combinedTimeline = portfolioTimeline.map((point, index) => {
    const transactionTaxPoint = cumulativeTaxTimeline[index];
    const portfolioTaxPoint = scenarioData.portfolioTaxTimeline?.[index];
    
    // Find matching portfolio-level point by date
    const portfolioLevelPoint = portfolioTimelinePortfolioLevel?.find(
      p => p.date.getTime() === point.date.getTime()
    );
    
    return {
      date: point.date,
      portfolioValueTransaction: point.value, // Transaction-based (with tax deducted)
      portfolioValuePortfolio: portfolioLevelPoint?.value || point.value, // Portfolio-level (without tax deducted)
      transactionTax: transactionTaxPoint?.tax || 0,
      portfolioTax: portfolioTaxPoint?.tax || 0
    };
  });

  return (
    <div className="space-y-6 mb-6">
      {/* Tax Comparison Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Total Tax Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="tax" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio Value Over Time */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Portfolio Value Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedTimeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
            />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="portfolioValueTransaction" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Transaction-Based Portfolio Value"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="portfolioValuePortfolio" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Portfolio-Level Portfolio Value"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Tax Over Time */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Cumulative Tax Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedTimeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
            />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="transactionTax" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Transaction Tax (Paid)"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="portfolioTax" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Portfolio Tax (Owed)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaxComparison;

