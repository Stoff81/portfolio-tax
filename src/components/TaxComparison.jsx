import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const TaxComparison = ({ scenarioData }) => {
  if (!scenarioData) return null;

  const { transactionTax, portfolioTax, portfolioTimeline, cumulativeTaxTimeline } = scenarioData;

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
  const combinedTimeline = portfolioTimeline.map((point, index) => {
    const transactionTaxPoint = cumulativeTaxTimeline[index];
    const portfolioTaxPoint = scenarioData.portfolioTaxTimeline?.[index];
    return {
      date: point.date,
      portfolioValue: point.value,
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
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Transaction-Based</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(transactionTax.totalTax)}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Portfolio-Level</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(portfolioTax.totalTax)}
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-gray-600">Tax Difference</div>
          <div className="text-xl font-bold text-yellow-700">
            {formatCurrency(Math.abs(transactionTax.totalTax - portfolioTax.totalTax))}
          </div>
        </div>
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
              dataKey="portfolioValue" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Portfolio Value"
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

