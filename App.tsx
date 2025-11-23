
import React, { useState, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MiningView from './components/MiningView';
import BacktestView from './components/BacktestView';
import LibraryView from './components/LibraryView';
import CombinationView from './components/CombinationView';
import PortfolioLibraryView from './components/PortfolioLibraryView';
import SettingsView from './components/SettingsView';
import DataExplorerView, { DataCategory } from './components/DataExplorerView';
import { Factor, FactorCategory, FactorFrequency, Portfolio } from './types';
import { Menu } from 'lucide-react';

// --- Notification Context ---
type NotificationType = 'success' | 'error' | 'info';
type NotificationContextType = (type: NotificationType, message: string) => void;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        // Fallback if used outside provider
        return (type: NotificationType, msg: string) => console.log(`[${type}] ${msg}`);
    }
    return context;
};
// ----------------------------

// Initial Mock Data - Expanded for better testing
const INITIAL_FACTORS: Factor[] = [
    // --- LOW FREQUENCY (ALPHA) FACTORS ---
    {
        id: 'lf-1',
        name: 'Volume Weighted Momentum',
        description: 'Captures trends supported by increasing volume, filtering out low-liquidity price moves.',
        frequency: FactorFrequency.LOW_FREQ,
        category: FactorCategory.MOMENTUM,
        formula: 'df.close.pct_change(5) * df.volume.rolling(5).mean() / df.volume.rolling(20).mean()',
        createdAt: '2023-10-15T10:00:00Z',
        performance: { sharpe: 1.85, ic: 0.06, annualizedReturn: 0.18, maxDrawdown: -0.12 }
    },
    {
        id: 'lf-2',
        name: 'Quality Value Composite',
        description: 'Ranks stocks by high ROE and low PE ratio to find quality companies at a discount.',
        frequency: FactorFrequency.LOW_FREQ,
        category: FactorCategory.FUNDAMENTAL,
        formula: '(df.roe_ttm.rank() + (1/df.pe_ttm).rank()) / 2',
        createdAt: '2023-11-02T14:30:00Z',
        performance: { sharpe: 1.42, ic: 0.04, annualizedReturn: 0.12, maxDrawdown: -0.09 }
    },
    {
        id: 'lf-3',
        name: 'Analyst Sentiment Reversion',
        description: 'Contrarian strategy betting against excessive analyst optimism.',
        frequency: FactorFrequency.LOW_FREQ,
        category: FactorCategory.SENTIMENT,
        formula: '-1 * df.rating_avg.diff(20)', 
        createdAt: '2023-12-10T09:15:00Z',
        performance: { sharpe: 1.10, ic: 0.03, annualizedReturn: 0.08, maxDrawdown: -0.15 }
    },
    {
        id: 'lf-4',
        name: 'Low Volatility Anomaly',
        description: 'Betting on low beta stocks outperforming on a risk-adjusted basis.',
        frequency: FactorFrequency.LOW_FREQ,
        category: FactorCategory.VOLATILITY,
        formula: '1 / df.close.rolling(60).std()',
        createdAt: '2024-01-05T11:20:00Z',
        performance: { sharpe: 1.65, ic: 0.05, annualizedReturn: 0.10, maxDrawdown: -0.08 }
    },
    {
        id: 'lf-5',
        name: 'RSI Mean Reversion',
        description: 'Classic technical reversion strategy on 14-day RSI overbought levels.',
        frequency: FactorFrequency.LOW_FREQ,
        category: FactorCategory.MEAN_REVERSION,
        formula: 'ta.rsi(df.close, 14) < 30',
        createdAt: '2024-02-14T16:45:00Z',
        performance: { sharpe: 0.95, ic: 0.02, annualizedReturn: 0.07, maxDrawdown: -0.18 }
    },
    {
        id: 'lf-6',
        name: 'Growth at Reasonable Price (GARP)',
        description: 'Filters for PEG ratio < 1.0 combined with positive sales momentum.',
        frequency: FactorFrequency.LOW_FREQ,
        category: FactorCategory.FUNDAMENTAL,
        formula: '(df.pe_ttm / df.eps_growth_yoy) < 1.0',
        createdAt: '2024-03-01T08:00:00Z',
        performance: { sharpe: 1.55, ic: 0.07, annualizedReturn: 0.15, maxDrawdown: -0.14 }
    },

    // --- HIGH FREQUENCY (HFT) FACTORS ---
    {
        id: 'hf-1',
        name: 'Order Book Imbalance Delta',
        description: 'Detects aggressive shifts in bid-ask pressure before price moves.',
        frequency: FactorFrequency.HIGH_FREQ,
        category: FactorCategory.LIQUIDITY,
        formula: '(df.bid_size_1 - df.ask_size_1) / (df.bid_size_1 + df.ask_size_1)',
        createdAt: '2024-01-20T10:00:00Z',
        performance: { sharpe: 4.2, ic: 0.12, annualizedReturn: 0.45, maxDrawdown: -0.02 }
    },
    {
        id: 'hf-2',
        name: 'Spread Arbitrage Scalper',
        description: 'Provides liquidity when spread widens beyond 2 standard deviations.',
        frequency: FactorFrequency.HIGH_FREQ,
        category: FactorCategory.MEAN_REVERSION,
        formula: 'df.spread_bps > (df.spread_bps.rolling(100).mean() + 2*df.spread_bps.rolling(100).std())',
        createdAt: '2024-02-05T13:30:00Z',
        performance: { sharpe: 3.8, ic: 0.09, annualizedReturn: 0.38, maxDrawdown: -0.01 }
    },
    {
        id: 'hf-3',
        name: 'Tick Volume Breakout',
        description: 'Enters trades when tick volume spikes 500% above moving average.',
        frequency: FactorFrequency.HIGH_FREQ,
        category: FactorCategory.MOMENTUM,
        formula: 'df.volume > df.volume.rolling(50).mean() * 5',
        createdAt: '2024-02-18T09:45:00Z',
        performance: { sharpe: 2.9, ic: 0.08, annualizedReturn: 0.25, maxDrawdown: -0.05 }
    },
    {
        id: 'hf-4',
        name: 'VWAP Divergence Sniper',
        description: 'Fades price deviations from the 1-minute VWAP.',
        frequency: FactorFrequency.HIGH_FREQ,
        category: FactorCategory.MEAN_REVERSION,
        formula: '(df.close - df.vwap) / df.vwap',
        createdAt: '2024-03-05T15:15:00Z',
        performance: { sharpe: 3.1, ic: 0.10, annualizedReturn: 0.32, maxDrawdown: -0.03 }
    },
    {
        id: 'hf-5',
        name: 'Aggressive Trade Flow',
        description: 'Follows aggressive market orders (taker flow).',
        frequency: FactorFrequency.HIGH_FREQ,
        category: FactorCategory.MOMENTUM,
        formula: '(df.buy_volume - df.sell_volume).rolling(5).sum()',
        createdAt: '2024-03-12T11:00:00Z',
        performance: { sharpe: 2.5, ic: 0.07, annualizedReturn: 0.28, maxDrawdown: -0.06 }
    }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [factors, setFactors] = useState<Factor[]>(INITIAL_FACTORS);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null);

  const notify = (type: NotificationType, message: string) => {
      setNotification({ type, message });
      // Auto hide after 3 seconds
      setTimeout(() => {
          setNotification(null);
      }, 3000);
  };

  const handleAddFactor = (factor: Factor) => {
    setFactors(prev => [factor, ...prev]);
    // Redirect to the appropriate library based on freq
    setActiveTab(factor.frequency === FactorFrequency.HIGH_FREQ ? 'library-hf' : 'library-lf');
  };

  const handleAddPortfolio = (portfolio: Portfolio) => {
    setPortfolios(prev => [portfolio, ...prev]);
    setActiveTab('portfolio-lib');
  };

  const handleDeleteFactor = (id: string) => {
    setFactors(prev => prev.filter(f => f.id !== id));
  };
  
  const handleDeletePortfolio = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
  };

  // Helper to resolve data category from tab ID
  const getDataCategory = (tabId: string): DataCategory => {
      switch(tabId) {
          case 'data-fund': return 'FUNDAMENTAL';
          default: return 'MARKET';
      }
  };

  return (
    <NotificationContext.Provider value={notify}>
        <div className="h-screen bg-slate-950 text-slate-200 font-sans flex overflow-hidden relative">
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-[60] px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                    notification.type === 'error' ? 'bg-red-950/90 border-red-800 text-white' :
                    notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-800 text-white' :
                    'bg-blue-950/90 border-blue-800 text-white'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${
                        notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="font-medium text-sm">{notification.message}</span>
                </div>
            )}

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
                
                {/* Dashboard */}
                <div className={`h-full z-10 relative ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
                    <Dashboard factors={factors} />
                </div>
                
                {/* --- DATA EXPLORER MODULES --- */}
                <div className={`h-full z-10 relative ${activeTab.startsWith('data-') ? 'block' : 'hidden'}`}>
                    <DataExplorerView targetCategory={getDataCategory(activeTab)} />
                </div>

                {/* --- LOW FREQUENCY MODULES --- */}
                <div className={`h-full z-10 relative ${activeTab === 'mining-lf' ? 'block' : 'hidden'}`}>
                    <MiningView onAddFactor={handleAddFactor} targetFrequency={FactorFrequency.LOW_FREQ} />
                </div>
                <div className={`h-full z-10 relative ${activeTab === 'library-lf' ? 'block' : 'hidden'}`}>
                    <LibraryView factors={factors} onDelete={handleDeleteFactor} targetFrequency={FactorFrequency.LOW_FREQ} />
                </div>
                <div className={`h-full z-10 relative ${activeTab === 'portfolio-lf' ? 'block' : 'hidden'}`}>
                    <CombinationView factors={factors} onAddPortfolio={handleAddPortfolio} targetFrequency={FactorFrequency.LOW_FREQ} />
                </div>
                <div className={`h-full z-10 relative ${activeTab === 'backtest-lf' ? 'block' : 'hidden'}`}>
                    <BacktestView factors={factors} targetFrequency={FactorFrequency.LOW_FREQ} />
                </div>

                {/* --- HIGH FREQUENCY MODULES --- */}
                <div className={`h-full z-10 relative ${activeTab === 'mining-hf' ? 'block' : 'hidden'}`}>
                    <MiningView onAddFactor={handleAddFactor} targetFrequency={FactorFrequency.HIGH_FREQ} />
                </div>
                <div className={`h-full z-10 relative ${activeTab === 'library-hf' ? 'block' : 'hidden'}`}>
                    <LibraryView factors={factors} onDelete={handleDeleteFactor} targetFrequency={FactorFrequency.HIGH_FREQ} />
                </div>
                <div className={`h-full z-10 relative ${activeTab === 'portfolio-hf' ? 'block' : 'hidden'}`}>
                    <CombinationView factors={factors} onAddPortfolio={handleAddPortfolio} targetFrequency={FactorFrequency.HIGH_FREQ} />
                </div>
                <div className={`h-full z-10 relative ${activeTab === 'backtest-hf' ? 'block' : 'hidden'}`}>
                    <BacktestView factors={factors} targetFrequency={FactorFrequency.HIGH_FREQ} />
                </div>


                {/* Shared Library & System */}
                <div className={`h-full z-10 relative ${activeTab === 'portfolio-lib' ? 'block' : 'hidden'}`}>
                    <PortfolioLibraryView portfolios={portfolios} onDelete={handleDeletePortfolio} factors={factors} />
                </div>

                <div className={`h-full z-10 relative ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
                    <SettingsView />
                </div>

                </main>
            </div>
        </div>
    </NotificationContext.Provider>
  );
};

export default App;
