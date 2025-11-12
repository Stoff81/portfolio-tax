import React, { useState } from 'react';
import TaxComparison from './TaxComparison';
import TransactionBreakdown from './TransactionBreakdown';
import { getHigherPortfolioValueStrategy, getHigherTaxStrategy } from '../utils/strategyComparison';

const ScenarioView = ({ scenarioData }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!scenarioData) return null;

  const { name, transactionTax, portfolioTax, portfolioTimeline } = scenarioData;

  const formatCurrency = (value) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const currentPortfolioValue = portfolioTimeline[portfolioTimeline.length - 1]?.value || 0;
  
  // Determine which strategy has higher portfolio value
  const higherValueStrategy = getHigherPortfolioValueStrategy(
    currentPortfolioValue,
    portfolioTax.currentPortfolioValue
  );
  
  // Determine which strategy has higher tax
  const higherTaxStrategy = getHigherTaxStrategy(
    transactionTax.totalTax,
    portfolioTax.totalTax
  );

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
                <div className="bg-purple-50 p-4 rounded-lg relative">
                  <div className="text-sm text-gray-600">Current Portfolio Value</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(currentPortfolioValue)}
                  </div>
                  {higherValueStrategy === 'transaction' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                      <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Trader's Preference</span>
                    </div>
                  )}
                </div>
                <div className="bg-purple-50 p-4 rounded-lg relative">
                  <div className="text-sm text-gray-600">Tax Paid</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(transactionTax.totalTax)}
                  </div>
                  {higherTaxStrategy === 'transaction' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                      <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>IRD's Preference</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Portfolio-Level Strategy Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Portfolio-Level Strategy</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg relative">
                  <div className="text-sm text-gray-600">Current Portfolio Value</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(portfolioTax.currentPortfolioValue)}
                  </div>
                  {higherValueStrategy === 'portfolio' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                      <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Trader's Preference</span>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 p-4 rounded-lg relative">
                  <div className="text-sm text-gray-600">Tax Owed</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(portfolioTax.totalTax)}
                  </div>
                  {higherTaxStrategy === 'portfolio' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                      <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>IRD's Preference</span>
                    </div>
                  )}
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

