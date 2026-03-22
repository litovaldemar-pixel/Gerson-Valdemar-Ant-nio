import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import PrintHeader from './PrintHeader';
import { useAppContext } from '../context/AppContext';
import SubscriptionLock from './SubscriptionLock';
import CompanySettingsModal from './CompanySettingsModal';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { companyInfo, companies, loading } = useAppContext();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Check subscription status
  const isSubscriptionValid = () => {
    if (!companyInfo?.subscription) return true; // Legacy companies without subscription
    if (companyInfo.subscription.status !== 'active') return false;
    
    const validUntil = new Date(companyInfo.subscription.validUntil);
    return validUntil > new Date();
  };

  const showLock = !loading && companies.length > 0 && !isSubscriptionValid();
  const showCreateCompany = !loading && companies.length === 0;

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col print:ml-0">
        <Header onMenuClick={toggleSidebar} />
        <PrintHeader />
        <Outlet />
      </main>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Print Footer */}
      <div className="hidden print:block print-footer">
        Desenvolvido por Gerson Valdemar Antonio, contacto +258 848807062 ou +258 871788070.
      </div>

      {showLock && <SubscriptionLock />}
      
      <CompanySettingsModal 
        isOpen={showCreateCompany} 
        onClose={() => {}} // Cannot close if no company exists
      />
    </>
  );
};

export default Layout;
