import React, { useState } from 'react';
import TaxComparison from './TaxComparison';
import TransactionBreakdown from './TransactionBreakdown';

const ScenarioView = ({ scenarioData }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!scenarioData) return null;

  const { name, transactionTax, portfolioTax, portfolioTimeline } = scenarioData;

  const formatCurrency = (value) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const currentPortfolioValue = portfolioTimeline[portfolioTimeline.length - 1]?.value || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Transaction-Based Strategy Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Transaction-Based Strategy</h3>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Current Portfolio Value</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(currentPortfolioValue)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Tax Paid</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(transactionTax.totalTax)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Portfolio-Level Strategy Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Portfolio-Level Strategy</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Current Portfolio Value</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(portfolioTax.currentPortfolioValue)}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Tax Owed</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(portfolioTax.totalTax)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TaxComparison scenarioData={scenarioData} />
        </>
      )}

      {activeTab === 'transactions' && (
        <TransactionBreakdown scenarioData={scenarioData} />
      )}
    </div>
  );
};

export default ScenarioView;

