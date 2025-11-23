
import { BacktestResult, ChartDataPoint, FactorFrequency, Portfolio } from "../types";

// Generate a random walk for stock prices
export const generateMarketData = (days: number = 252) => {
  let price = 100;
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    
    const change = (Math.random() - 0.48) * 2; // Slight upward drift
    price = price * (1 + change / 100);
    
    data.push({
      name: date.toISOString().split('T')[0],
      value: parseFloat(price.toFixed(2)),
      value2: Math.floor(Math.random() * 1000000) // Volume
    });
  }
  return data;
};

// Simulate a Single Factor Low Frequency backtest run (Daily)
export const runMockBacktest = (): BacktestResult => {
  const days = 252;
  const dates: string[] = [];
  const portfolioValue: number[] = [];
  const benchmarkValue: number[] = [];
  
  let pVal = 100000;
  let bVal = 100000;
  
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    dates.push(date.toISOString().split('T')[0]);
    
    // Simulate Strategy (Alpha) - Single Factor has higher variance
    const marketReturn = (Math.random() - 0.45) * 0.02; // Market noise
    const alpha = (Math.random() - 0.40) * 0.02; // Volatile alpha
    
    pVal = pVal * (1 + marketReturn + alpha);
    bVal = bVal * (1 + marketReturn);
    
    portfolioValue.push(parseFloat(pVal.toFixed(2)));
    benchmarkValue.push(parseFloat(bVal.toFixed(2)));
  }
  
  const totalReturn = (pVal - 100000) / 100000;
  
  return {
    dates,
    portfolioValue,
    benchmarkValue,
    metrics: {
      totalReturn,
      sharpeRatio: 1.2 + Math.random() * 0.5,
      maxDrawdown: -0.18 + (Math.random() * 0.05),
      winRate: 0.52,
      alpha: 0.08,
      beta: 0.95
    }
  };
};

// Simulate a High Frequency Intraday Backtest (Minute level)
export const runHighFreqBacktest = (): BacktestResult => {
  const minutes = 390; // One trading day (6.5 hours)
  const dates: string[] = [];
  const portfolioValue: number[] = [];
  const benchmarkValue: number[] = [];
  
  let pVal = 100000;
  let bVal = 100000;
  
  // Start at 9:30 AM
  const startObj = new Date();
  startObj.setHours(9, 30, 0, 0);
  
  for (let i = 0; i < minutes; i++) {
    const date = new Date(startObj.getTime() + i * 60000);
    dates.push(date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    
    // HF Strategy: More noise, smaller alpha per trade, but cumulative
    const marketNoise = (Math.random() - 0.5) * 0.0005; 
    const hfAlpha = (Math.random() - 0.45) * 0.0008; // Small edge per minute
    
    pVal = pVal * (1 + marketNoise + hfAlpha);
    bVal = bVal * (1 + marketNoise);
    
    portfolioValue.push(parseFloat(pVal.toFixed(2)));
    benchmarkValue.push(parseFloat(bVal.toFixed(2)));
  }
  
  const totalReturn = (pVal - 100000) / 100000;
  
  return {
    dates,
    portfolioValue,
    benchmarkValue,
    metrics: {
      totalReturn,
      sharpeRatio: 3.5 + Math.random(), // HF usually has high intraday Sharpe
      maxDrawdown: -0.02 + (Math.random() * 0.01), // Very tight DD
      winRate: 0.58,
      profitFactor: 1.4,
      avgTradeDuration: "45s",
      fillRate: 0.92,
      totalTrades: 452
    }
  };
};


// Simulate a Multi-Factor Portfolio backtest (Barra Optimized)
export const runMultiFactorBacktest = (frequency: FactorFrequency = FactorFrequency.LOW_FREQ): BacktestResult => {
  const isHighFreq = frequency === FactorFrequency.HIGH_FREQ;
  const periods = isHighFreq ? 390 : 252; // Minutes vs Days
  
  const dates: string[] = [];
  const portfolioValue: number[] = [];
  const benchmarkValue: number[] = [];
  
  let pVal = 100000;
  let bVal = 100000;
  
  const now = new Date();
  // For HF setup
  const startObj = new Date();
  startObj.setHours(9, 30, 0, 0);
  
  for (let i = 0; i < periods; i++) {
    let dateStr = "";
    if (isHighFreq) {
        const date = new Date(startObj.getTime() + i * 60000);
        dateStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
        const date = new Date(now);
        date.setDate(date.getDate() - (periods - i));
        dateStr = date.toISOString().split('T')[0];
    }
    dates.push(dateStr);
    
    // Simulation Logic
    const vol = isHighFreq ? 0.0005 : 0.015;
    const marketReturn = (Math.random() - 0.48) * vol; 
    
    // Multi-factor alpha is smoother and more positive than single factor
    const alphaMean = isHighFreq ? 0.0002 : 0.0008;
    const alpha = (Math.random() - 0.35) * (vol * 0.6) + alphaMean; 
    
    pVal = pVal * (1 + marketReturn + alpha);
    bVal = bVal * (1 + marketReturn);
    
    portfolioValue.push(parseFloat(pVal.toFixed(2)));
    benchmarkValue.push(parseFloat(bVal.toFixed(2)));
  }
  
  const totalReturn = (pVal - 100000) / 100000;
  
  return {
    dates,
    portfolioValue,
    benchmarkValue,
    metrics: {
      totalReturn,
      sharpeRatio: isHighFreq ? 4.5 + Math.random() : 2.5 + Math.random(), // HF Basket often has very high Sharpe
      maxDrawdown: isHighFreq ? -0.01 : -0.08 + (Math.random() * 0.03), 
      winRate: isHighFreq ? 0.62 : 0.58,
      alpha: isHighFreq ? undefined : 0.15, // Only relevant for LF
      beta: isHighFreq ? 0.02 : 0.10, // Market neutral-ish
      fillRate: isHighFreq ? 0.98 : undefined,
      totalTrades: isHighFreq ? 1250 : undefined
    }
  };
};

// Simulate Out-of-Sample (OOS) Live Performance
export const generateOOSData = (portfolio: Portfolio, days: number = 30): { date: string, value: number }[] => {
    const isHighFreq = portfolio.frequency === FactorFrequency.HIGH_FREQ;
    const data: { date: string, value: number }[] = [];
    let price = 1000; // Start normalized for comparison
    
    // Use hash of ID to make random but consistent per portfolio
    const seed = portfolio.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const pseudoRandom = (i: number) => {
        const x = Math.sin(seed + i) * 10000;
        return x - Math.floor(x);
    };

    const now = new Date();
    
    for(let i=0; i<days; i++) {
         const date = new Date(now);
         date.setDate(date.getDate() - (days - i));
         const dateStr = date.toISOString().split('T')[0];

         // Simulate Alpha Decay: OOS performance is usually worse than backtest
         const decayFactor = 0.8; 
         const baseVol = isHighFreq ? 0.008 : 0.02;
         const direction = (pseudoRandom(i) - 0.45) * baseVol; // Bias slightly positive but noisy
         
         // Apply portfolio specific 'quality' (Sharpe) to the drift
         const qualityDrift = (portfolio.performance.sharpe / 5) * 0.005 * decayFactor;

         price = price * (1 + direction + qualityDrift);
         
         data.push({
             date: dateStr,
             value: price
         });
    }

    return data;
};
