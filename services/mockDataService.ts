import { BacktestResult, ChartDataPoint } from "../types";

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
export const runMultiFactorBacktest = (): BacktestResult => {
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
    
    // Simulate Optimized Portfolio - Smoother returns, better alpha
    const marketReturn = (Math.random() - 0.45) * 0.02; 
    // Alpha is more consistent due to diversification
    const alpha = (Math.random() - 0.30) * 0.012; 
    
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
      sharpeRatio: 2.5 + Math.random(), // Higher Sharpe for multi-factor
      maxDrawdown: -0.08 + (Math.random() * 0.03), // Lower Drawdown
      winRate: 0.65,
      alpha: 0.15,
      beta: 0.10 // Market neutral-ish
    }
  };
};