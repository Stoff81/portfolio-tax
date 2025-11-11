import React, { useState, useEffect } from 'react';
import { simulatePortfolio } from '../utils/portfolioSimulator';
import AssetPanel from './AssetPanel';
import ScenarioView from './ScenarioView';

const Dashboard = () => {
  const [config, setConfig] = useState({
    initialValue: 100000,
    days: 365,
    taxRate: 0.20
  });
  
  const [simulationData, setSimulationData] = useState(null);
  const [activeScenario, setActiveScenario] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runSimulation();
  }, []);

  const runSimulation = () => {
    setIsLoading(true);
    // Simulate async operation
    setTimeout(() => {
      try {
        const data = simulatePortfolio(config);
        // Add config to each scenario for reference
        data.scenarios.forEach(scenario => {
          scenario.config = config;
        });
        setSimulationData(data);
      } catch (error) {
        console.error('Error running simulation:', error);
        alert('Error running simulation. Please check your configuration.');
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running simulation...</p>
        </div>
      </div>
    );
  }

  if (!simulationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Portfolio Tax Comparison
          </h1>
          <p className="text-gray-600">
            Compare transaction-based vs portfolio-level tax strategies
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Portfolio Value (USD)
              </label>
              <input
                type="number"
                value={config.initialValue}
                onChange={(e) => handleConfigChange('initialValue', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period (Days)
              </label>
              <input
                type="number"
                value={config.days}
                onChange={(e) => handleConfigChange('days', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="30"
                max="1095"
                step="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={config.taxRate * 100}
                onChange={(e) => handleConfigChange('taxRate', e.target.value / 100)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="50"
                step="1"
              />
            </div>
          </div>
          <button
            onClick={runSimulation}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Run Simulation
          </button>
        </div>

        {/* Asset Panel */}
        <AssetPanel 
          priceHistory={simulationData.priceHistory} 
          assets={simulationData.assets}
        />

        {/* Scenario Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            {simulationData.scenarios.map((scenario, index) => (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(index)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeScenario === index
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Scenario View */}
        {simulationData.scenarios[activeScenario] && (
          <ScenarioView scenarioData={simulationData.scenarios[activeScenario]} />
        )}

        {/* Summary Comparison */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Summary Comparison</h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scenario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Portfolio Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Portfolio Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Savings
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {simulationData.scenarios.map((scenario) => {
                  const finalValue = scenario.portfolioTimeline[scenario.portfolioTimeline.length - 1]?.value || 0;
                  const taxSavings = Math.abs(scenario.transactionTax.totalTax - scenario.portfolioTax.totalTax);
                  return (
                    <tr key={scenario.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {scenario.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${finalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        ${scenario.transactionTax.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        ${scenario.portfolioTax.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                        ${taxSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

