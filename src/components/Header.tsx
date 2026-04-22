import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import CompanySettingsModal from './CompanySettingsModal';
import ChangePasswordModal from './ChangePasswordModal';
import ExchangeRateWidget from './ExchangeRateWidget';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onMenuClick: () => void;
  hideMenuButton?: boolean;
}

const Header = ({ onMenuClick, hideMenuButton = false }: HeaderProps) => {
  const { logout } = useAuth();
  const { companyInfo, globalSearchTerm, setGlobalSearchTerm, setCurrentCompanyId } = useAppContext();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="flex justify-between items-center px-4 lg:px-8 w-full sticky top-0 z-30 h-16 bg-slate-50 dark:bg-slate-900 border-b border-outline-variant/10 print:hidden">
      <div className="flex items-center gap-4">
        {!hideMenuButton && (
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors active:scale-95"
            onClick={onMenuClick}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            className="pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm w-64 lg:w-80 focus:ring-2 focus:ring-primary-fixed-dim"
            placeholder={t('common.search')}
            type="text"
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-2">
          <ExchangeRateWidget />
          <select 
            value={i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'pt'}  
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm py-1 px-2 focus:ring-2 focus:ring-primary-fixed-dim outline-none cursor-pointer"
            title={t('header.language')}
          >
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="zh">ZH</option>
            <option value="fr">FR</option>
          </select>
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors active:scale-95">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors active:scale-95">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
        <div className="h-8 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <img
            className="w-8 h-8 rounded-full object-cover"
            alt="User profile avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUC5WsUkRoScAmhIit1Vy2vSM6TCijKZ3C_wGyZIkNwDSVLHAe-wF7rdYHPh1GRnOJMOiGcDXYcT21_riPJiiMRWRmEO9Ab-lgCtUTae4hWVX6mudl_NsiXE-6c_52ZlFM3w9Jvhx1CAG6XORPepNAVcJBYARzco-DBy9ePa-loLqY8-8we9GjYKPAjDaovSAnXkxl1DKZ310XbhZkC3Z46bBSBcpZUk2xCLuSh0gkX4DN4y0cXNSLOjolvMs0T-WC1Npwp56C76w"
          />
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-sm font-bold text-blue-900 dark:text-blue-100 font-headline hidden sm:block hover:underline focus:outline-none"
            title={t('sidebar.settings')}
          >
            {companyInfo?.name || 'Financial Architect'}
          </button>
          <button 
            onClick={() => {
              setCurrentCompanyId(null);
              navigate('/');
            }}
            title={t('sidebar.mainMenu')}
            className="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-primary-fixed/20 transition-colors active:scale-95 ml-2"
          >
            <span className="material-symbols-outlined text-xl">home</span>
          </button>
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            title={t('header.changePassword')}
            className="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-primary-fixed/20 transition-colors active:scale-95 ml-1"
          >
            <span className="material-symbols-outlined text-xl">lock_reset</span>
          </button>
          <button 
            onClick={handleLogout}
            title={t('sidebar.logout')}
            className="w-8 h-8 flex items-center justify-center rounded-full text-error hover:bg-error/10 transition-colors active:scale-95 ml-1"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>
      
      <CompanySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </header>
  );
};

export default Header;
