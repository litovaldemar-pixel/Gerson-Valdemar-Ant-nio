import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import CompanySettingsModal from '../components/CompanySettingsModal';

const Home = () => {
  const { user } = useAuth();
  const { companies, setCurrentCompanyId } = useAppContext();
  const navigate = useNavigate();
  const isAdmin = user?.email === 'litovaldemar@gmail.com';
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectCompany = (companyId: string) => {
    setCurrentCompanyId(companyId);
    localStorage.setItem('@FinancialArchitect:currentCompanyId', companyId);
    navigate('/dashboard');
  };

  if (isAdmin) {
    return (
      <div className="flex flex-col lg:flex-row h-full min-h-[100dvh]">
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-outline-variant/20 overflow-y-auto bg-surface">
          <AdminPanel embedded={true} />
        </div>
        <div className="w-full lg:w-1/2 p-4 md:p-6 lg:p-8 overflow-y-auto bg-surface-container-lowest/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold font-headline text-primary flex items-center gap-3">
              <span className="material-symbols-outlined">domain</span>
              Lista de Empresas
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Adicionar Empresa
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => handleSelectCompany(company.id)}
                className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group flex flex-col h-full"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">storefront</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface mb-1">{company.name}</h3>
                <p className="text-sm text-on-surface-variant mb-4 flex-1">NUIT: {company.nuit}</p>
                <div className="flex items-center text-primary text-sm font-bold mt-auto">
                  Acessar ERP
                  <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </button>
            ))}
            {companies.length === 0 && (
              <div className="col-span-full p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">domain_disabled</span>
                <p className="text-on-surface-variant font-bold">Nenhuma empresa encontrada.</p>
              </div>
            )}
          </div>
        </div>
        <CompanySettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultIsCreating={true} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full min-h-[100dvh]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
        <h2 className="text-3xl font-extrabold font-headline text-primary flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl">domain</span>
          Lista de Empresas
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Adicionar Empresa
        </button>
      </div>
      <p className="text-on-surface-variant font-medium mb-8">Selecione uma empresa para acessar o sistema ERP.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {companies.map(company => (
          <button
            key={company.id}
            onClick={() => handleSelectCompany(company.id)}
            className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group flex flex-col h-full"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">storefront</span>
            </div>
            <h3 className="font-bold text-lg text-on-surface mb-1">{company.name}</h3>
            <p className="text-sm text-on-surface-variant mb-4 flex-1">NUIT: {company.nuit}</p>
            <div className="flex items-center text-primary text-sm font-bold mt-auto">
              Acessar ERP
              <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </button>
        ))}
        {companies.length === 0 && (
          <div className="col-span-full p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">domain_disabled</span>
            <p className="text-on-surface-variant font-bold">Nenhuma empresa encontrada.</p>
          </div>
        )}
      </div>
      <CompanySettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultIsCreating={true} />
    </div>
  );
};

export default Home;
