import React, { useState, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MiningView from './components/MiningView';
import BacktestView from './components/BacktestView';
import LibraryView from './components/LibraryView';
import CombinationView from './components/CombinationView';
import PortfolioLibraryView from './components/PortfolioLibraryView';
import ConsoleView from './components/ConsoleView';
import SettingsView from './components/SettingsView';
import DataExplorerView from './components/DataExplorerView';
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
    </NotificationContext.Provider>
  );
};

export default App;