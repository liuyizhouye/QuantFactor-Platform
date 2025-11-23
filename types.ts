export enum FactorFrequency {
  HIGH_FREQ = 'High Frequency (Intraday)',
  LOW_FREQ = 'Low Frequency (Daily)',
}

export enum FactorCategory {
  MOMENTUM = 'Momentum',
  VOLATILITY = 'Volatility',
  LIQUIDITY = 'Liquidity',
  MEAN_REVERSION = 'Mean Reversion',
  SENTIMENT = 'Sentiment',
  FUNDAMENTAL = 'Fundamental',
}

export interface Factor {
  id: string;
  name: string;
  description: string;
  formula: string; // Pseudo-code or Python pandas code
  frequency: FactorFrequency;
  category: FactorCategory;
  createdAt: string;
  performance?: {
    sharpe: number;
    ic: number; // Information Coefficient
    annualizedReturn: number;
    maxDrawdown: number;
  };
}

export interface BacktestResult {
  dates: string[];
  portfolioValue: number[];
  benchmarkValue: number[];
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    alpha: number;
    beta: number;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
}
