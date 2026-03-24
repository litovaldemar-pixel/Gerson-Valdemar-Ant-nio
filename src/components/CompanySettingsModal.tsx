import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CompanyInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, useDragControls } from 'motion/react';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompanySettingsModal = ({ isOpen, onClose }: CompanySettingsModalProps) => {
  const { companyInfo, updateCompanyInfo, companies, currentCompanyId, setCurrentCompanyId, addCompany } = useAppContext();
  const { logout } = useAuth();
  const dragControls = useDragControls();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nuit: '',
    contact: '',
    location: '',
    pin: ''
  });

  useEffect(() => {
    if (isOpen && companies.length === 0) {
      setIsCreating(true);
    }
  }, [isOpen, companies.length]);

  useEffect(() => {
    if (isOpen && isCreating) {
      setFormData({ name: '', nuit: '', contact: '', location: '', pin: '' });
    }
  }, [isOpen, isCreating]);

  useEffect(() => {
    if (isOpen && !isCreating && companyInfo) {
      setFormData({ ...companyInfo, pin: companyInfo.pin || '' });
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
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Minhas Empresas</h3>
              <button 
                onClick={() => setIsCreating(true)}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                title="Nova Empresa"
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
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold shrink-0 ${
                    currentCompanyId === c.id && !isCreating ? 'bg-white/20' : 'bg-primary/10 text-primary'
                  }`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold truncate text-sm">{c.name}</p>
                    <p className={`text-[10px] truncate ${currentCompanyId === c.id && !isCreating ? 'text-on-primary/80' : 'text-slate-500'}`}>
                      NUIT: {c.nuit}
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
              {isCreating || companies.length === 0 ? 'Nova Empresa' : 'Dados da Empresa'}
            </h2>
            <div className="flex items-center gap-2">
              {isCreating && companies.length > 0 && (
                <button 
                  onClick={() => setIsCreating(false)} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-2" 
                  title="Cancelar Criação"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              {companies.length > 0 && !isCreating && (
                <button 
                  onClick={onClose} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-2" 
                  title="Fechar"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              {companies.length === 0 && (
                <button 
                  onClick={() => logout()} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-error hover:text-error/80 p-2 flex items-center gap-1 text-sm font-bold" 
                  title="Sair da Conta"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Sair
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isCreating && companyInfo?.subscription && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Estado da Subscrição</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${companyInfo.subscription.status === 'active' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {companyInfo.subscription.status === 'active' ? 'Ativa' : 'Expirada'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-on-surface-variant">Válido até:</p>
                      <p className="text-sm font-bold text-on-surface">{new Date(companyInfo.subscription.validUntil).toLocaleDateString('pt-MZ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-on-surface-variant">Plano:</p>
                      <p className="text-sm font-bold text-on-surface">{companyInfo.subscription.plan}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Nome do Estabelecimento / Empresa</label>
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
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">NUIT</label>
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
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Contacto</label>
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
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Localização</label>
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
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">PIN de Acesso (Opcional)</label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Deixe em branco para não usar PIN"
                    maxLength={10}
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    Adicione um PIN para proteger o acesso a esta empresa.
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
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                >
                  {isCreating || companies.length === 0 ? 'Criar Empresa' : 'Salvar Dados'}
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