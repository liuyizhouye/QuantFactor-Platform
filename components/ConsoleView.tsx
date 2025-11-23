
import React, { useState } from 'react';
import { Play, Trash2, Terminal, Save, Code2, Table, Image as ImageIcon, Box } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ConsoleView: React.FC = () => {
  const [code, setCode] = useState<string>(`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 1. Load Data
df = get_price('AAPL', start='2023-01-01')

# 2. Calculate rolling z-score
window = 20
df['mean'] = df['close'].rolling(window).mean()
df['std'] = df['close'].rolling(window).std()
df['z_score'] = (df['close'] - df['mean']) / df['std']

# 3. Check for outliers
outliers = df[abs(df['z_score']) > 2.0]

print(f"Loaded {len(df)} rows.")
print(f"Found {len(outliers)} outliers.")
print(df[['close', 'z_score']].tail())

# 4. Plot
plt.plot(df['z_score'])
plt.title('Reversion Signal')
plt.show()`);

  const [outputTab, setOutputTab] = useState<'console' | 'plot' | 'variables'>('console');
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [variables, setVariables] = useState<{name: string, type: string, size: string, value: string}[]>([]);
  const [showPlot, setShowPlot] = useState(false);

  // Mock plot data
  const plotData = Array.from({length: 50}, (_, i) => ({
    step: i,
    value: Math.sin(i * 0.2) + (Math.random() - 0.5) * 0.5
  }));

  const handleRun = () => {
    setIsRunning(true);
    setOutput([]);
    setShowPlot(false);
    setVariables([]);
    
    // Simulate execution time
    setTimeout(() => {
      // Mock Output based on code content
      const newOutput = [
        "> Running script...",
        "[SYSTEM] Fetching data for AAPL...",
        "Loaded 252 rows.",
        "Found 14 outliers.",
        "       close   z_score",
        "247  152.30   0.1245",
        "248  153.10   0.4512",
        "249  151.20  -0.3321",
        "250  150.50  -0.8910",
        "251  155.40   1.2301",
        "> Done"
      ];
      
      // Mock Variables
      const newVars = [
        { name: 'df', type: 'DataFrame', size: '(252, 6)', value: 'DataFrame object' },
        { name: 'window', type: 'int', size: '1', value: '20' },
        { name: 'outliers', type: 'DataFrame', size: '(14, 6)', value: 'DataFrame object' },
        { name: 'np', type: 'module', size: '-', value: 'numpy' },
      ];

      // Check for plot command
      if (code.includes('plt.show') || code.includes('plot')) {
        setShowPlot(true);
        setOutputTab('plot'); // Auto-switch to plot tab
      } else {
        setOutputTab('console');
      }

      setOutput(newOutput);
      setVariables(newVars);
      setIsRunning(false);
    }, 1000);
  };

  const handleClear = () => {
    setOutput([]);
    setShowPlot(false);
    setVariables([]);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto gap-4">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="text-orange-500" />
            Python Console
           </h1>
           <p className="text-slate-400">Interactive research environment with matplotlib support</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Save size={16} /> Save Script
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        
        {/* Editor Pane */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg min-h-[300px]">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Code2 size={14} className="text-blue-400" />
                    <span className="text-xs font-mono text-slate-400">analysis_draft.py</span>
                </div>
                <button 
                    onClick={handleRun}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                    <Play size={12} fill="currentColor" /> {isRunning ? 'Running...' : 'Run'}
                </button>
            </div>
            <div className="flex-1 relative">
                <textarea 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="absolute inset-0 w-full h-full bg-[#0f172a] p-4 text-sm font-mono text-slate-300 focus:outline-none resize-none leading-relaxed"
                    spellCheck={false}
                />
            </div>
        </div>

        {/* Output / Results Pane */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner min-h-[300px]">
             
             {/* Output Tabs */}
             <div className="bg-slate-950 px-2 py-2 border-b border-slate-800 flex items-center gap-1">
                <button 
                    onClick={() => setOutputTab('console')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${outputTab === 'console' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Terminal size={14} /> Output
                </button>
                <button 
                    onClick={() => setOutputTab('plot')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${outputTab === 'plot' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <ImageIcon size={14} /> Plots {showPlot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>}
                </button>
                <button 
                    onClick={() => setOutputTab('variables')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${outputTab === 'variables' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Table size={14} /> Variables
                </button>

                <div className="ml-auto">
                    <button onClick={handleClear} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Clear Output">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[#0f172a]">
                
                {/* Console Tab */}
                <div className={`absolute inset-0 p-4 font-mono text-sm overflow-y-auto space-y-1 ${outputTab === 'console' ? 'block' : 'hidden'}`}>
                    {output.length === 0 && !isRunning && (
                        <div className="text-slate-600 italic mt-4 opacity-50">
                            # Output will appear here...
                        </div>
                    )}
                    {output.map((line, idx) => (
                        <div key={idx} className={`${line.startsWith('>') ? 'text-slate-500' : 'text-emerald-400'}`}>
                            {line}
                        </div>
                    ))}
                    {isRunning && (
                        <div className="animate-pulse text-blue-400 mt-2">_</div>
                    )}
                </div>

                {/* Plot Tab */}
                <div className={`absolute inset-0 p-4 flex flex-col items-center justify-center ${outputTab === 'plot' ? 'block' : 'hidden'}`}>
                    {showPlot ? (
                        <div className="w-full h-full p-2">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={plotData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="step" stroke="#64748b" tick={{fontSize: 10}} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0'}} />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center text-slate-600">
                            <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">No active plots.</p>
                            <p className="text-[10px] mt-1">Use <code>plt.show()</code> to display charts.</p>
                        </div>
                    )}
                </div>

                {/* Variables Tab */}
                <div className={`absolute inset-0 overflow-y-auto ${outputTab === 'variables' ? 'block' : 'hidden'}`}>
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900 text-slate-400 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 border-b border-slate-800">Name</th>
                                <th className="px-4 py-2 border-b border-slate-800">Type</th>
                                <th className="px-4 py-2 border-b border-slate-800">Size</th>
                                <th className="px-4 py-2 border-b border-slate-800">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {variables.length > 0 ? variables.map((v, i) => (
                                <tr key={i} className="hover:bg-slate-800/30">
                                    <td className="px-4 py-2 text-pink-400">{v.name}</td>
                                    <td className="px-4 py-2">{v.type}</td>
                                    <td className="px-4 py-2 text-slate-500">{v.size}</td>
                                    <td className="px-4 py-2 text-emerald-400 truncate max-w-[150px]">{v.value}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-600 italic">
                                        Variable memory is empty.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default ConsoleView;
