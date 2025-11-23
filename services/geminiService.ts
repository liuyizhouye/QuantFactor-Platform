import { GoogleGenAI, Type } from "@google/genai";
import { FactorFrequency, FactorCategory, Factor } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- DATA DICTIONARY CONTEXT ---
// This ensures the AI uses ACTUAL database columns, not hallucinated ones.
const LOW_FREQ_SCHEMA = `
AVAILABLE DATA COLUMNS (Low Frequency / Daily):
1. Market Data (df_price):
   - open, high, low, close, volume, vwap, turnover_value
2. Fundamental Data (df_fundamental):
   - pe_ttm (Price to Earnings Trailing 12M)
   - pb_ratio (Price to Book)
   - ps_ratio (Price to Sales)
   - roe_ttm (Return on Equity)
   - roa_ttm (Return on Assets)
   - debt_to_equity (Total Debt / Total Equity)
   - free_cash_flow_yield (FCF / Market Cap)
   - gross_margin (Gross Profit / Revenue)
   - revenue_growth_yoy (Year over Year Revenue Growth)
   - eps_growth_yoy (Year over Year EPS Growth)
3. Estimates/Analyst (df_estimates):
   - eps_surprise (Actual EPS - Estimated EPS)
   - rating_avg (1=Buy, 5=Sell)
`;

const HIGH_FREQ_SCHEMA = `
AVAILABLE DATA COLUMNS (High Frequency / Intraday):
1. Tick/Bar Data (df_1min):
   - open, high, low, close, volume, vwap
   - timestamp (Unix ms)
2. Order Book / L1 (df_l1):
   - bid_price_1, ask_price_1
   - bid_size_1, ask_size_1
   - bid_price_2, ask_price_2 (and so on up to level 5)
   - spread_bps (Ask - Bid in basis points)
   - mid_price
3. Trade Flow (df_trades):
   - buy_volume (Aggressive Buy Volume)
   - sell_volume (Aggressive Sell Volume)
   - trade_count (Number of trades in bar)
`;

export const generateFactorSuggestion = async (
  prompt: string, 
  frequency: FactorFrequency
): Promise<{ name: string; description: string; formula: string; category: string; logic_explanation: string }> => {
  
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const modelId = 'gemini-2.5-flash';
  const isHighFreq = frequency === FactorFrequency.HIGH_FREQ;
  const schemaContext = isHighFreq ? HIGH_FREQ_SCHEMA : LOW_FREQ_SCHEMA;
  
  const systemInstruction = `
    You are a world-class Quantitative Researcher.
    Your goal is to write EXECUTABLE Python pandas code for alpha factors.
    
    CRITICAL RULE:
    You must ONLY use the data columns provided in the "AVAILABLE DATA COLUMNS" list below. 
    Do NOT invent columns like 'df.sentiment' or 'df.my_ratio' if they are not in the list.
    If a ratio needs to be calculated (e.g., Price/Sales) and the direct column isn't there, calculate it using base columns (e.g. close / revenue_per_share).
    However, if 'ps_ratio' IS provided, use it directly.

    ${schemaContext}
    
    Output strictly in JSON format.
  `;

  const userPrompt = `
    Context: The user wants a ${frequency} factor.
    User Idea/Hypothesis: "${prompt}"
    
    Please generate a quantitative factor using the schema provided.
    
    Return a JSON object with:
    - name: A professional name.
    - category: One of [Momentum, Volatility, Liquidity, Mean Reversion, Sentiment, Fundamental].
    - description: A concise 1-sentence description.
    - formula: Python pandas code assuming 'df' contains the columns listed in the schema. (e.g. 'df.pe_ttm.rank() * df.momentum').
    - logic_explanation: Explain exactly which database fields are used and why.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                formula: { type: Type.STRING },
                logic_explanation: { type: Type.STRING },
            },
            required: ["name", "category", "description", "formula", "logic_explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

interface RiskConfig {
    sectorNeutral: boolean;
    styleNeutral: boolean;
    maxDrawdown?: string;
    targetVol?: string;
    executionStrategy?: string; // HF specific
    maxInventory?: string; // HF specific
}

export const generateFactorCombination = async (
  factors: Factor[],
  goal: string,
  riskConfig: RiskConfig,
  frequency: FactorFrequency
): Promise<{ name: string; description: string; formula: string; category: string; logic_explanation: string }> => {
  if (!apiKey) throw new Error("API Key not found");

  const modelId = 'gemini-2.5-flash';
  const isHighFreq = frequency === FactorFrequency.HIGH_FREQ;
  
  const factorsContext = factors.map(f => `- Name: ${f.name}\n  Formula: ${f.formula}\n  Description: ${f.description}`).join('\n\n');

  let configPrompt = "";
  if (isHighFreq) {
      configPrompt = `
      HFT Execution & Risk Config:
      - Execution Strategy: ${riskConfig.executionStrategy || "Standard"}
      - Max Inventory Constraint: ${riskConfig.maxInventory || "Unlimited"}
      
      Generate Python logic that combines these signals into a 'buy_signal' and 'sell_signal' (-1 to 1). 
      Include logic that checks 'current_inventory' against max_inventory before generating a signal.
      `;
  } else {
      configPrompt = `
      Risk Management & Barra Model Constraints:
      - Barra Sector Neutrality: ${riskConfig.sectorNeutral ? "REQUIRED (Orthogonalize against sectors)" : "None"}
      - Barra Style Neutrality: ${riskConfig.styleNeutral ? "REQUIRED (Orthogonalize against common style factors like Size, Value)" : "None"}
      - Max Drawdown Limit: ${riskConfig.maxDrawdown ? riskConfig.maxDrawdown + "%" : "None"}
      - Target Volatility: ${riskConfig.targetVol ? riskConfig.targetVol + "%" : "None"}
      `;
  }

  const systemInstruction = `
    You are a Quant Expert. Combine the provided alpha factors into a new composite strategy.
    
    Context: ${frequency} Strategy.
    
    CRITICAL: You must strictly adhere to the constraints provided.
    ${isHighFreq 
        ? "- For HFT: Logic MUST deal with order execution, inventory limits, and signal aggregation." 
        : "- For Low Freq: Logic MUST deal with portfolio weights, residualization (Barra), and risk parity."}
    
    Ensure mathematical validity. Output strictly in JSON.
  `;

  const userPrompt = `
    Existing Factors to Combine:
    ${factorsContext}

    User Goal/Strategy: "${goal || "Create an optimal weighted combination of these factors."}"

    ${configPrompt}

    Generate a new composite strategy.
    Return JSON:
    - name: New portfolio name.
    - category: The dominant category or "Multi-factor".
    - description: One sentence description of the combination strategy and risk controls.
    - formula: Python/Pandas code for the combination.
    - logic_explanation: Why this combination works and how constraints are applied.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                formula: { type: Type.STRING },
                logic_explanation: { type: Type.STRING },
            },
            required: ["name", "category", "description", "formula", "logic_explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const explainBacktestResults = async (metrics: any) => {
    if (!apiKey) return "API Key missing.";
    
    const modelId = 'gemini-2.5-flash';
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Analyze these backtest metrics for a quantitative strategy and provide a brief risk assessment: ${JSON.stringify(metrics)}`,
        });
        return response.text;
    } catch (e) {
        return "Could not generate analysis.";
    }
}