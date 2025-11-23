
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MiningView from './components/MiningView';
import BacktestView from './components/BacktestView';
import LibraryView from './components/LibraryView';
import CombinationView from './components/CombinationView';
import ConsoleView from './components/ConsoleView';
import SettingsView from './components/SettingsView';
import DataExplorerView from './components/DataExplorerView';
import { Factor, FactorCategory, FactorFrequency } from './types';
import { Menu } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAddFactor = (factor: Factor) => {
    setFactors(prev => [factor, ...prev]);
    setActiveTab('library');
  };

  const handleDeleteFactor = (id: string) => {
    setFactors(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 transition-all duration-300 h-full relative">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white">
                  <Menu size={24} />
              </button>
              <span className="font-bold text-lg text-white">QuantFactor</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500"></div>
        </div>

        <main className="flex-1 overflow-hidden relative bg-slate-950">
          {/* Background Grid Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-5 z-0" 
              style={{
                  backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
              }}>
          </div>
          
          {/* 
            View State Persistence:
            We render all views but hide the inactive ones. 
            This preserves input state (like text in MiningView or ConsoleView) when switching tabs.
          */}
          <div className={`h-full z-10 relative ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
             <Dashboard factors={factors} />
          </div>
          
          <div className={`h-full z-10 relative ${activeTab === 'mining' ? 'block' : 'hidden'}`}>
             <MiningView onAddFactor={handleAddFactor} />
          </div>

          <div className={`h-full z-10 relative ${activeTab === 'lab' ? 'block' : 'hidden'}`}>
             <CombinationView factors={factors} onAddFactor={handleAddFactor} />
          </div>

          <div className={`h-full z-10 relative ${activeTab === 'library' ? 'block' : 'hidden'}`}>
             <LibraryView factors={factors} onDelete={handleDeleteFactor} />
          </div>

          <div className={`h-full z-10 relative ${activeTab === 'backtest' ? 'block' : 'hidden'}`}>
             <BacktestView factors={factors} />
          </div>

          <div className={`h-full z-10 relative ${activeTab === 'console' ? 'block' : 'hidden'}`}>
             <ConsoleView />
          </div>

          <div className={`h-full z-10 relative ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
             <SettingsView />
          </div>

          <div className={`h-full z-10 relative ${activeTab === 'data' ? 'block' : 'hidden'}`}>
             <DataExplorerView />
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;
