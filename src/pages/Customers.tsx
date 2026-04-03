import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import CustomerStatementModal from '../components/CustomerStatementModal';
import { Customer } from '../types';
import PrintHeader from '../components/PrintHeader';
import { useTranslation } from 'react-i18next';
import { exportToCSV } from '../lib/exportUtils';

const Customers = () => {
  const { customers, addCustomer, deleteCustomer, updateCustomer, globalSearchTerm } = useAppContext();
  const { t } = useTranslation();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    document: true,
    status: true,
    actions: true
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    const term = (localSearchTerm || globalSearchTerm).toLowerCase();
    if (!term) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.document && c.document.toLowerCase().includes(term))
    );
  }, [customers, localSearchTerm, globalSearchTerm]);

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email);
    setDocument(c.document);
    setStatus(c.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setDocument('');
    setStatus('Ativo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      updateCustomer(editingId, {
        name,
        email,
        document,
        status,
      });
      setEditingId(null);
    } else {
      addCustomer({
        name,
        email,
        document,
        status,
      });
    }

    setName('');
    setEmail('');
    setDocument('');
    setStatus('Ativo');
  };

  const handleExport = () => {
    const exportData = filteredCustomers.map(c => ({
      ID: c.id,
      Nome: c.name,
      Email: c.email,
      Documento: c.document,
      Status: c.status
    }));
    exportToCSV(exportData, 'clientes.csv');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      <PrintHeader />
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{t('sidebar.customers')}</h2>
      </div>

      {/* Header Section */}
      <section className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">{t('sidebar.customers')}</h2>
          <p className="text-on-surface-variant font-medium mt-1">{t('customers.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            {t('dashboard.print')}
          </button>
          <button 
            onClick={handleExport}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar CSV
          </button>
        </div>
      </section>

      {/* Quick Entry Form Section */}
      <section className="bg-surface-container-low rounded-xl p-6 print:hidden">
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">{t('customers.newCustomer')}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">{t('customers.nameLabel')}</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder={t('customers.namePlaceholder')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">{t('customers.emailLabel')}</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder={t('customers.emailPlaceholder')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">{t('customers.documentLabel')}</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder={t('customers.documentPlaceholder')}
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">{t('customers.statusLabel')}</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim appearance-none"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
            >
              <option value="Ativo">{t('customers.statusActive')}</option>
              <option value="Inativo">{t('customers.statusInactive')}</option>
            </select>
          </div>
          <div className="flex gap-2 w-full">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-full bg-surface-variant text-on-surface-variant py-3 rounded-lg font-bold text-sm hover:bg-outline-variant transition-colors">
                {t('common.cancel')}
              </button>
            )}
            <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors">
              {editingId ? t('common.update') : t('common.register')}
            </button>
          </div>
        </form>
      </section>

      {/* Customers Table Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-headline font-bold text-lg text-primary">{t('customers.listTitle')}</h3>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder={t('customers.searchPlaceholder')}
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container px-3 py-2 rounded-lg text-sm font-bold text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">view_column</span>
                <span className="hidden sm:inline">{t('customers.columns')}</span>
              </button>
              
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-10 py-2">
                  <div className="px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 mb-2">
                    {t('customers.showColumns')}
                  </div>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.name} onChange={() => toggleColumn('name')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('customers.nameLabel')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.email} onChange={() => toggleColumn('email')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('customers.emailLabel')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.document} onChange={() => toggleColumn('document')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('customers.documentLabel')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.status} onChange={() => toggleColumn('status')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('customers.statusLabel')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.actions} onChange={() => toggleColumn('actions')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('customers.actionsLabel')}</span>
                  </label>
                </div>
              )}
            </div>
            
            <span className="text-xs text-on-surface-variant whitespace-nowrap hidden sm:inline">{t('customers.totalCount', { count: filteredCustomers.length })}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                {visibleColumns.name && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('customers.nameLabel')}</th>}
                {visibleColumns.email && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('customers.emailLabel')}</th>}
                {visibleColumns.document && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('customers.documentLabel')}</th>}
                {visibleColumns.status && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('customers.statusLabel')}</th>}
                {visibleColumns.actions && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">{t('customers.actionsLabel')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    {customers.length === 0 ? t('customers.noCustomersYet') : t('customers.noCustomersFound')}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  {visibleColumns.name && <td className="px-6 py-4 text-sm font-bold text-primary">{c.name}</td>}
                  {visibleColumns.email && <td className="px-6 py-4 text-sm text-on-surface-variant">{c.email}</td>}
                  {visibleColumns.document && <td className="px-6 py-4 text-sm text-on-surface-variant">{c.document}</td>}
                  {visibleColumns.status && <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${c.status === 'Ativo' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {c.status === 'Ativo' ? t('customers.statusActive') : t('customers.statusInactive')}
                    </span>
                  </td>}
                  {visibleColumns.actions && <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setSelectedCustomer(c); setIsStatementOpen(true); }} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary-container/20 transition-all" title={t('customers.viewStatement')}>
                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                      </button>
                      <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all" title={t('common.edit')}>
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteCustomer(c.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all" title={t('common.delete')}>
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>}
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <CustomerStatementModal 
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default Customers;
