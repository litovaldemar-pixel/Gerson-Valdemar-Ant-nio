import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface PinModalProps {
  isOpen: boolean;
  companyName: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  error?: string;
}

const PinModal = ({ isOpen, companyName, onConfirm, onCancel, error }: PinModalProps) => {
  const [pin, setPin] = useState('');
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length >= 4) {
      onConfirm(pin);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPin(value);
    
    // Auto-submit if it reaches 4 digits (or more if they paste)
    if (value.length >= 4) {
      onConfirm(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h2 className="text-xl font-bold font-headline text-slate-800 dark:text-white">
              {t('pinModal.title', 'Acesso Restrito')}
            </h2>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('pinModal.message', { companyName, defaultValue: `A empresa ${companyName} está protegida por PIN. Por favor, insira o PIN para acessar.` })}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={pin}
                onChange={handlePinChange}
                className={`w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 ${error ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-primary/20'} rounded-2xl focus:ring-4 outline-none text-center text-3xl tracking-[0.5em] font-mono transition-all`}
                placeholder="••••"
                maxLength={6}
              />
              {error && (
                <p className="text-red-500 text-sm font-medium mt-3 text-center flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </p>
              )}
            </div>
            
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={pin.length < 4}
                className="px-6 py-3 text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <span>{t('pinModal.access', 'Acessar')}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PinModal;
