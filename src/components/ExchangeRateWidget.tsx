import React, { useState } from 'react';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { useTranslation } from 'react-i18next';

export default function ExchangeRateWidget() {
  const { rates, loading, lastUpdated } = useExchangeRates();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const isOffline = !navigator.onLine;

  const getInverseRate = (rate: number) => {
    if (!rate || rate === 0) return 0;
    return (1 / rate).toFixed(2);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
      >
        <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
        {isOffline ? (
          <span className="text-amber-600 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">wifi_off</span> Offline</span>
        ) : (
          <span className="hidden sm:inline">Câmbio</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">monitoring</span>
                Taxas de Câmbio (Base: MZN)
              </h3>
            </div>
            
            <div className="p-3">
              {loading ? (
                <div className="text-center text-sm py-4">A carregar taxas...</div>
              ) : rates ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇺🇸</span>
                      <span className="font-bold text-sm">USD</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{getInverseRate(rates.USD)} MT</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇪🇺</span>
                      <span className="font-bold text-sm">EUR</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{getInverseRate(rates.EUR)} MT</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇿🇦</span>
                      <span className="font-bold text-sm">ZAR</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{getInverseRate(rates.ZAR)} MT</div>
                    </div>
                  </div>
                  
                  <div className="pt-2 text-[10px] text-slate-500 flex justify-between items-center">
                    <span>{isOffline ? 'Modo Offline (Cache)' : 'Atualizado em:'}</span>
                    <span>{lastUpdated}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm py-4 text-error">Erro ao carregar câmbios.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
