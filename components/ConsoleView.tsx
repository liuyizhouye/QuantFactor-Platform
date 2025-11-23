
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Terminal, Save, Code2 } from 'lucide-react';

const ConsoleView: React.FC = () => {
  const [code, setCode] = useState<string>(`import pandas as pd
import numpy as np

# Load market data
df = get_price_data('AAPL')

# Calculate rolling volatility
df['returns'] = df['close'].pct_change()
df['volatility'] = df['returns'].rolling(window=20).std()

print(f"Current Volatility: {df['volatility'].iloc[-1]:.4f}")
print("Calculation complete.")`);

  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setOutput([]); // Clear previous output
    
    // Simulate execution delay and output
    setTimeout(() => {
      const newOutput = [
        "> Executing script...",
        "[SYSTEM] Loaded 252 rows for ticker AAPL",
        "Current Volatility: 0.0142",
        "Calculation complete.",
        "> Process finished with exit code 0"
      ];
      setOutput(newOutput);
      setIsRunning(false);
    }, 800);
  };

  const handleClear = () => {
    setOutput([]);
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto gap-4">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="text-orange-500" />
            Python Console
           </h1>
           <p className="text-slate-400">Ad-hoc research sandbox environment</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Save size={16} /> Save Script
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        
        {/* Editor Pane */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Code2 size={14} className="text-blue-400" />
                    <span className="text-xs font-mono text-slate-400">scratchpad.py</span>
                </div>
                <button 
                    onClick={handleRun}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                    <Play size={12} /> {isRunning ? 'Running...' : 'Run'}
                </button>
            </div>
            <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full bg-[#0f172a] p-4 text-sm font-mono text-slate-300 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
            />
        </div>

        {/* Output Pane */}
        <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
             <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Console Output</span>
                <button onClick={handleClear} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-1">
                {output.length === 0 ? (
                    <span className="text-slate-600 italic">No output. Run the script to see results.</span>
                ) : (
                    output.map((line, idx) => (
                        <div key={idx} className={`${line.startsWith('>') ? 'text-slate-500' : 'text-emerald-400'}`}>
                            {line}
                        </div>
                    ))
                )}
                {isRunning && (
                    <div className="animate-pulse text-blue-400">_</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ConsoleView;
