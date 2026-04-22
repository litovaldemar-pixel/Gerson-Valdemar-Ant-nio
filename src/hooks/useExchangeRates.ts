import { useState, useEffect } from 'react';

const API_URL = 'https://open.er-api.com/v6/latest/MZN';

export interface ExchangeRates {
  MZN: number;
  USD: number;
  EUR: number;
  ZAR: number;
}

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const cached = localStorage.getItem('vendalink_exchange_rates');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Retain cache if less than 12 hours old
          if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
            setRates(parsed.rates);
            setLastUpdated(parsed.lastUpdated);
            setLoading(false);
            return;
          }
        }

        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.rates) {
          const newRates: ExchangeRates = {
            MZN: 1,
            USD: data.rates.USD,
            EUR: data.rates.EUR,
            ZAR: data.rates.ZAR
          };
          
          setRates(newRates);
          const updateTime = new Date().toLocaleString('pt-MZ');
          setLastUpdated(updateTime);
          
          localStorage.setItem('vendalink_exchange_rates', JSON.stringify({
            rates: newRates,
            timestamp: Date.now(),
            lastUpdated: updateTime
          }));
        }
      } catch (error) {
        console.error('Failed to fetch rates, using fallback/cache', error);
        // Fallback to cache if offline
        const cached = localStorage.getItem('vendalink_exchange_rates');
        if (cached) {
          const parsed = JSON.parse(cached);
          setRates(parsed.rates);
          setLastUpdated(parsed.lastUpdated + ' (Offline)');
        } else {
          // Hardcoded fallbacks if no network and no cache
          const fallbacks = { MZN: 1, USD: 0.015, EUR: 0.014, ZAR: 0.28 };
          setRates(fallbacks);
          setLastUpdated('Offline (Valores Base)');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  return { rates, loading, lastUpdated };
}
