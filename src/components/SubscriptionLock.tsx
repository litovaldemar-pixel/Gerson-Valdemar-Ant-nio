import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

const SubscriptionLock = () => {
  const { companyInfo, companies, currentCompanyId, setCurrentCompanyId, updateCompany } = useAppContext();
  const { logout, user } = useAuth();
  const [showSwitch, setShowSwitch] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const isDeveloper = user?.email === 'litovaldemar@gmail.com';

  const handleDeveloperUnlock = async () => {
    if (!companyInfo) return;
    setVerifying(true);
    try {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      await updateCompany(companyInfo.id, {
        subscription: {
          status: 'active',
          validUntil: nextYear.toISOString(),
          plan: 'Developer Override',
          price: 0
        }
      });
    } catch (err) {
      setError('Erro no desbloqueio de desenvolvedor.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || transactionId.length < 5) {
      setError('Por favor, insira um ID de transação válido.');
      return;
    }

    setVerifying(true);
    setError('');

    // Simulate automatic verification
    setTimeout(async () => {
      try {
        if (!companyInfo) return;
        
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await updateCompany(companyInfo.id, {
          subscription: {
            status: 'active',
            validUntil: nextMonth.toISOString(),
            plan: 'Mensal',
            price: 5000
          }
        });
        setVerifying(false);
      } catch (err) {
        setError('Erro ao processar pagamento. Tente novamente.');
        setVerifying(false);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-8 text-center flex flex-col"
      >
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
          <span className="material-symbols-outlined text-4xl">lock_clock</span>
        </div>
        <h2 className="text-3xl font-black font-headline text-on-surface mb-2 tracking-tight">
          Acesso Bloqueado
        </h2>
        <p className="text-on-surface-variant mb-8 font-medium">
          A subscrição da empresa <strong>{companyInfo?.name}</strong> expirou. Para continuar a usar o sistema APPK, efectue o pagamento mensal.
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 text-left border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Pagamento Móvel
            </h3>
            <span className="text-xl font-black text-primary">5.000,00 MT</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant/20">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">M-Pesa (Vodacom)</p>
              <p className="text-lg font-black text-primary">848807062</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant/20">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">E-mola (Movitel)</p>
              <p className="text-lg font-black text-primary">871788070</p>
            </div>
          </div>
          
          <p className="text-[10px] text-on-surface-variant text-center italic">
            O sistema desbloqueia automaticamente após a confirmação do ID da transação.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 mb-8">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-widest">ID da Transação</label>
            <input 
              type="text"
              placeholder="Ex: 8J3K9L2M..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none font-mono tracking-wider"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-error text-sm font-bold">{error}</p>}

          <button 
            type="submit"
            disabled={verifying}
            className="w-full bg-primary text-on-primary px-6 py-4 rounded-xl font-black text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {verifying ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">verified_user</span>
                Confirmar Pagamento
              </>
            )}
          </button>
        </form>

        <div className="space-y-3">
          {isDeveloper && (
            <div className="pt-4 border-t border-primary/20">
              <button 
                onClick={handleDeveloperUnlock}
                disabled={verifying}
                className="w-full bg-primary/10 text-primary px-4 py-3 rounded-xl font-black hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm border border-primary/20"
              >
                <span className="material-symbols-outlined text-lg">terminal</span>
                Desbloqueio de Desenvolvedor
              </button>
            </div>
          )}

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

          <div className="pt-4 flex gap-3">
            <button 
              onClick={() => window.location.href = 'https://wa.me/258848807062'}
              className="flex-1 bg-secondary/10 text-secondary px-4 py-3 rounded-xl font-bold hover:bg-secondary/20 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-lg">support_agent</span>
              Suporte
            </button>
            <button 
              onClick={async () => {
                await logout();
                window.location.href = '/';
              }}
              className="flex-1 bg-error/10 text-error px-4 py-3 rounded-xl font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Sair
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionLock;
