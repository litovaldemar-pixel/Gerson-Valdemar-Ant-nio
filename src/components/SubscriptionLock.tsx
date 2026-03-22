import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const SubscriptionLock = () => {
  const { companyInfo, companies, currentCompanyId, setCurrentCompanyId } = useAppContext();
  const { logout } = useAuth();
  const [showSwitch, setShowSwitch] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-8 text-center flex flex-col max-h-[90vh]">
        <div className="overflow-y-auto flex-1">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <h2 className="text-2xl font-bold font-headline text-on-surface mb-2">
            Assinatura Expirada
          </h2>
          <p className="text-on-surface-variant mb-8">
            A assinatura da empresa <strong>{companyInfo?.name}</strong> expirou ou está inativa. Para continuar a usar o sistema, por favor, efectue o pagamento.
          </p>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 mb-8 text-left border border-outline-variant/30">
            <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Métodos de Pagamento
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">
                    E
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">E-mola</p>
                    <p className="text-sm text-on-surface-variant">871788070</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">M-pesa</p>
                    <p className="text-sm text-on-surface-variant">848807062</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 text-center">
              O valor mensal depende do volume do negócio. Por favor, contacte o suporte para mais informações.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = 'mailto:suporte@financialarchitect.com'}
              className="w-full bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">support_agent</span>
              Contactar Suporte
            </button>
            
            {companies.length > 1 && (
              <div className="pt-4 border-t border-outline-variant/20">
                {showSwitch ? (
                  <div className="text-left">
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Alternar Empresa</label>
                    <select
                      value={currentCompanyId || ''}
                      onChange={(e) => setCurrentCompanyId(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowSwitch(true)}
                    className="w-full bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">swap_horiz</span>
                    Alternar Empresa
                  </button>
                )}
              </div>
            )}

            <div className="pt-4">
              <button 
                onClick={async () => {
                  await logout();
                  window.location.href = '/';
                }}
                className="w-full bg-error/10 text-error px-6 py-3 rounded-xl font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">logout</span>
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLock;
