# Portfolio Tax Comparison Application - Specification

## Overview
A browser-based application that demonstrates the tax implications of different investment tax strategies by simulating portfolio transactions and comparing tax outcomes.

## Purpose
The application allows users to visualize and compare:
- **Transaction-Based Tax**: Paying tax on every individual investment transaction (buy/sell)
- **Portfolio-Level Tax**: Paying tax only on the overall portfolio inputs (deposits) and outputs (withdrawals)

## Core Features

### 1. Tax Strategy Options (2 Flavors)
- **Option A: Transaction-Based Tax**
  - Tax calculated on each buy/sell transaction
  - Capital gains/losses calculated per transaction
  - Tax applied immediately on each trade
  
- **Option B: Portfolio-Level Tax**
  - Tax calculated only on net portfolio value changes
  - Tax applied on deposits (inputs) and withdrawals (outputs)
  - No tax on intermediate transactions
  - Should show owed tax at current portfolio balance

### 2. Portfolio Trading Scenarios (3 Scenarios)
Each scenario simulates the same portfolio with different transaction patterns:
Any trade will always be against the USD pair.

- **Scenario 1: Active Trading**
  - Multiple buy/sell transactions
  - Frequent rebalancing
  - High transaction volume

- **Scenario 2: Moderate Trading**
  - Periodic transactions
  - Strategic rebalancing
  - Moderate transaction volume

- **Scenario 3: Buy and Hold**
  - Minimal transactions
  - Long-term holding strategy
  - Low transaction volume

### 3. Asset Configuration
- **Three Separate Assets** with simulated prices:
  - BTC: (e.g., Stock A)
  - ETH: (e.g., Stock B)
  - DOGE: (e.g., Stock C)
  - USD: (Does not change, this is the denominator of the other assets, tax is paid in this too)

### 4. Portfolio 
- Same portfolio composition across all three scenarios
- Same initial investment amount
- Same time period
- Different transaction patterns per scenario
- Will show running portfolio value in USD and tax paid to date, for each trade

## User Interface Components

### Main Dashboard
- Side-by-side comparison of two tax strategies
- Three scenario tabs or sections
- Asset price display panel
- Transaction timeline visualization

### Input Controls
- Initial portfolio value
- Asset allocation percentages
- Transaction frequency settings
- Tax rate configuration
- Time period selection

### Output Displays
- Total tax paid comparison (by strategy)
- Net portfolio value comparison
- Transaction-by-transaction breakdown
- Cumulative tax visualization
- Summary statistics

### Export Functionality
- Include charts and tables
- Comparison summary report

## Technical Requirements

### Technology Stack
- **Frontend Framework**: React
- **Build Tool**: Vite (recommended) or Create React App
- **Styling**: CSS Modules, Styled Components, or Tailwind CSS
- **Charts/Visualization**: Recharts, Chart.js, or D3.js
- **State Management**: React Hooks (useState, useContext) or Redux

### Data Structure
```
Portfolio {
  initialValue: number
  assets: Asset[]
  transactions: Transaction[]
  scenarios: Scenario[]
}

Asset {
  id: string
  name: string
  price: number
  priceHistory: PricePoint[]
}

Transaction {
  id: string
  type: 'buy' | 'sell'
  assetId: string
  quantity: number
  price: number
  timestamp: Date
  scenario: string
}

TaxCalculation {
  strategy: 'transaction' | 'portfolio'
  totalTax: number
  transactions: TaxEvent[]
}

Scenario {
  id: string
  name: string
  transactions: Transaction[]
  description: string
}
```

### Calculation Logic

#### Transaction-Based Tax
```
For each transaction:
  - Calculate capital gain/loss: (sellPrice - buyPrice) * quantity
  - Apply tax rate to gain
  - Accumulate total tax
```

#### Portfolio-Level Tax
```
For portfolio inputs/outputs:
  - Track net deposits/withdrawals
  - Calculate portfolio value change
  - Apply tax only on net cash flow
  - No tax on intermediate transactions
```

## User Flow

1. **Setup Phase**
   - User configures initial portfolio value
   - User sets asset allocation
   - User selects time period

2. **Simulation Phase**
   - System generates three scenarios with different transaction patterns
   - System calculates tax for both strategies
   - System displays results side-by-side

3. **Analysis Phase**
   - User reviews tax differences
   - User explores transaction details
   - User compares scenarios

## Visual Design Requirements

### Layout
- Responsive design (desktop-first, mobile-friendly)
- Clear visual separation between tax strategies
- Intuitive navigation between scenarios
- Prominent comparison metrics

### Color Scheme
- Distinct colors for each tax strategy
- Neutral colors for shared elements
- Clear visual hierarchy

### Charts & Graphs
- Line charts for portfolio value over time
- Bar charts for tax comparison
- Transaction timeline visualization
- Asset price charts

## Future Enhancements (Out of Scope for MVP)
- Custom transaction input
- Multiple tax rate configurations
- Historical price data integration
- More asset types
- Advanced tax rules (wash sales, long-term vs short-term)
- User account/save scenarios

## Success Criteria
- Clear visualization of tax differences
- Accurate tax calculations
- Intuitive user interface
- Responsive and performant

