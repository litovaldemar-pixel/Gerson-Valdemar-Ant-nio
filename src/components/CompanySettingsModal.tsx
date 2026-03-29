import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CompanyInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, useDragControls } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIsCreating?: boolean;
}

const CompanySettingsModal = ({ isOpen, onClose, defaultIsCreating = false }: CompanySettingsModalProps) => {
  const { t } = useTranslation();
  const { companyInfo, updateCompanyInfo, companies, currentCompanyId, setCurrentCompanyId, addCompany } = useAppContext();
  const { logout } = useAuth();
  const dragControls = useDragControls();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nuit: '',
    contact: '',
    location: '',
    pin: '',
    sector: 'comercio' as 'servicos' | 'comercio' | 'misto',
    logoUrl: '',
    ivaRate: 3
  });

  useEffect(() => {
    if (isOpen) {
      if (companies.length === 0 || defaultIsCreating) {
        setIsCreating(true);
      } else {
        setIsCreating(false);
      }
    }
  }, [isOpen, companies.length, defaultIsCreating]);

  useEffect(() => {
    if (isOpen && isCreating) {
      setFormData({ name: '', nuit: '', contact: '', location: '', pin: '', sector: 'comercio', logoUrl: '', ivaRate: 3 });
    }
  }, [isOpen, isCreating]);

  useEffect(() => {
    if (isOpen && !isCreating && companyInfo) {
      setFormData({ ...companyInfo, pin: companyInfo.pin || '', sector: companyInfo.sector || 'comercio', logoUrl: companyInfo.logoUrl || '', ivaRate: companyInfo.ivaRate !== undefined ? companyInfo.ivaRate : 3 });
    }
  }, [isOpen, isCreating, companyInfo]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || companies.length === 0) {
      await addCompany(formData);
      setIsCreating(false);
    } else {
      updateCompanyInfo(formData as CompanyInfo);
    }
    if (companies.length > 0) {
      onClose();
    }
  };

  const handleSelectCompany = (id: string) => {
    setCurrentCompanyId(id);
    setIsCreating(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert('O logotipo deve ter no máximo 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 print:hidden">
      <motion.div 
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        
        {/* Sidebar with Company List */}
        {companies.length > 0 && (
          <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800 border-r border-outline-variant/10 flex flex-col">
            <div 
              className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-white dark:bg-slate-900 select-none"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: "none", cursor: "grab" }}
            >
              <h3 className="font-bold text-slate-700 dark:text-slate-300">{t('companySettings.companyList')}</h3>
              <button 
                onClick={() => setIsCreating(true)}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                title={t('companySettings.newCompany')}
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCompany(c.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                    currentCompanyId === c.id && !isCreating
                      ? 'bg-primary text-on-primary'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold shrink-0 overflow-hidden ${
                    currentCompanyId === c.id && !isCreating ? 'bg-white/20' : 'bg-primary/10 text-primary'
                  }`}>
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold truncate text-sm">{c.name}</p>
                    <p className={`text-[10px] truncate ${currentCompanyId === c.id && !isCreating ? 'text-on-primary/80' : 'text-slate-500'}`}>
                      {t('companySettings.nuit')}: {c.nuit}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div 
            className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center shrink-0 select-none"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none", cursor: "grab" }}
          >
            <h2 className="text-xl font-bold font-headline text-primary">
              {isCreating || companies.length === 0 ? t('companySettings.newCompany') : t('companySettings.companyData')}
            </h2>
            <div className="flex items-center gap-2">
              {isCreating && companies.length > 0 && (
                <button 
                  onClick={() => setIsCreating(false)} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-2" 
                  title={t('companySettings.cancelCreation')}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              {companies.length > 0 && !isCreating && (
                <button 
                  onClick={onClose} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-2" 
                  title={t('companySettings.close')}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              {companies.length === 0 && (
                <button 
                  onClick={() => logout()} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-error hover:text-error/80 p-2 flex items-center gap-1 text-sm font-bold" 
                  title={t('companySettings.logout')}
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  {t('companySettings.logout')}
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isCreating && companyInfo?.subscription && (
                <div className={`p-4 rounded-xl border mb-4 ${companyInfo.subscription.status === 'active' && new Date(companyInfo.subscription.validUntil) > new Date() ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{t('companySettings.subscriptionStatus')}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${companyInfo.subscription.status === 'active' && new Date(companyInfo.subscription.validUntil) > new Date() ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {companyInfo.subscription.status === 'active' && new Date(companyInfo.subscription.validUntil) > new Date() ? t('companySettings.active', 'Ativa') : t('companySettings.expired', 'Expirada')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-on-surface-variant">{t('companySettings.validUntil')}:</p>
                      <p className="text-sm font-bold text-on-surface">{new Date(companyInfo.subscription.validUntil).toLocaleDateString('pt-MZ')}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] text-on-surface-variant">{t('companySettings.plan')}:</p>
                      <p className="text-sm font-bold text-on-surface mb-2">{companyInfo.subscription.plan}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const message = `Olá! Gostaria de renovar a subscrição da minha empresa.\n\nEmpresa: ${companyInfo.name}\nID: ${companyInfo.id}`;
                          window.open(`https://wa.me/258871788070?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="text-[10px] font-bold bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:brightness-110 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">autorenew</span>
                        {t('companySettings.renew', 'Renovar')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-4 mb-2">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {formData.logoUrl ? (
                      <>
                        <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white">edit</span>
                        </div>
                      </>
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-outline-variant">add_photo_alternate</span>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title={t('companySettings.changeLogo')}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{t('companySettings.companyLogo')}</h3>
                    <p className="text-xs text-on-surface-variant">{t('companySettings.maxSize')}</p>
                    {formData.logoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                        className="text-xs text-error font-bold mt-1 hover:underline"
                      >
                        {t('companySettings.removeLogo')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">{t('companySettings.companyName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: Financial Architect Lda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">{t('companySettings.nuit')}</label>
                  <input
                    type="text"
                    required
                    value={formData.nuit}
                    onChange={(e) => setFormData({ ...formData, nuit: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: 400000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">{t('companySettings.contact')}</label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: +258 84 000 0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">{t('companySettings.location')}</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: Av. 24 de Julho, Maputo"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">{t('companySettings.sector')}</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="comercio">{t('companySettings.commerce')}</option>
                    <option value="servicos">{t('companySettings.services')}</option>
                    <option value="misto">{t('companySettings.mixed')}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">{t('companySettings.ivaRate')}</label>
                  <select
                    value={formData.ivaRate}
                    onChange={(e) => setFormData({ ...formData, ivaRate: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value={0}>{t('companySettings.exempt')} (0%)</option>
                    <option value={3}>3%</option>
                    <option value={5}>5%</option>
                    <option value={16}>16%</option>
                  </select>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {t('companySettings.ivaRateNote')}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">{t('companySettings.securityPin')}</label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t('companySettings.pinPlaceholder')}
                    maxLength={10}
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    {t('companySettings.pinNote')}
                  </p>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                {companies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isCreating) {
                        setIsCreating(false);
                      } else {
                        onClose();
                      }
                    }}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                >
                  {isCreating || companies.length === 0 ? t('companySettings.createCompany') : t('companySettings.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CompanySettingsModal;