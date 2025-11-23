import { Factor, Portfolio, FactorFrequency } from '../types';
import JSZip from 'jszip';

// Helper to download blob
const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Generate Mock Daily CSV Data (Low Freq)
const generateDailyCSVData = (rows = 252) => {
    let csvContent = "date,open,high,low,close,volume\n";
    let price = 150.00;
    const now = new Date();
    
    for (let i = rows; i > 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const change = (Math.random() - 0.48) * 0.03;
        const open = price;
        const close = price * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.015);
        const low = Math.min(open, close) * (1 - Math.random() * 0.015);
        const volume = Math.floor(1000000 + Math.random() * 500000);
        
        csvContent += `${dateStr},${open.toFixed(2)},${high.toFixed(2)},${low.toFixed(2)},${close.toFixed(2)},${volume}\n`;
        price = close;
    }
    return csvContent;
};

// Generate Mock Intraday CSV Data (High Freq - Minute Bars with Order Book)
const generateIntradayCSVData = (minutes = 390) => {
    // Header includes Microstructure data fields
    let csvContent = "timestamp,open,high,low,close,volume,bid,ask,bid_size,ask_size\n";
    let price = 150.00;
    
    // Start at 9:30 AM today
    const startTime = new Date();
    startTime.setHours(9, 30, 0, 0);
    
    for (let i = 0; i < minutes; i++) {
        const time = new Date(startTime.getTime() + i * 60000); // Add minutes
        // Format: YYYY-MM-DD HH:MM:SS
        const timeStr = time.toISOString().replace('T', ' ').substring(0, 19);
        
        const change = (Math.random() - 0.5) * 0.002; // Smaller volatility for minutes
        const open = price;
        const close = price * (1 + change);
        const high = Math.max(open, close) + 0.02;
        const low = Math.min(open, close) - 0.02;
        const volume = Math.floor(1000 + Math.random() * 5000);
        
        // Microstructure Simulation
        const spread = 0.01 + Math.random() * 0.02;
        const mid = close;
        const bid = parseFloat((mid - spread/2).toFixed(2));
        const ask = parseFloat((mid + spread/2).toFixed(2));
        const bidSize = Math.floor(100 + Math.random() * 500);
        const askSize = Math.floor(100 + Math.random() * 500);
        
        csvContent += `${timeStr},${open.toFixed(2)},${high.toFixed(2)},${low.toFixed(2)},${close.toFixed(2)},${volume},${bid},${ask},${bidSize},${askSize}\n`;
        price = close;
    }
    return csvContent;
};

// --- FACTOR EXPORT ---

export const exportFactorPackage = async (factor: Factor) => {
    const zip = new JSZip();
    const isHighFreq = factor.frequency === FactorFrequency.HIGH_FREQ;
    
    // 1. Add Data (Context Aware)
    const csvData = isHighFreq ? generateIntradayCSVData(390 * 3) : generateDailyCSVData(252 * 2); // 3 days for HF, 2 years for LF
    const dataFileName = isHighFreq ? "intraday_data.csv" : "market_data.csv";
    const indexCol = isHighFreq ? "timestamp" : "date";
    
    zip.file(dataFileName, csvData);

    // 2. Add Python Verification Script
    const pythonScript = `
import pandas as pd
import numpy as np

# ---------------------------------------------------------
# QuantFactor AI - Factor Verification Script
# Factor: ${factor.name}
# Type: ${isHighFreq ? 'High Frequency (Intraday)' : 'Low Frequency (Daily)'}
# ---------------------------------------------------------

def load_data(filepath):
    print(f"Loading data from {filepath}...")
    df = pd.read_csv(filepath)
    # Parse Index correctly based on frequency
    df['${indexCol}'] = pd.to_datetime(df['${indexCol}'])
    df.set_index('${indexCol}', inplace=True)
    return df

def calculate_factor(df):
    """
    Implements the factor logic exported from the platform.
    
    Original Formula:
    ${factor.formula}
    """
    print("Calculating factor logic...")
    
    # Safety copy
    data = df.copy()
    
    try:
        # For High Frequency factors, logic often involves order book columns
        # (bid, ask, bid_size, ask_size) which are present in the CSV.
        
        # Execute formula
        factor_values = ${factor.formula}
        
        return factor_values
    except Exception as e:
        print(f"Error executing formula: {e}")
        return pd.Series(np.nan, index=df.index)

def analyze_performance(df, factor_col):
    # Calculate Forward Returns for IC
    # LF: Next Day Return, HF: Next Minute Return
    df['next_ret'] = df['close'].shift(-1) / df['close'] - 1
    
    valid_data = df[[factor_col, 'next_ret']].dropna()
    ic = valid_data[factor_col].corr(valid_data['next_ret'])
    
    print("-" * 30)
    print(f"Verification Metrics")
    print("-" * 30)
    print(f"Horizon: {'1-Minute' if isHighFreq else '1-Day'}")
    print(f"Information Coefficient (IC): {ic:.4f}")
    print(f"Data Points: {len(valid_data)}")
    print("-" * 30)

if __name__ == "__main__":
    # 1. Load the raw data included in this package
    df = load_data('${dataFileName}')
    
    # 2. Calculate the factor
    df['factor_value'] = calculate_factor(df)
    
    # 3. Output results
    print("\\nSample Factor Values (Head):")
    cols_to_show = ['close', 'factor_value']
    if 'bid_size' in df.columns:
        cols_to_show = ['close', 'bid_size', 'ask_size', 'factor_value']
        
    print(df[cols_to_show].head())
    
    # 4. Verify Performance
    analyze_performance(df, 'factor_value')
    
    # 5. Save output
    df.to_csv('factor_verification_result.csv')
    print("\\nFull results saved to 'factor_verification_result.csv'")
`;

    zip.file("verify_factor.py", pythonScript);
    
    // 3. Metadata
    zip.file("metadata.json", JSON.stringify(factor, null, 2));

    // Generate and Download
    const content = await zip.generateAsync({type:"blob"});
    triggerDownload(content, `factor_verify_${factor.name.replace(/\s+/g, '_').toLowerCase()}.zip`);
};


