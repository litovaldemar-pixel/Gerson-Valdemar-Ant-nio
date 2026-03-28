import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const SubscriptionLock = () => {
  const { t } = useTranslation();
  const { companyInfo, companies, currentCompanyId, setCurrentCompanyId, updateCompany } = useAppContext();
  const { logout, user } = useAuth();
  const [showSwitch, setShowSwitch] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const isDeveloper = 
    user?.email?.toLowerCase().includes('litovaldemar') || 
    user?.email?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase().includes('gerson') ||
    user?.email?.toLowerCase() === 'teste@teste.com';

  const paymentRef = companyInfo?.id ? `APPK-${companyInfo.id.substring(0, 6).toUpperCase()}` : 'APPK-000000';

  const handleDeveloperAction = async (action: '30days' | '1year' | 'deactivate') => {
    if (!companyInfo) return;
    setVerifying(true);
    try {
      const newDate = new Date();
      let plan = 'Developer Override';

      if (action === '30days') {
        newDate.setDate(newDate.getDate() + 30);
        plan = 'Manual (30 Dias)';
      } else if (action === '1year') {
        newDate.setFullYear(newDate.getFullYear() + 1);
        plan = 'Manual (1 Ano)';
      } else if (action === 'deactivate') {
        newDate.setFullYear(newDate.getFullYear() + 99);
        plan = 'Vitalício (Dev)';
      }

      await updateCompany(companyInfo.id, {
        subscription: {
          status: 'active',
          validUntil: newDate.toISOString(),
          plan: plan,
          price: 0
        }
      });
    } catch (err) {
      setError(t('subscription.developerActionError'));
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionId.length < 5) {
      setError(t('subscription.invalidTransactionId'));
      return;
    }

    setVerifying(true);
    setError('');

    // Simulate automatic verification with Firebase
    setTimeout(async () => {
      try {
        if (!companyInfo) return;
        
        // In a real app, we would verify the transaction ID with an API here
        // For now, we simulate a successful payment validation
        
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
        setError(t('subscription.paymentError'));
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
          {t('subscription.accessBlocked')}
        </h2>
        <p className="text-on-surface-variant mb-8 font-medium">
          {t('subscription.expiredMessage', { companyName: companyInfo?.name })}
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 text-left border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              {t('subscription.servicePayment')}
            </h3>
            <span className="text-xl font-black text-primary">5.000,00 MT</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <p className="text-[10px] font-bold uppercase text-primary tracking-widest mb-1">{t('subscription.entity')}</p>
              <p className="text-2xl font-black text-primary font-mono tracking-widest">800900</p>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <p className="text-[10px] font-bold uppercase text-primary tracking-widest mb-1">{t('subscription.reference')}</p>
              <p className="text-2xl font-black text-primary font-mono tracking-widest">{paymentRef}</p>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant text-center font-bold uppercase tracking-widest">
            {t('subscription.validFor')}
          </p>
          
          <p className="text-[10px] text-on-surface-variant text-center italic">
            {t('subscription.autoUnlock')}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 mb-8">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-widest">{t('subscription.transactionIdLabel')}</label>
            <input 
              type="text"
              placeholder={t('subscription.transactionIdPlaceholder')}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none font-mono tracking-wider uppercase"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
              required
            />
          </div>

          {error && <p className="text-error text-sm font-bold">{error}</p>}

          <button 
            type="submit"
            disabled={verifying || transactionId.length < 5}
            className="w-full bg-primary text-on-primary px-6 py-4 rounded-xl font-black text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {verifying ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                {t('subscription.verifying')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">verified_user</span>
                {t('subscription.confirmPayment')}
              </>
            )}
          </button>
        </form>

        <div className="space-y-3">
          {isDeveloper && (
            <div className="pt-4 border-t border-primary/20 space-y-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">{t('subscription.developerPanel')}</p>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleDeveloperAction('30days')}
                  disabled={verifying}
                  className="bg-primary/10 text-primary px-2 py-2 rounded-lg font-bold hover:bg-primary/20 transition-colors text-[10px] border border-primary/20"
                >
                  +30 {t('subscription.days')}
                </button>
                <button 
                  onClick={() => handleDeveloperAction('1year')}
                  disabled={verifying}
                  className="bg-primary/10 text-primary px-2 py-2 rounded-lg font-bold hover:bg-primary/20 transition-colors text-[10px] border border-primary/20"
                >
                  +1 {t('subscription.year')}
                </button>
                <button 
                  onClick={() => handleDeveloperAction('deactivate')}
                  disabled={verifying}
                  className="bg-primary text-on-primary px-2 py-2 rounded-lg font-bold hover:brightness-110 transition-colors text-[10px]"
                >
                  {t('subscription.deactivate')}
                </button>
              </div>
            </div>
          )}

          {companies.length > 1 && (
            <div className="pt-4 border-t border-outline-variant/20">
              {showSwitch ? (
                <div className="text-left">
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">{t('subscription.switchCompany')}</label>
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
                  {t('subscription.switchCompany')}
                </button>
              )}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setCurrentCompanyId(null);
                  window.location.href = '/';
                }}
                className="flex-1 bg-surface-container-high text-on-surface px-4 py-3 rounded-xl font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-lg">home</span>
                {t('sidebar.mainMenu')}
              </button>
              <button 
                onClick={async () => {
                  await logout();
                  window.location.href = '/';
                }}
                className="flex-1 bg-error/10 text-error px-4 py-3 rounded-xl font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                {t('sidebar.logout')}
              </button>
            </div>
            <button 
              onClick={() => window.location.href = 'https://wa.me/258871788070'}
              className="w-full bg-[#25D366]/10 text-[#25D366] px-4 py-3 rounded-xl font-bold hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-lg">support_agent</span>
              {t('subscription.whatsappSupport')}
            </button>
          </div>
          <div className="pt-4 text-center">
            <p className="text-[10px] text-on-surface-variant opacity-50">
              {t('subscription.loggedInAs')}: {user?.email || t('subscription.unknown')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionLock;
