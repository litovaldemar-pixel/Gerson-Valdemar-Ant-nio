import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="flex justify-between items-center px-4 lg:px-8 w-full sticky top-0 z-30 h-16 bg-slate-50 dark:bg-slate-900 border-b border-outline-variant/10 print:hidden">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors active:scale-95"
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            className="pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm w-64 lg:w-80 focus:ring-2 focus:ring-primary-fixed-dim"
            placeholder="Buscar lançamentos..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4 lg:gap-6">
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
          <span className="text-sm font-bold text-blue-900 dark:text-blue-100 font-headline hidden sm:block">Financial Architect</span>
          <button 
            onClick={handleLogout}
            title="Sair"
            className="w-8 h-8 flex items-center justify-center rounded-full text-error hover:bg-error/10 transition-colors active:scale-95 ml-2"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
