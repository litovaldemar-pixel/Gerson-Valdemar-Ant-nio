import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompanySettingsModal = ({ isOpen, onClose }: CompanySettingsModalProps) => {
  const { companyInfo, updateCompanyInfo } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    nuit: '',
    contact: '',
    location: ''
  });

  useEffect(() => {
    if (companyInfo) {
      setFormData(companyInfo);
    }
  }, [companyInfo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyInfo(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
          <h2 className="text-xl font-bold font-headline text-primary">Dados da Empresa</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
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
          <div>
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
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            >
              Salvar Dados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettingsModal;