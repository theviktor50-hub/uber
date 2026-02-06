
import React, { useState, useEffect, useMemo } from 'react';
import { InputMode, CalculationRecord, ThemeId, ThemeConfig, CurrencyId, CurrencyConfig } from './types';

const THEMES: ThemeConfig[] = [
  { id: 'midnight', label: 'Medianoche', primary: 'blue', secondary: 'green', bgGlow: 'blue-600/10' },
  { id: 'volt', label: 'Voltio', primary: 'yellow', secondary: 'lime', bgGlow: 'yellow-600/10' },
  { id: 'lava', label: 'Lava', primary: 'red', secondary: 'orange', bgGlow: 'red-600/10' },
  { id: 'cyber', label: 'Cyberpunk', primary: 'fuchsia', secondary: 'cyan', bgGlow: 'fuchsia-600/10' }
];

const CURRENCIES: CurrencyConfig[] = [
  { id: 'EUR', label: 'Euro', symbol: '€' },
  { id: 'USD', label: 'Dólar', symbol: '$' },
  { id: 'MXN', label: 'Peso MX', symbol: '$' },
  { id: 'ARS', label: 'Peso AR', symbol: '$' },
  { id: 'COP', label: 'Peso CO', symbol: '$' },
  { id: 'GBP', label: 'Libra', symbol: '£' },
  { id: 'BRL', label: 'Real', symbol: 'R$' }
];

const App: React.FC = () => {
  const [fare, setFare] = useState<string>('');
  const [received, setReceived] = useState<string>('');
  const [tip, setTip] = useState<string>('');
  
  // Preferencia de entrada: ¿Empezar por Precio o por Recibido?
  const [entryPreference, setEntryPreference] = useState<InputMode>(() => {
    return (localStorage.getItem('uberchange-entry-pref') as InputMode) || 'FARE';
  });

  const [activeInput, setActiveInput] = useState<InputMode>(entryPreference);
  
  const [currencyId, setCurrencyId] = useState<CurrencyId>(() => {
    return (localStorage.getItem('uberchange-currency') as CurrencyId) || 'EUR';
  });

  const [history, setHistory] = useState<CalculationRecord[]>(() => {
    const saved = localStorage.getItem('uberchange-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isQuickBillPulsing, setIsQuickBillPulsing] = useState(false);
  
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    return (localStorage.getItem('uberchange-theme') as ThemeId) || 'midnight';
  });

  const theme = useMemo(() => THEMES.find(t => t.id === currentThemeId) || THEMES[0], [currentThemeId]);
  const currency = useMemo(() => CURRENCIES.find(c => c.id === currencyId) || CURRENCIES[0], [currencyId]);

  useEffect(() => {
    localStorage.setItem('uberchange-theme', currentThemeId);
  }, [currentThemeId]);

  useEffect(() => {
    localStorage.setItem('uberchange-currency', currencyId);
  }, [currencyId]);

  useEffect(() => {
    localStorage.setItem('uberchange-entry-pref', entryPreference);
  }, [entryPreference]);

  useEffect(() => {
    localStorage.setItem('uberchange-history', JSON.stringify(history));
  }, [history]);

  const fareNum = parseFloat(fare) || 0;
  const receivedNum = parseFloat(received) || 0;
  const tipNum = parseFloat(tip) || 0;
  
  const change = Math.max(0, receivedNum - fareNum - tipNum);
  const isInsufficient = receivedNum > 0 && receivedNum < (fareNum + tipNum);

  const totals = useMemo(() => {
    return history.reduce((acc, curr) => ({
      collected: acc.collected + curr.fare,
      tips: acc.tips + (curr.tip || 0)
    }), { collected: 0, tips: 0 });
  }, [history]);

  const handleNumberClick = (num: string) => {
    if (isSaved) setIsSaved(false);
    if (activeInput === 'FARE') {
      if (num === '.' && fare.includes('.')) return;
      setFare(prev => prev + num);
    } else if (activeInput === 'RECEIVED') {
      if (num === '.' && received.includes('.')) return;
      setReceived(prev => prev + num);
    } else {
      if (num === '.' && tip.includes('.')) return;
      setTip(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (isSaved) setIsSaved(false);
    if (activeInput === 'FARE') {
      setFare(prev => prev.slice(0, -1));
    } else if (activeInput === 'RECEIVED') {
      setReceived(prev => prev.slice(0, -1));
    } else {
      setTip(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setFare('');
    setReceived('');
    setTip('');
    setActiveInput(entryPreference);
    setIsSaved(false);
  };

  const toggleEntryPreference = () => {
    const nextPref = entryPreference === 'FARE' ? 'RECEIVED' : 'FARE';
    setEntryPreference(nextPref);
    if (fare === '' && received === '') {
      setActiveInput(nextPref);
    }
  };

  const handleQuickAmount = (amount: number) => {
    if (isSaved) setIsSaved(false);
    setReceived(amount.toString());
    // Después de poner un billete rápido, si no hay precio, saltar a Precio
    if (fare === '') {
      setActiveInput('FARE');
    }
    setIsQuickBillPulsing(true);
    setTimeout(() => setIsQuickBillPulsing(false), 300);
  };

  const saveToHistory = (customTip?: number) => {
    const finalTip = typeof customTip === 'number' ? customTip : tipNum;
    const finalChange = typeof customTip === 'number' ? 0 : change;

    if (fareNum > 0 && receivedNum >= (fareNum + finalTip) && !isSaved) {
      const newRecord: CalculationRecord = {
        id: Date.now().toString(),
        fare: fareNum,
        received: receivedNum,
        change: finalChange,
        tip: finalTip,
        timestamp: new Date()
      };
      setHistory(prev => [newRecord, ...prev].slice(0, 100));
      setIsSaved(true);
      setTimeout(() => {
        setFare('');
        setReceived('');
        setTip('');
        setIsSaved(false);
        setActiveInput(entryPreference);
      }, 1200);
    }
  };

  const keepFullChangeAsTip = () => {
    const fullChangeAsTip = Math.max(0, receivedNum - fareNum);
    saveToHistory(fullChangeAsTip);
  };

  const clearHistory = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar todo el historial y los totales?")) {
      setHistory([]);
    }
  };

  const pCol = theme.primary; 
  const sCol = theme.secondary; 

  return (
    <div className={`flex flex-col h-screen bg-[#050505] text-white font-sans selection:bg-${pCol}-500 overflow-hidden`}>
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-${theme.bgGlow} blur-[120px] rounded-full`}></div>
        <div className={`absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-${sCol}-600/5 blur-[100px] rounded-full`}></div>
      </div>

      {/* Header */}
      <header className="px-4 py-3 sm:px-6 sm:py-5 flex justify-between items-center shrink-0 z-40 bg-black/50 backdrop-blur-md border-b border-gray-900/50">
        <div className="flex flex-col">
          <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Driver Utility</span>
          <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5">
            <span className={`text-${pCol}-500`}>UBER</span>CHANGE
          </h1>
        </div>

        {/* Quick Total Indicator */}
        <div className={`flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full bg-gray-900/50 border border-gray-800 transition-all duration-500 ${history.length === 0 ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
           <div className="flex items-center gap-1">
              <i className={`fa-solid fa-vault text-[8px] sm:text-[10px] text-${pCol}-500`}></i>
              <span className={`text-[10px] sm:text-[11px] font-black text-${pCol}-400 font-mono tracking-tighter`}>{totals.collected.toFixed(2)}{currency.symbol}</span>
           </div>
           <div className="w-[1px] h-2.5 bg-gray-800"></div>
           <div className="flex items-center gap-1">
              <i className={`fa-solid fa-hand-holding-dollar text-[8px] sm:text-[10px] text-yellow-500`}></i>
              <span className={`text-[10px] sm:text-[11px] font-black text-yellow-400 font-mono tracking-tighter`}>{totals.tips.toFixed(2)}{currency.symbol}</span>
           </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          {/* Botón de flujo de entrada */}
          <button 
            onClick={toggleEntryPreference}
            title={entryPreference === 'FARE' ? 'Empezar con Precio' : 'Empezar con Recibido'}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex flex-col items-center justify-center transition-all duration-300 rounded-xl border border-gray-800/50 bg-gray-900/50 text-gray-400 active:scale-90`}
          >
            <i className={`fa-solid ${entryPreference === 'FARE' ? 'fa-arrow-down-9-1' : 'fa-hand-holding-dollar'} text-[10px] mb-0.5`}></i>
            <span className="font-bold text-[8px] uppercase tracking-tighter">{entryPreference === 'FARE' ? 'Precio' : 'Recib.'}</span>
          </button>

          <button 
            onClick={() => { setShowCurrencyMenu(!showCurrencyMenu); setShowThemeMenu(false); }}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 rounded-xl border border-gray-800/50 bg-gray-900/50 text-gray-400 active:scale-90 ${showCurrencyMenu ? `border-${pCol}-500/50 text-${pCol}-400` : ''}`}
          >
            <span className="font-bold text-[10px] sm:text-xs">{currency.symbol}</span>
          </button>
          
          <button 
            onClick={() => { setShowThemeMenu(!showThemeMenu); setShowCurrencyMenu(false); }}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 rounded-xl border border-gray-800/50 bg-gray-900/50 text-gray-400 active:scale-90 ${showThemeMenu ? `border-${pCol}-500/50 text-${pCol}-400` : ''}`}
          >
            <i className="fa-solid fa-palette text-xs sm:text-sm"></i>
          </button>
          
          <button 
            onClick={() => { setShowHistory(!showHistory); setShowThemeMenu(false); setShowCurrencyMenu(false); }}
            className={`relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 rounded-xl border ${showHistory ? `bg-${pCol}-600 border-${pCol}-400 text-white shadow-lg` : 'bg-gray-900/50 border-gray-800 text-gray-400 active:scale-90'}`}
          >
            <i className={`fa-solid ${showHistory ? 'fa-calculator' : 'fa-clock-rotate-left'} text-xs sm:text-sm`}></i>
            {!showHistory && history.length > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 bg-${pCol}-500 rounded-full border-2 border-black animate-pulse`}></span>
            )}
          </button>
        </div>
      </header>

      {/* Overlays */}
      {showCurrencyMenu && (
        <div className="absolute top-16 right-20 sm:top-20 sm:right-28 z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-800 p-3 sm:p-4 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-2 w-44 sm:w-48">
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 px-2">Moneda</div>
          <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto no-scrollbar">
            {CURRENCIES.map(c => (
              <button
                key={c.id}
                onClick={() => { setCurrencyId(c.id); setShowCurrencyMenu(false); }}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${currencyId === c.id ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/50 border border-transparent'}`}
              >
                <span className={`text-xs font-bold ${currencyId === c.id ? 'text-white' : 'text-gray-400'}`}>{c.label}</span>
                <span className={`text-xs font-black ${currencyId === c.id ? `text-${pCol}-400` : 'text-gray-600'}`}>{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showThemeMenu && (
        <div className="absolute top-16 right-4 sm:top-20 sm:right-6 z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-800 p-3 sm:p-4 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-2 w-44 sm:w-48">
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 px-2">Temas</div>
          <div className="grid grid-cols-1 gap-1">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { setCurrentThemeId(t.id); setShowThemeMenu(false); }}
                className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all ${currentThemeId === t.id ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/50 border border-transparent'}`}
              >
                <div className="flex gap-1">
                   <div className={`w-2.5 h-2.5 rounded-full bg-${t.primary}-500`}></div>
                   <div className={`w-2.5 h-2.5 rounded-full bg-${t.secondary}-400`}></div>
                </div>
                <span className={`text-xs font-bold ${currentThemeId === t.id ? 'text-white' : 'text-gray-400'}`}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 overflow-hidden relative z-10">
        <div 
          className={`flex h-full w-[200%] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${showHistory ? '-translate-x-1/2' : 'translate-x-0'}`}
        >
          {/* Panel 1: Calculator */}
          <div className="w-1/2 h-full overflow-y-auto custom-scrollbar px-4 sm:px-6">
            <div className="flex flex-col gap-4 py-4 min-h-full">
              
              {/* Change Display Card */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group shrink-0">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 sm:mb-2 block">Cambio</span>
                <div className="flex items-center justify-between">
                  <div className={`text-5xl sm:text-6xl font-black tracking-tighter transition-all duration-300 ${isInsufficient ? 'text-red-500 scale-95' : isSaved ? `text-${sCol}-400 scale-105` : 'text-white'}`}>
                    {change.toFixed(2)}<span className="text-xl sm:text-2xl ml-1 font-normal text-gray-400">{currency.symbol}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 relative">
                    {!isInsufficient && (receivedNum >= fareNum) && fareNum > 0 && (
                      <button 
                        onClick={() => saveToHistory()}
                        disabled={isSaved}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center relative z-10 ${
                          isSaved 
                          ? `bg-${sCol}-500 text-white scale-100 animate-success-pop` 
                          : `bg-${pCol}-600 hover:bg-${pCol}-500 active:scale-90 text-white shadow-${pCol}-900/40`
                        }`}
                      >
                        <i className={`fa-solid ${isSaved ? 'fa-check' : 'fa-check'} text-xl sm:text-2xl`}></i>
                        
                        {/* Sparkle Explosion Effect */}
                        {isSaved && (
                          <div className="absolute inset-0 pointer-events-none">
                            {[...Array(12)].map((_, i) => (
                              <div
                                key={i}
                                className={`absolute w-2 h-2 rounded-full bg-white opacity-0 animate-sparkle-explosion`}
                                style={{ 
                                  '--tx': `${Math.cos(i * 30 * Math.PI / 180) * 80}px`,
                                  '--ty': `${Math.sin(i * 30 * Math.PI / 180) * 80}px`,
                                  '--delay': `${i * 0.02}s`
                                } as React.CSSProperties}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {isInsufficient && (
                  <div className="mt-2 text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <i className="fa-solid fa-circle-exclamation"></i> Fondos insuficientes
                  </div>
                )}
              </div>

              {/* Quick contextual action: Keep change */}
              {!isInsufficient && (receivedNum - fareNum) > 0 && !isSaved && (
                <button
                  onClick={keepFullChangeAsTip}
                  className="w-full bg-yellow-500 text-black py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 border-b-4 border-yellow-600 shrink-0"
                >
                  <i className="fa-solid fa-hand-holding-dollar text-lg"></i>
                  <span className="text-[10px] sm:text-xs">"QUÉDESE CON EL CAMBIO"</span>
                </button>
              )}

              {/* Input Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
                <div 
                  onClick={() => { if(!isSaved) setActiveInput('FARE') }}
                  className={`transition-all duration-300 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 flex flex-col cursor-pointer ${activeInput === 'FARE' ? `border-${pCol}-500/50 bg-${pCol}-500/5 ring-4 ring-${pCol}-500/10` : 'border-gray-800 bg-gray-900/20 opacity-60'}`}
                >
                  <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Precio</span>
                  <div className={`text-lg sm:text-xl font-mono font-bold text-${pCol}-400 truncate`}>
                    {fare || '0.00'}{currency.symbol}
                  </div>
                </div>

                <div 
                  onClick={() => { if(!isSaved) setActiveInput('RECEIVED') }}
                  className={`transition-all duration-300 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 flex flex-col cursor-pointer ${activeInput === 'RECEIVED' ? `border-${sCol}-500/50 bg-${sCol}-500/5 ring-4 ring-${sCol}-500/10` : 'border-gray-800 bg-gray-900/20 opacity-60'} ${isQuickBillPulsing ? 'animate-pulse-glow' : ''}`}
                >
                  <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Recibido</span>
                  <div className={`text-lg sm:text-xl font-mono font-bold text-${sCol}-400 truncate`}>
                    {received || '0.00'}{currency.symbol}
                  </div>
                </div>

                <div 
                  onClick={() => { if(!isSaved) setActiveInput('TIP') }}
                  className={`transition-all duration-300 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 flex flex-col cursor-pointer ${activeInput === 'TIP' ? `border-yellow-500/50 bg-yellow-500/5 ring-4 ring-yellow-500/10` : 'border-gray-800 bg-gray-900/20 opacity-60'}`}
                >
                  <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Propina</span>
                  <div className={`text-lg sm:text-xl font-mono font-bold text-yellow-400 truncate`}>
                    {tip || '0.00'}{currency.symbol}
                  </div>
                </div>
              </div>

              {/* Quick Bill Selection */}
              <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 shrink-0">
                {[5, 10, 20, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleQuickAmount(amt)}
                    className={`bg-gray-900/80 active:bg-${sCol}-600 active:border-${sCol}-400 active:scale-95 text-white h-12 w-16 sm:h-14 sm:w-20 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black border border-gray-800 shrink-0 transition-all flex flex-col items-center justify-center group shadow-lg`}
                  >
                    <i className="fa-solid fa-money-bill-1 text-[8px] sm:text-[10px] mb-0.5 opacity-40 group-active:opacity-100"></i>
                    {amt}{currency.symbol}
                  </button>
                ))}
              </div>

              {/* High Contrast Keypad Grid */}
              <div className="grid grid-cols-3 gap-3 shrink-0 pb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    className={`bg-gray-800/80 active:bg-${pCol}-600 border-2 border-${pCol}-500/30 active:border-${pCol}-400 shadow-xl text-3xl font-black text-${pCol}-400 active:text-white rounded-2xl py-4 sm:py-6 transition-all active:scale-95 active:shadow-inner flex items-center justify-center no-select`}
                  >
                    {num}
                  </button>
                ))}
                
                {/* Secondary color for the decimal button */}
                <button
                  onClick={() => handleNumberClick('.')}
                  className={`bg-gray-800/80 active:bg-${sCol}-600 border-2 border-${sCol}-500/30 active:border-${sCol}-400 shadow-xl text-3xl font-black text-${sCol}-400 active:text-white rounded-2xl py-4 sm:py-6 transition-all active:scale-95 flex items-center justify-center no-select`}
                >
                  .
                </button>
                
                <button
                  onClick={() => handleNumberClick('0')}
                  className={`bg-gray-800/80 active:bg-${pCol}-600 border-2 border-${pCol}-500/30 active:border-${pCol}-400 shadow-xl text-3xl font-black text-${pCol}-400 active:text-white rounded-2xl py-4 sm:py-6 transition-all active:scale-95 flex items-center justify-center no-select`}
                >
                  0
                </button>
                
                <button
                  onClick={handleDelete}
                  className="bg-red-900/20 active:bg-red-600 border-2 border-red-500/30 active:border-red-400 shadow-xl text-3xl text-red-500 active:text-white transition-all rounded-2xl flex items-center justify-center py-4 sm:py-6 active:scale-95 no-select"
                >
                  <i className="fa-solid fa-delete-left"></i>
                </button>
              </div>

              {/* Bottom Actions moved inside scroll */}
              <div className="mt-auto pt-4 pb-8 space-y-3">
                <button
                  onClick={handleClear}
                  className={`w-full bg-gray-900/50 hover:bg-red-500/10 text-gray-500 hover:text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-800 hover:border-red-500/30 transition-all flex items-center justify-center gap-3 active:scale-95`}
                >
                  <i className="fa-solid fa-rotate-right"></i>
                  Limpiar Todo
                </button>
                <p className="text-center text-[8px] text-gray-700 uppercase tracking-widest font-bold">UberChange v2.0</p>
              </div>
            </div>
          </div>

          {/* Panel 2: History */}
          <div className="w-1/2 h-full flex flex-col bg-black/40 backdrop-blur-xl border-l border-gray-800/50 px-4 sm:px-6">
            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h2 className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-500 font-black">Turno</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] sm:text-[10px] bg-${pCol}-500/10 text-${pCol}-400 px-2 py-1 rounded-full font-bold uppercase`}>{history.length} Viajes</span>
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="text-gray-600 hover:text-red-500 transition-colors text-xs p-1">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Card */}
              {history.length > 0 && (
                <div className={`bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-5 sm:p-6 rounded-[2rem] shadow-xl mb-6 flex flex-col gap-3 sm:gap-4 relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 p-4 opacity-5 text-gray-500`}>
                    <i className="fa-solid fa-vault text-3xl sm:text-4xl"></i>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Efectivo Recaudado</span>
                    <div className={`text-3xl sm:text-4xl font-black text-${pCol}-400 tracking-tighter`}>
                      {totals.collected.toFixed(2)}<span className="text-lg sm:text-xl ml-1 font-normal text-gray-500">{currency.symbol}</span>
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-gray-800"></div>

                  <div className="flex flex-col items-center">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500 mb-1">Total Propinas</span>
                    <div className={`text-xl sm:text-2xl font-black text-yellow-400 tracking-tighter`}>
                      {totals.tips.toFixed(2)}<span className="text-xs sm:text-sm ml-1 font-normal text-gray-500">{currency.symbol}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-10">
                  <i className="fa-solid fa-receipt text-6xl mb-6"></i>
                  <p className="text-center font-bold tracking-widest uppercase text-xs">Sin registros</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="bg-gray-900/20 border border-gray-800/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex justify-between items-center transition-all hover:bg-gray-900/40 group">
                    <div className="flex flex-col gap-0.5">
                      <div className={`text-[8px] text-${pCol}-500 font-black uppercase tracking-widest`}>{item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Cobro: <span className="text-white font-mono">{item.fare.toFixed(2)}{currency.symbol}</span></div>
                      {item.tip > 0 && (
                        <div className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded-md font-bold uppercase w-fit">
                          +{item.tip.toFixed(2)}{currency.symbol}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Cambio</div>
                      <div className={`text-xl sm:text-2xl font-black text-${sCol}-400 font-mono tracking-tighter group-hover:scale-105 transition-transform`}>{item.change.toFixed(2)}{currency.symbol}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="py-4 sm:py-6 shrink-0">
              <button 
                onClick={() => setShowHistory(false)}
                className={`w-full bg-${pCol}-600 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-${pCol}-900/40 active:scale-95 transition-all text-xs sm:text-sm`}
              >
                Volver a Calcular
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        button { touch-action: manipulation; }
        .cubic-bezier { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
        
        @keyframes success-pop {
          0% { transform: scale(0.9); }
          50% { transform: scale(1.15); filter: brightness(1.3); }
          100% { transform: scale(1); }
        }
        .animate-success-pop { animation: success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

        @keyframes sparkle-explosion {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.2);
          }
        }
        .animate-sparkle-explosion {
          position: absolute;
          left: 50%;
          top: 50%;
          animation: sparkle-explosion 0.8s cubic-bezier(0, 0, 0.2, 1) forwards;
          animation-delay: var(--delay);
          box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8);
        }

        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          50% { transform: scale(1.02); box-shadow: 0 0 25px 5px rgba(34, 197, 94, 0.2); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .animate-pulse-glow { animation: pulse-glow 0.4s ease-out; }

        @keyframes animate-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: animate-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .no-select {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default App;
