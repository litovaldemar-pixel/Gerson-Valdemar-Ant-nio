import React, { useState } from 'react';

interface PinModalProps {
  isOpen: boolean;
  companyName: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  error?: string;
}

const PinModal = ({ isOpen, companyName, onConfirm, onCancel, error }: PinModalProps) => {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(pin);
    setPin('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold font-headline text-primary">
            Acesso Restrito
          </h2>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-on-surface-variant mb-4">
            A empresa <strong>{companyName}</strong> está protegida por PIN. Por favor, insira o PIN para acessar.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none text-center text-2xl tracking-widest"
                placeholder="****"
                maxLength={10}
              />
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
              >
                Acessar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PinModal;