// --- PORTFOLIO EXPORT ---

export const exportPortfolioPackage = async (portfolio: Portfolio, allFactors: Factor[]) => {
    const zip = new JSZip();

    // 1. Add Data (Portfolios assume Daily for now, but could be adapted)
    const csvData = generateDailyCSVData(500); 
    zip.file("market_data.csv", csvData);

    // 2. Identify used factors
    const usedFactors = allFactors.filter(f => portfolio.factorIds.includes(f.id));
    
    // 3. Generate Python Script
    let factorCalculations = "";
    usedFactors.forEach((f, i) => {
        factorCalculations += `
    # Factor ${i+1}: ${f.name}
    try:
        factors['${f.id}'] = ${f.formula}
    except:
        factors['${f.id}'] = 0
`;
    });

    const pythonScript = `
import pandas as pd
import numpy as np

# ---------------------------------------------------------
# QuantFactor AI - Portfolio Strategy Verification
# Portfolio: ${portfolio.name}
# Strategy: ${portfolio.strategy}
# ---------------------------------------------------------

def load_data():
    df = pd.read_csv('market_data.csv', parse_dates=['date'])
    df.set_index('date', inplace=True)
    return df

def run_portfolio_strategy():
    # 1. Setup Environment
    df = load_data()
    print(f"Loaded {len(df)} bars of market data.")
    
    # Initialize Factors DataFrame
    factors = pd.DataFrame(index=df.index)
    
    print("Calculating underlying factors...")
    ${factorCalculations}
    
    # Fill NaNs for calculation safety
    factors.fillna(0, inplace=True)
    
    # 2. Apply Weighting Scheme: ${portfolio.strategy}
    print("Applying weighting scheme: ${portfolio.strategy}...")
    
    num_factors = len(factors.columns)
    weights = pd.Series(0.0, index=factors.columns)
    
    if "${portfolio.strategy}" == "Equal Weight":
        weights[:] = 1.0 / num_factors
    elif "${portfolio.strategy}" == "Risk Parity":
        # Simple Inverse Volatility approximation
        vols = factors.rolling(60).std()
        inv_vols = 1.0 / vols
        # Normalize row-wise
        weights = inv_vols.div(inv_vols.sum(axis=1), axis=0)
        # For this script, we take the average weight over time
        weights = weights.mean()
    else:
        # Default fallback
        weights[:] = 1.0 / num_factors

    print("Calculated Weights:")
    print(weights)

    # 3. Apply Barra Constraints (Simulated)
    # Constraints: ${JSON.stringify(portfolio.constraints || {})}
    
    final_weights = weights.copy()
    
    # 4. Calculate Portfolio Signal
    # Weighted sum of factors
    portfolio_signal = (factors * final_weights).sum(axis=1)
    
    # 5. Backtest / Performance
    next_ret = df['close'].shift(-1) / df['close'] - 1
    strategy_ret = portfolio_signal.shift(1) * next_ret
    
    cum_ret = (1 + strategy_ret).cumprod()
    
    # Output
    print("\\n--- Performance Summary ---")
    print(f"Cumulative Return: {(cum_ret.iloc[-1] - 1)*100:.2f}%")
    print(f"Sharpe Ratio: {(strategy_ret.mean() / strategy_ret.std() * np.sqrt(252)):.2f}")
    
    # Save
    results = pd.DataFrame({
        'price': df['close'],
        'signal': portfolio_signal,
        'strategy_return': strategy_ret,
        'equity_curve': cum_ret
    })
    results.to_csv('portfolio_verification_result.csv')
    print("\\nDetailed logs saved to portfolio_verification_result.csv")

if __name__ == "__main__":
    run_portfolio_strategy()
`;

    zip.file("verify_portfolio.py", pythonScript);
    zip.file("portfolio_meta.json", JSON.stringify(portfolio, null, 2));

    const content = await zip.generateAsync({type:"blob"});
    triggerDownload(content, `portfolio_verify_${portfolio.name.replace(/\s+/g, '_').toLowerCase()}.zip`);
};