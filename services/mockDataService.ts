import { BacktestResult, FactorFrequency, Portfolio, Factor } from "../types";

const API_BASE = "http://localhost:8000/api";

// --- HELPERS ---

const handleApiError = (e: any) => {
    console.error("Backend API Error:", e);
    // You could trigger a global notification here if context was available
    throw new Error("Failed to connect to Python Backend. Is it running on port 8000?");
};

// --- API CLIENT ---

export const runBacktest = async (
    formula: string, 
    frequency: FactorFrequency
): Promise<BacktestResult> => {
    try {
        const response = await fetch(`${API_BASE}/backtest/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                formula, 
                frequency,
                // Default params
                holding_period: "1 Day", 
                transaction_cost: 0.001 
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Backtest failed");
        }
        return await response.json();
    } catch (e) {
        handleApiError(e);
        // Return dummy to satisfy TS if needed, or rethrow
        throw e;
    }
};

export const runPortfolioOptimization = async (
    factors: Factor[],
    frequency: FactorFrequency,
    strategy: string
): Promise<BacktestResult> => {
    try {
        const response = await fetch(`${API_BASE}/portfolio/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                factor_formulas: factors.map(f => f.formula),
                frequency,
                strategy,
                constraints: {} // Pass complex constraints here in future
            })
        });

        if (!response.ok) {
            throw new Error("Optimization failed");
        }
        return await response.json();
    } catch (e) {
        handleApiError(e);
        throw e;
    }
};

// --- LEGACY EXPORTS (Kept for compatibility with other components) ---
// These now mostly just warn or call the API versions

export const runMockBacktest = () => { console.warn("Using Legacy Mock"); return null as any; };
export const runHighFreqBacktest = () => { console.warn("Using Legacy Mock"); return null as any; };
export const runMultiFactorBacktest = (freq: FactorFrequency) => { console.warn("Using Legacy Mock"); return null as any; };

export const generateOOSData = (portfolio: Portfolio, days: number = 30) => {
    // Keeping this purely client-side for visual simulation of "Live" tracking
    // This could also be moved to backend if we want real persistent tracking
    const data: { date: string, value: number }[] = [];
    let price = 1000; 
    const now = new Date();
    for(let i=0; i<days; i++) {
         const date = new Date(now);
         date.setDate(date.getDate() - (days - i));
         const decay = 0.8; 
         const vol = 0.02;
         const direction = (Math.random() - 0.45) * vol;
         const drift = (portfolio.performance.sharpe / 5) * 0.005 * decay;
         price = price * (1 + direction + drift);
         data.push({ date: date.toISOString().split('T')[0], value: price });
    }
    return data;
};
