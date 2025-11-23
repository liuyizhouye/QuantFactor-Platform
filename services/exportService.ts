import { Factor } from '../types';

export const exportFactorData = (factor: Factor) => {
  // Simulate fetching full granular data (normally from a DB or calculation engine)
  const validationData = generateValidationData();
  
  const exportObject = {
    meta: {
      id: factor.id,
      name: factor.name,
      exportedAt: new Date().toISOString(),
      platform: "QuantFactor AI",
      version: "1.0"
    },
    definition: {
      category: factor.category,
      frequency: factor.frequency,
      description: factor.description,
      formula_logic: factor.formula,
      language: "python/pandas"
    },
    // Backtest summary metrics
    performanceSummary: factor.performance ? factor.performance : "No backtest recorded",
    
    // "Full Process Data" simulation:
    // This represents the raw inputs and the calculated factor value for verification
    validationData: {
      description: "Sample input data and calculated factor values for logic verification (Last 100 periods)",
      schema: {
          date: "ISO8601 Date",
          symbol: "Ticker Symbol",
          close_price: "float",
          volume: "int",
          factor_value: "float (z-score)"
      },
      data: validationData
    }
  };

  const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `factor_pkg_${factor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateValidationData = () => {
    // Mock data generator for the export file to simulate "Full Process Data"
    return Array.from({length: 100}).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Mocking some price action
        const close = 150 + Math.sin(i * 0.1) * 10 + (Math.random() * 2);
        const volume = Math.floor(1000000 + Math.random() * 500000);
        
        // Mocking a factor value (e.g., standardized score)
        const factorValue = (Math.random() * 4 - 2).toFixed(4); 

        return {
            date: date.toISOString().split('T')[0],
            symbol: "AAPL",
            close_price: parseFloat(close.toFixed(2)),
            volume: volume,
            factor_value: parseFloat(factorValue)
        };
    });
}