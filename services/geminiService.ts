import { GoogleGenAI, Type } from "@google/genai";
import { FactorFrequency, FactorCategory, Factor } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateFactorSuggestion = async (
  prompt: string, 
  frequency: FactorFrequency
): Promise<{ name: string; description: string; formula: string; category: string; logic_explanation: string }> => {
  
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const modelId = 'gemini-2.5-flash';
  
  const systemInstruction = `
    You are a world-class Quantitative Researcher specializing in Alpha Factor Mining for financial markets.
    Your goal is to suggest concrete, mathematically sound alpha factors based on user descriptions.
    
    If the user asks for high-frequency, focus on microstructure, order book imbalance, and tick-level patterns.
    If the user asks for low-frequency, focus on daily price action, volume, or fundamental ratios.
    
    Output strictly in JSON format.
  `;

  const userPrompt = `
    Context: The user wants a ${frequency} factor.
    User Idea/Hypothesis: "${prompt}"
    
    Please generate a quantitative factor.
    Return a JSON object with:
    - name: A professional name for the factor.
    - category: One of [Momentum, Volatility, Liquidity, Mean Reversion, Sentiment, Fundamental].
    - description: A concise 1-sentence description.
    - formula: Python/Pandas pseudocode snippet representing the calculation (e.g., 'df.close.pct_change(5).rank()').
    - logic_explanation: A short paragraph explaining why this factor might generate alpha.
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