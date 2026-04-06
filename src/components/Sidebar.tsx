import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import CompanySettingsModal from './CompanySettingsModal';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { logout, user } = useAuth();
  const { companyInfo, setCurrentCompanyId } = useAppContext();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const { t } = useTranslation();

  const isDeveloper = 
    user?.email?.toLowerCase().includes('litovaldemar') || 
    user?.email?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase().includes('gerson') ||
    user?.email?.toLowerCase() === 'teste@teste.com';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full flex flex-col py-6 w-64 bg-slate-100 dark:bg-slate-800/50 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
      <div className="px-6 mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-on-primary font-black text-xl overflow-hidden shrink-0">
            {companyInfo?.logoUrl ? (
              <img src={companyInfo.logoUrl} alt={companyInfo.name} className="w-full h-full object-cover" />
            ) : (
              companyInfo?.name ? companyInfo.name.charAt(0).toUpperCase() : 'C'
            )}
          </div>
          <button 
            onClick={() => {
              setIsCreatingMode(false);
              setIsSettingsOpen(true);
            }} 
            className="text-left hover:opacity-80 transition-opacity focus:outline-none"
          >
            <h1 className="text-lg font-black text-blue-900 dark:text-blue-100 font-headline tracking-tight truncate max-w-[140px]">
              {companyInfo?.name || 'CapitalCorp'}
            </h1>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Enterprise ERP</p>
              {companyInfo?.subscription?.status === 'active' && (
                <span className="bg-primary/10 text-primary text-[8px] font-black px-1 rounded uppercase tracking-tighter">Premium</span>
              )}
            </div>
          </button>
        </div>
        <button className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span>{t('sidebar.dashboard')}</span>
        </NavLink>
        <NavLink
          to="/pos"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">point_of_sale</span>
          <span>POS</span>
        </NavLink>
        <NavLink
          to="/lancamentos"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          <span>{t('sidebar.transactions')}</span>
        </NavLink>
        <NavLink
          to="/clientes"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">group</span>
          <span>{t('sidebar.customers')}</span>
        </NavLink>
        <NavLink
          to="/fornecedores"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">local_shipping</span>
          <span>{t('sidebar.suppliers')}</span>
        </NavLink>
        <NavLink
          to="/mercadorias"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">inventory_2</span>
          <span>{t('sidebar.products')}</span>
        </NavLink>
        <NavLink
          to="/salarios"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">payments</span>
          <span>{t('sidebar.payroll') || 'Salários'}</span>
        </NavLink>
        <NavLink
          to="/dre"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">insert_chart</span>
          <span>{t('sidebar.dre')}</span>
        </NavLink>
        <NavLink
          to="/balancete"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-blue-900 dark:text-blue-100 font-bold border-r-4 border-blue-900 dark:border-blue-400 bg-white/50 dark:bg-slate-900/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-slate-800/30'
            }`
          }
        >
          <span className="material-symbols-outlined">receipt_long</span>
          <span>{t('sidebar.statement')}</span>
        </NavLink>
        <NavLink
          to="/"
          onClick={() => {
            onClose();
            setCurrentCompanyId(null);
          }}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-primary font-bold border-r-4 border-primary bg-primary/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10'
            }`
          }
        >
          <span className="material-symbols-outlined">home</span>
          <span>{t('sidebar.mainMenu')}</span>
        </NavLink>
        <button
          onClick={() => {
            onClose();
            setIsCreatingMode(true);
            setIsSettingsOpen(true);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 font-medium font-inter text-sm uppercase tracking-wider transition-all duration-300 ease-in-out text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10"
        >
          <span className="material-symbols-outlined">add_business</span>
          <span>{t('sidebar.addCompany')}</span>
        </button>
      </nav>
      <div className="px-4 mt-auto flex flex-col gap-2">
        {companyInfo?.pin && (
          <button 
            onClick={() => {
              setCurrentCompanyId(null);
              onClose();
            }}
            className="w-full py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 duration-200 transition-colors"
          >
            <span className="material-symbols-outlined">lock</span>
            <span>{t('sidebar.lockSession', 'Bloquear Sessão')}</span>
          </button>
        )}
        <button 
          onClick={handleLogout}
          className="w-full py-3 bg-error/10 text-error hover:bg-error/20 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 duration-200 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
          <span>{t('sidebar.logout')}</span>
        </button>
        {user?.email && (
          <div className="text-center mt-2">
            <p className="text-[10px] text-on-surface-variant opacity-60">{t('sidebar.loggedInAs', 'Logado como:')} {user.email}</p>
          </div>
        )}
      </div>
      
      <CompanySettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => {
          setIsSettingsOpen(false);
          setIsCreatingMode(false);
        }} 
        defaultIsCreating={isCreatingMode}
      />
    </aside>
  );
};

export default Sidebar;

