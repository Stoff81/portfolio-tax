# Portfolio Tax Comparison Application

A browser-based React application that simulates investment portfolios and compares tax implications between transaction-based and portfolio-level tax strategies.

## 🎯 Purpose

This application helps users understand the financial impact of different tax approaches:
- **Transaction-Based Tax**: Tax on every buy/sell transaction
- **Portfolio-Level Tax**: Tax only on portfolio inputs/outputs

## ✨ Features

- **Three Simulation Scenarios**: Active Trading, Moderate Trading, and Buy & Hold
- **Two Tax Strategies**: Side-by-side comparison of tax approaches
- **Three Assets**: Simulated portfolio with multiple asset types
- **Visual Comparisons**: Charts and graphs showing tax differences

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd portfolio-tax

# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000` (or the configured port).

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
portfolio-tax/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard/       # Main dashboard
│   │   ├── TaxComparison/   # Tax strategy comparison
│   │   ├── ScenarioView/    # Scenario visualization
│   │   ├── AssetPanel/      # Asset price display
│   │   └── ExportButton/    # PDF export functionality
│   ├── utils/               # Calculation utilities
│   │   ├── taxCalculations.js
│   │   ├── portfolioSimulator.js
│   │   └── dataGenerator.js
│   ├── data/                # Static data and configurations
│   ├── styles/              # CSS/styling files
│   ├── App.js               # Main app component
│   └── index.js             # Entry point
├── public/                  # Static assets
├── SPEC.md                  # Detailed specification
└── README.md               # This file
```

## 🧮 How It Works

### Tax Calculation Methods

#### Transaction-Based Tax
- Calculates capital gains/losses for each transaction
- Applies tax immediately on each trade
- Tracks cost basis per transaction

#### Portfolio-Level Tax
- Only taxes net cash flows (deposits/withdrawals)
- No tax on intermediate transactions
- Simpler tax structure

### Simulation Scenarios

1. **Active Trading**: High-frequency transactions, frequent rebalancing
2. **Moderate Trading**: Periodic transactions, strategic adjustments
3. **Buy and Hold**: Minimal transactions, long-term strategy

## 🛠️ Technology Stack

- **React**: UI framework
- **Vite**: Build tool and dev server
- **Recharts/Chart.js**: Data visualization
- **jsPDF/react-pdf**: PDF export functionality
- **CSS Modules**: Component styling

## 📊 Usage

1. **Configure Portfolio**
   - Set initial investment amount
   - Choose asset allocation
   - Select time period

2. **Run Simulations**
   - View three different trading scenarios
   - Compare tax outcomes side-by-side

3. **Analyze Results**
   - Review tax differences
   - Explore transaction details
   - View visualizations

4. **Export Report**
   - Generate PDF with results
   - Share or save for reference

## 🧪 Development

### Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Run linter
```

### Code Style
- Follow React best practices
- Use functional components and hooks
- Maintain component modularity
- Write clear, documented code

## 📝 License

[To be determined]

## 🤝 Contributing

[To be determined]

## 📧 Contact

[To be determined]

---

**Note**: This is a planning/specification phase. Development will begin after review and approval of the specification.

