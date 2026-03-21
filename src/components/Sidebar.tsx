import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import CompanySettingsModal from './CompanySettingsModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { logout } = useAuth();
  const { companyInfo } = useAppContext();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full flex flex-col py-6 w-64 bg-slate-100 dark:bg-slate-800/50 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
      <div className="px-6 mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-on-primary font-black text-xl">
            {companyInfo?.name ? companyInfo.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="text-left hover:opacity-80 transition-opacity focus:outline-none">
            <h1 className="text-lg font-black text-blue-900 dark:text-blue-100 font-headline tracking-tight truncate max-w-[140px]">
              {companyInfo?.name || 'CapitalCorp'}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Enterprise ERP</p>
          </button>
        </div>
        <button className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        <NavLink
          to="/"
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
          <span>Dashboard</span>
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
          <span>Lançamentos</span>
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
          <span>Clientes</span>
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
          <span>Fornecedores</span>
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
          <span>Stock</span>
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
          <span>Relatórios</span>
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
          <span>Balancete Geral</span>
        </NavLink>
      </nav>
      <div className="px-4 mt-auto flex flex-col gap-2">
        <button className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 duration-200">
          <span className="material-symbols-outlined">add</span>
          <span>Novo Lançamento</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full py-3 bg-error/10 text-error hover:bg-error/20 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 duration-200 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Sair</span>
        </button>
      </div>
      
      <CompanySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
};

export default Sidebar;

