
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Download, 
  Zap, 
  Activity, 
  ShieldCheck,
  History as HistoryIcon,
  ChevronRight,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { MarketType, SignalAction, MarketSignal, PricePoint } from './types';
import { generateMarketSignal } from './services/geminiService';
import MarketChart from './components/MarketChart';

const App: React.FC = () => {
  // State
  const [btcPrice, setBtcPrice] = useState<number>(55432.21);
  const [forexPrice, setForexPrice] = useState<number>(1.0845);
  const [forexSymbol, setForexSymbol] = useState<string>('EURUSD');
  const [timeframe, setTimeframe] = useState<string>('5m');
  const [selectedMarket, setSelectedMarket] = useState<MarketType>(MarketType.CRYPTO);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [currentSignal, setCurrentSignal] = useState<MarketSignal | null>(null);
  const [history, setHistory] = useState<MarketSignal[]>([]);
  
  // Simulated chart data
  const [btcHistory, setBtcHistory] = useState<PricePoint[]>([]);
  const [forexHistory, setForexHistory] = useState<PricePoint[]>([]);

  // Refs
  // Fix: Use any to avoid "Cannot find namespace 'NodeJS'" in browser environments
  const timerRef = useRef<any>(null);

  // Initialize data
  useEffect(() => {
    const initData = () => {
      const btc: PricePoint[] = [];
      const forex: PricePoint[] = [];
      const now = new Date();
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        btc.push({ time, price: 55000 + Math.random() * 1000 });
        forex.push({ time, price: 1.0800 + Math.random() * 0.01 });
      }
      setBtcHistory(btc);
      setForexHistory(forex);
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live price simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setBtcPrice(prev => {
        const next = prev + (Math.random() - 0.5) * 10;
        setBtcHistory(hist => {
          const newHist = [...hist.slice(1), { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            price: next 
          }];
          return newHist;
        });
        return next;
      });
      setForexPrice(prev => {
        const next = prev + (Math.random() - 0.5) * 0.0001;
        setForexHistory(hist => {
          const newHist = [...hist.slice(1), { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            price: next 
          }];
          return newHist;
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Cooldown logic
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cooldown]);

  const handleGetSignal = useCallback(async () => {
    if (cooldown > 0 || isProcessing) return;

    setIsProcessing(true);
    const asset = selectedMarket === MarketType.CRYPTO ? 'BTC/USDT' : forexSymbol;
    const currentPrice = selectedMarket === MarketType.CRYPTO ? btcPrice : forexPrice;
    const historicalPrices = selectedMarket === MarketType.CRYPTO 
      ? btcHistory.slice(-10).map(p => p.price)
      : forexHistory.slice(-10).map(p => p.price);

    const signal = await generateMarketSignal(asset, currentPrice, timeframe, historicalPrices);
    
    setCurrentSignal(signal);
    setHistory(prev => [signal, ...prev]);
    setIsProcessing(false);
    setCooldown(30);
  }, [cooldown, isProcessing, selectedMarket, btcPrice, forexPrice, forexSymbol, timeframe, btcHistory, forexHistory]);

  const downloadHistory = () => {
    const data = history.map(h => 
      `[${h.timestamp}] ${h.asset} - ${h.timeframe} - ${h.action} (Conf: ${h.confidence}%) - ${h.reasoning}`
    ).join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yqt_signal_history_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 p-2 rounded-lg shadow-lg shadow-sky-500/20">
            <Zap className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              YQT BOT <span className="text-sky-400">PRO</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Gemini AI Market Analysis Live
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-3 rounded-xl flex items-center gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">BTC/USDT</p>
              <p className="text-lg font-mono font-semibold text-emerald-400">
                ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{forexSymbol}</p>
              <p className="text-lg font-mono font-semibold text-sky-400">
                {forexPrice.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Controls & Chart */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="text-sky-400 w-5 h-5" /> Market Trend
              </h2>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button 
                  onClick={() => setSelectedMarket(MarketType.CRYPTO)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${selectedMarket === MarketType.CRYPTO ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Crypto
                </button>
                <button 
                  onClick={() => setSelectedMarket(MarketType.FOREX)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${selectedMarket === MarketType.FOREX ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Forex
                </button>
              </div>
            </div>

            <MarketChart 
              data={selectedMarket === MarketType.CRYPTO ? btcHistory : forexHistory} 
              color={selectedMarket === MarketType.CRYPTO ? '#10b981' : '#0ea5e9'} 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block ml-1">Asset Symbol</label>
                {selectedMarket === MarketType.CRYPTO ? (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-300 font-medium">BTC/USDT</div>
                ) : (
                  <input 
                    type="text" 
                    value={forexSymbol} 
                    onChange={(e) => setForexSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    placeholder="e.g. EURUSD"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block ml-1">Analysis Timeframe</label>
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none cursor-pointer"
                >
                  <option value="1m">1 Minute</option>
                  <option value="5m">5 Minutes</option>
                  <option value="15m">15 Minutes</option>
                  <option value="1h">1 Hour</option>
                </select>
              </div>
            </div>
          </section>

          {/* Action Area */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Advanced Signal Generation</h3>
              <p className="text-slate-400 max-w-md">Our AI engine analyzes recent volatility, volume patterns, and technical indicators to predict short-term movements.</p>
            </div>

            <div className="flex flex-col items-center w-full max-w-sm gap-4">
              <button
                disabled={cooldown > 0 || isProcessing}
                onClick={handleGetSignal}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-xl ${
                  cooldown > 0 || isProcessing 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale' 
                    : 'bg-sky-500 text-white hover:bg-sky-400 shadow-sky-500/20 hover:shadow-sky-500/40'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    ANALYZING MARKET...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Clock className="w-6 h-6" />
                    NEXT SIGNAL IN {cooldown}S
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    GENERATE SIGNAL
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> SECURE ANALYTICS</span>
                <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-sky-500" /> REAL-TIME DATA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results & History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Signal Result */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
            {!currentSignal && !isProcessing && (
              <div className="text-center space-y-4 opacity-40">
                <Activity className="w-16 h-16 mx-auto text-slate-600" />
                <p className="text-slate-500 font-medium">No active signal. Click generate to start analysis.</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                   <div className="absolute inset-0 rounded-full border-4 border-sky-500/10"></div>
                   <div className="absolute inset-0 rounded-full border-4 border-t-sky-500 animate-spin"></div>
                </div>
                <p className="text-sky-400 font-bold animate-pulse">Consulting Gemini AI...</p>
              </div>
            )}

            {currentSignal && !isProcessing && (
              <div className="w-full h-full flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-bold text-slate-500 uppercase bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                    Live Signal
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {currentSignal.timestamp}
                  </span>
                </div>

                <div className={`text-5xl font-black text-center mb-4 tracking-tighter ${
                  currentSignal.action === SignalAction.BUY ? 'text-emerald-400' : 
                  currentSignal.action === SignalAction.SELL ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {currentSignal.action}
                </div>

                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex max-w-[140px]">
                    <div 
                      className={`h-full ${currentSignal.action === SignalAction.BUY ? 'bg-emerald-500' : currentSignal.action === SignalAction.SELL ? 'bg-rose-500' : 'bg-amber-500'}`} 
                      style={{ width: `${currentSignal.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{currentSignal.confidence}% CONF</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/50 rounded-xl p-4 mt-auto">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> Technical Reasoning
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{currentSignal.reasoning}"
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* History */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-sky-400" /> SIGNAL LOG
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={downloadHistory}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-slate-600 font-medium">History is currently empty.</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 flex items-center justify-between group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        item.action === SignalAction.BUY ? 'bg-emerald-500/10 text-emerald-500' : 
                        item.action === SignalAction.SELL ? 'bg-rose-500/10 text-rose-500' : 'bg-