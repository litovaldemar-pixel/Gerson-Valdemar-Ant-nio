import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

interface Rates {
  [key: string]: number;
}

const CurrencyConverter = () => {
  const { t } = useTranslation();
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCurrency, setFromCurrency] = useState('MZN');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState<string>('1000');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const popularCurrencies = ['MZN', 'USD', 'EUR', 'ZAR', 'GBP', 'BRL'];

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        // Using an open exchange rate API (free, no key required for base endpoints often)
        // Alternatively, since API access requires keys usually, we can use a free public API 
        // fallback or just fetch exchange-rate-api public endpoint.
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setRates(data.rates);
        setLastUpdated(new Date().toLocaleString('pt-MZ'));
        setError(null);
        // Cache rates for offline use
        localStorage.setItem('vendaLink_currencyRates', JSON.stringify({
          rates: data.rates,
          lastUpdated: new Date().toLocaleString('pt-MZ')
        }));
      } catch (err) {
        console.error('Error fetching rates:', err);
        // Fallback to cached rates if offline
        const cached = localStorage.getItem('vendaLink_currencyRates');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setRates(parsed.rates);
            setLastUpdated(parsed.lastUpdated);
            setError('Modo offline: usando taxas de câmbio guardadas localmente.');
          } catch (e) {
            setError('Não foi possível carregar as taxas de câmbio.');
          }
        } else {
          setError('Não foi possível carregar as taxas de câmbio. Verifique a sua ligação.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const calculateConversion = () => {
    if (!rates || !amount || isNaN(Number(amount))) return '0.00';
    
    const amountNum = Number(amount);
    
    // Convert logic (everything is relative to base USD in the API we used)
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    
    if (!fromRate || !toRate) return '0.00';
    
    // Amount in USD = amountNum / fromRate
    // Convert to target = (amountNum / fromRate) * toRate
    const result = (amountNum / fromRate) * toRate;
    
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), { 
      style: 'currency', 
      currency: toCurrency 
    }).format(result);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 justify-between mb-4">
        <h3 className="text-lg font-bold font-headline text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">currency_exchange</span>
          Conversor de Moedas
        </h3>
        {lastUpdated && (
          <span className="text-[10px] text-on-surface-variant bg-surface-variant/30 px-2 py-1 rounded-full">
            {lastUpdated}
          </span>
        )}
      </div>

      {error && !rates && (
        <div className="bg-error/10 text-error p-3 rounded-lg text-sm mb-4">
          <span className="material-symbols-outlined text-sm align-middle mr-1">wifi_off</span>
          {error}
        </div>
      )}
      
      {error && rates && (
        <div className="text-error/80 text-xs mb-3 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">signal_wifi_bad</span>
          {error}
        </div>
      )}

      {loading && !rates ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">Valor</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="0.00"
              min="0"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-on-surface-variant mb-1">De</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {popularCurrencies.map(c => (
                  <option key={`from-${c}`} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="mt-5 text-on-surface-variant">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Para</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {popularCurrencies.map(c => (
                  <option key={`to-${c}`} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 text-center mt-4 border border-primary/10">
            <p className="text-xs text-on-surface-variant mb-1">Resultado (+/- câmbio do dia)</p>
            <p className="text-2xl font-bold font-mono text-primary">{calculateConversion()}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CurrencyConverter;
