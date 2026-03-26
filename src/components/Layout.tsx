import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import PrintHeader from './PrintHeader';
import { useAppContext } from '../context/AppContext';
import SubscriptionLock from './SubscriptionLock';
import CompanySettingsModal from './CompanySettingsModal';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const { companyInfo, companies, loading, currentCompanyId } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentCompanyId && location.pathname !== '/') {
      navigate('/');
    }
  }, [currentCompanyId, location.pathname, navigate, loading]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Check subscription status
  const isSubscriptionValid = () => {
    if (!companyInfo?.subscription) return false; // Force subscription for all
    if (companyInfo.subscription.status !== 'active') return false;
    
    const validUntil = new Date(companyInfo.subscription.validUntil);
    return validUntil > new Date();
  };

  const showLock = !loading && companies.length > 0 && currentCompanyId && !isSubscriptionValid();
  const showCreateCompany = !loading && companies.length === 0;

  return (
    <>
      {currentCompanyId && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className={`flex-1 min-h-[100dvh] flex flex-col print:ml-0 transition-all duration-300 ease-in-out ${isSidebarOpen && currentCompanyId ? 'lg:ml-64' : 'ml-0'}`}>
        <Header onMenuClick={toggleSidebar} hideMenuButton={!currentCompanyId} />
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
        Gv Control & Business Solutions - transformamos dados em decisões inteligentes
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
