
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MiningView from './components/MiningView';
import BacktestView from './components/BacktestView';
import LibraryView from './components/LibraryView';
import CombinationView from './components/CombinationView';
import ConsoleView from './components/ConsoleView';
import SettingsView from './components/SettingsView';
import { Factor, FactorCategory, FactorFrequency } from './types';

// Initial Mock Data
const INITIAL_FACTORS: Factor[] = [
    {
        id: '1',
        name: 'Volume Weighted Momentum',
        description: 'Captures trends supported by increasing volume, filtering out low-liquidity price moves.',
        frequency: FactorFrequency.LOW_FREQ,
        category: FactorCategory.MOMENTUM,
        formula: 'df.close.pct_change(5) * df.volume.rolling(5).mean() / df.volume.rolling(20).mean()',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Order Book Imbalance Delta',
        description: 'High frequency signal detecting shifts in bid-ask pressure before price moves.',
        frequency: FactorFrequency.HIGH_FREQ,
        category: FactorCategory.LIQUIDITY,
        formula: '(df.bid_size - df.ask_size) / (df.bid_size + df.ask_size)',
        createdAt: new Date().toISOString()
    }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [factors, setFactors] = useState<Factor[]>(INITIAL_FACTORS);

  const handleAddFactor = (factor: Factor) => {
    setFactors(prev => [factor, ...prev]);
    setActiveTab('library');
  };

  const handleDeleteFactor = (id: string) => {
    setFactors(prev => prev.filter(f => f.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard factors={factors} />;
      case 'mining':
        return <MiningView onAddFactor={handleAddFactor} />;
      case 'lab':
        return <CombinationView factors={factors} onAddFactor={handleAddFactor} />;
      case 'library':
        return <LibraryView factors={factors} onDelete={handleDeleteFactor} />;
      case 'backtest':
        return <BacktestView factors={factors} />;
      case 'console':
        return <ConsoleView />;
      case 'settings':
        return <SettingsView />;
      case 'data':
        return (
            <div className="flex h-full items-center justify-center text-slate-500">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Data Explorer</h2>
                    <p>Connect to TickDB or Parquet files to visualize raw data.</p>
                </div>
            </div>
        );
      default:
        return <Dashboard factors={factors} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5" 
             style={{
                 backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                 backgroundSize: '40px 40px'
             }}>
        </div>
        
        <div className="relative z-10 h-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
