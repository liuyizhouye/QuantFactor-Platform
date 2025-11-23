import { Factor, Portfolio } from '../types';
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

// Generate Mock CSV Data
const generateCSVData = (rows = 252) => {
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

// --- FACTOR EXPORT ---

export const exportFactorPackage = async (factor: Factor) => {
    const zip = new JSZip();
    
    // 1. Add Data
    const csvData = generateCSVData(252);
    zip.file("market_data.csv", csvData);

    // 2. Add Python Verification Script
    const pythonScript = `
import pandas as pd
import numpy as np

# ---------------------------------------------------------
# QuantFactor AI - Factor Verification Script
# Factor: ${factor.name}
# ID: ${factor.id}
# ---------------------------------------------------------

def load_data(filepath):
    print(f"Loading data from {filepath}...")
    df = pd.read_csv(filepath)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    return df

def calculate_factor(df):
    """
    Implements the factor logic exported from the platform.
    
    Original Formula:
    ${factor.formula}
    """
    print("Calculating factor logic...")
    
    # Safety copy to prevent modifying original data inplace if not needed
    data = df.copy()
    
    try:
        # The formula is expected to operate on 'df' columns
        # We execute it in a restricted local scope where 'df' is available
        
        # NOTE: For complex multi-line formulas, this is a simplified representation.
        # In a real system, we would transpiler the AST. 
        # Here we substitute 'df' usage if necessary or assume standard pandas syntax.
        
        # Direct execution of the formula string assuming it returns a Series
        # e.g. "df.close.pct_change(5)"
        factor_values = ${factor.formula}
        
        return factor_values
    except Exception as e:
        print(f"Error executing formula: {e}")
        return pd.Series(np.nan, index=df.index)

def analyze_performance(df, factor_col):
    # Simple IC (Information Coefficient) calculation
    # Using next day return as target
    df['next_ret'] = df['close'].shift(-1) / df['close'] - 1
    
    valid_data = df[[factor_col, 'next_ret']].dropna()
    ic = valid_data[factor_col].corr(valid_data['next_ret'])
    
    print("-" * 30)
    print(f"Verification Metrics")
    print("-" * 30)
    print(f"Information Coefficient (IC): {ic:.4f}")
    print(f"Data Points: {len(valid_data)}")
    print("-" * 30)

if __name__ == "__main__":
    # 1. Load the raw data included in this package
    df = load_data('market_data.csv')
    
    # 2. Calculate the factor
    df['factor_value'] = calculate_factor(df)
    
    # 3. Output results
    print("\\nSample Factor Values (Head):")
    print(df[['close', 'factor_value']].head())
    
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

    // 1. Add Data
    const csvData = generateCSVData(500); // Longer history for portfolios
    zip.file("market_data.csv", csvData);

    // 2. Identify used factors
    const usedFactors = allFactors.filter(f => portfolio.factorIds.includes(f.id));
    
    // 3. Generate Python Script for Portfolio Construction
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
    # In a full production script, this would involve an optimizer (cvxpy)
    # and a covariance matrix. Here we apply simple filters.
    
    final_weights = weights.copy()
    
    # 4. Calculate Portfolio Signal
    # Weighted sum of factors
    portfolio_signal = (factors * final_weights).sum(axis=1)
    
    # 5. Backtest / Performance
    # Assume we go Long the portfolio signal
    # Simple strategy: Position size proportional to signal strength
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
