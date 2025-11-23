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
}

export const generateFactorCombination = async (
  factors: Factor[],
  goal: string,
  riskConfig?: RiskConfig
): Promise<{ name: string; description: string; formula: string; category: string; logic_explanation: string }> => {
  if (!apiKey) throw new Error("API Key not found");

  const modelId = 'gemini-2.5-flash';
  
  const factorsContext = factors.map(f => `- Name: ${f.name}\n  Formula: ${f.formula}\n  Description: ${f.description}`).join('\n\n');

  const riskPrompt = riskConfig ? `
    Risk Management & Barra Model Constraints:
    - Barra Sector Neutrality: ${riskConfig.sectorNeutral ? "REQUIRED (Orthogonalize against sectors)" : "None"}
    - Barra Style Neutrality: ${riskConfig.styleNeutral ? "REQUIRED (Orthogonalize against common style factors like Size, Value)" : "None"}
    - Max Drawdown Limit: ${riskConfig.maxDrawdown ? riskConfig.maxDrawdown + "%" : "None"}
    - Target Volatility: ${riskConfig.targetVol ? riskConfig.targetVol + "%" : "None"}
  ` : "";

  const systemInstruction = `
    You are a Quant Expert. Combine the provided alpha factors into a new composite factor.
    
    CRITICAL: You must strictly adhere to the Risk Management & Barra Model constraints provided.
    - If "Sector Neutrality" or "Style Neutrality" is required, your formula MUST show the logic for residualizing the factor (e.g., 'resid = factor - (beta * market_factor)').
    - If volatility or drawdown limits are set, include logic for position sizing or volatility targeting (e.g., 'weight = target_vol / realized_vol').
    
    Ensure mathematical validity in the combination (e.g., z-scoring before adding, handling different scales).
    Output strictly in JSON.
  `;

  const userPrompt = `
    Existing Factors to Combine:
    ${factorsContext}

    User Goal/Strategy: "${goal || "Create an optimal weighted combination of these factors."}"

    ${riskPrompt}

    Generate a new composite factor.
    Return JSON:
    - name: New factor name (include 'Risk-Adj' or 'Neutral' if applicable).
    - category: The dominant category or "Multi-factor".
    - description: One sentence description of the combination strategy and risk controls.
    - formula: Python/Pandas code for the combination. Assume input factors are available as variables. Show steps for neutralization/risk control.
    - logic_explanation: Why this combination works, how risk is managed, and the benefit of Barra neutralization if applied.
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