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

// Simulate a backtest run
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
    
    // Simulate Strategy (Alpha)
    const marketReturn = (Math.random() - 0.45) * 0.02; // Market noise
    const alpha = (Math.random() - 0.35) * 0.015; // Positive expectancy
    
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
      sharpeRatio: 1.8 + Math.random(),
      maxDrawdown: -0.15 + (Math.random() * 0.05),
      winRate: 0.55,
      alpha: 0.12,
      beta: 0.85
    }
  };
};
