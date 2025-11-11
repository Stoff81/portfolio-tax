import React, { useState } from 'react';

const TransactionBreakdown = ({ scenarioData }) => {
  const [selectedStrategy, setSelectedStrategy] = useState('transaction');

  if (!scenarioData) return null;

  const { transactions, transactionTax, portfolioTax, portfolioTimeline } = scenarioData;

  const formatCurrency = (value) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Build transaction list with running totals
  const transactionList = [];
  let runningPortfolioValue = scenarioData.config?.initialValue || 100000;
  let runningTax = 0;
  let holdings = { USD: runningPortfolioValue, BTC: 0, ETH: 0, DOGE: 0 };
  
  // For portfolio-level tax, track cost basis using FIFO (always track, regardless of selected strategy)
  const costBasisHoldings = {
    USD: runningPortfolioValue,
    BTC: [],
    ETH: [],
    DOGE: []
  };
  const taxRate = scenarioData.config?.taxRate || 0.20;

  transactions.forEach((tx, index) => {
    // Update holdings
    if (tx.type === 'buy') {
      const cost = tx.quantity * tx.price;
      holdings.USD -= cost;
      holdings[tx.assetId] += tx.quantity;
      
      // Update cost basis holdings for portfolio-level tax (always track)
      costBasisHoldings.USD -= cost;
      costBasisHoldings[tx.assetId].push({
        quantity: tx.quantity,
        costBasis: tx.price
      });
    } else if (tx.type === 'sell') {
      const revenue = tx.quantity * tx.price;
      holdings.USD += revenue;
      holdings[tx.assetId] -= tx.quantity;
      
      // Update cost basis holdings for portfolio-level tax (FIFO) (always track)
      let remainingQty = tx.quantity;
      while (remainingQty > 0 && costBasisHoldings[tx.assetId].length > 0) {
        const holding = costBasisHoldings[tx.assetId][0];
        const qtyToSell = Math.min(remainingQty, holding.quantity);
        remainingQty -= qtyToSell;
        holding.quantity -= qtyToSell;
        if (holding.quantity <= 0) {
          costBasisHoldings[tx.assetId].shift();
        }
      }
      costBasisHoldings.USD += revenue;
    }

    // Calculate current portfolio value
    const getCurrentPrice = (assetId) => {
      const priceHistory = scenarioData.priceHistory[assetId];
      if (!priceHistory) return 0;
      const day = Math.floor((tx.timestamp - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24));
      return priceHistory[Math.min(day, priceHistory.length - 1)]?.price || 0;
    };

    runningPortfolioValue =
      holdings.USD +
      holdings.BTC * getCurrentPrice('BTC') +
      holdings.ETH * getCurrentPrice('ETH') +
      holdings.DOGE * getCurrentPrice('DOGE');

    // Get tax for this transaction
    let taxForThisTx = 0;
    let portfolioTaxOwed = 0;
    
    if (selectedStrategy === 'transaction') {
      // Transaction-based tax: only on sells
      if (tx.type === 'sell') {
        const taxEvent = transactionTax.taxEvents.find(te => te.transactionId === tx.id);
        if (taxEvent) {
          taxForThisTx = taxEvent.tax;
          runningTax += taxForThisTx;
        }
      }
    } else {
      // Portfolio-level tax: calculate as if entire portfolio was sold at this point
      // Calculate total cost basis
      let totalCostBasis = costBasisHoldings.USD;
      ['BTC', 'ETH', 'DOGE'].forEach(assetId => {
        costBasisHoldings[assetId].forEach(holding => {
          totalCostBasis += holding.quantity * holding.costBasis;
        });
      });
      
      // Current value is runningPortfolioValue
      const capitalGains = runningPortfolioValue - totalCostBasis;
      portfolioTaxOwed = Math.max(0, capitalGains * taxRate);
    }

    transactionList.push({
      ...tx,
      runningPortfolioValue: Number(runningPortfolioValue.toFixed(2)),
      taxForThisTx: Number(taxForThisTx.toFixed(2)),
      portfolioTaxOwed: Number(portfolioTaxOwed.toFixed(2)),
      runningTax: Number(runningTax.toFixed(2)),
      holdings: { ...holdings }
    });
  });

  // For portfolio-level, show final tax
  const finalPortfolioTax = portfolioTax.totalTax;

  return (
    <div>
      <div className="mb-4 flex gap-4">
        <button
          onClick={() => setSelectedStrategy('transaction')}
          className={`px-4 py-2 rounded-lg font-medium ${
            selectedStrategy === 'transaction'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Transaction-Based Tax
        </button>
        <button
          onClick={() => setSelectedStrategy('portfolio')}
          className={`px-4 py-2 rounded-lg font-medium ${
            selectedStrategy === 'portfolio'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Portfolio-Level Tax
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Portfolio Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax {selectedStrategy === 'transaction' ? 'Paid' : 'Owed'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {selectedStrategy === 'transaction' ? 'Cumulative Tax' : 'Tax Owed'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactionList.map((tx, index) => (
              <tr key={tx.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(tx.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      tx.type === 'buy'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tx.assetId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tx.quantity.toFixed(6)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(tx.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(tx.runningPortfolioValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {selectedStrategy === 'transaction' ? (
                    formatCurrency(tx.taxForThisTx)
                  ) : (
                    formatCurrency(tx.portfolioTaxOwed)
                  )}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  selectedStrategy === 'transaction' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {selectedStrategy === 'transaction' ? (
                    formatCurrency(tx.runningTax)
                  ) : (
                    formatCurrency(tx.portfolioTaxOwed)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td colSpan={7} className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                Total Tax {selectedStrategy === 'transaction' ? 'Paid' : 'Owed'}:
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {selectedStrategy === 'transaction' ? (
                  formatCurrency(transactionTax.totalTax)
                ) : (
                  formatCurrency(finalPortfolioTax)
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {selectedStrategy === 'portfolio' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Portfolio-level tax is calculated as if the entire portfolio was sold and withdrawn at each point in time. 
            The "Tax Owed" column shows the tax that would be owed if you liquidated the portfolio at that moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionBreakdown;

