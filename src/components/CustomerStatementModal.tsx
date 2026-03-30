import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Customer, Transaction } from '../types';
import PrintHeader from './PrintHeader';
import { useTranslation } from 'react-i18next';

interface CustomerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerStatementModal = ({ isOpen, onClose, customer }: CustomerStatementModalProps) => {
  const { t } = useTranslation();
  const { transactions, products, companyInfo } = useAppContext();
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  const customerTransactions = useMemo(() => {
    if (!customer) return [];
    
    return transactions
      .filter(t => t.customerId === customer.id)
      .filter(t => {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, customer, startDate, endDate]);

  const totalSpent = customerTransactions.reduce((acc, curr) => acc + curr.value, 0);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-modal-open');
    } else {
      document.body.classList.remove('print-modal-open');
    }
    return () => document.body.classList.remove('print-modal-open');
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  const setQuickFilter = (filter: 'hoje' | 'semana' | 'mes' | 'ano' | 'todos') => {
    const now = new Date();
    
    if (filter === 'todos') {
      setStartDate('');
      setEndDate('');
      return;
    }

    const endStr = now.toISOString().split('T')[0];
    setEndDate(endStr);

    if (filter === 'hoje') {
      setStartDate(endStr);
    } else if (filter === 'semana') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      setStartDate(startOfWeek.toISOString().split('T')[0]);
    } else if (filter === 'mes') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
    } else if (filter === 'ano') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(startOfYear.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:w-full print:max-w-none print:max-h-none print:h-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            {t('customerStatement.title')}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors" title={t('customerStatement.printStatement')}>
              <span className="material-symbols-outlined">print</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors" title={t('companySettings.close')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Filters - Hidden on print */}
        <div className="p-6 border-b border-slate-200 bg-white print:hidden shrink-0">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
              {(['hoje', 'semana', 'mes', 'ano', 'todos'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQuickFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors text-slate-600 hover:bg-slate-200/50`}
                >
                  {filter === 'hoje' ? t('customerStatement.today') :
                   filter === 'semana' ? t('customerStatement.week') :
                   filter === 'mes' ? t('customerStatement.month') :
                   filter === 'ano' ? t('customerStatement.year') : t('customerStatement.all')}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('customerStatement.startDate')}</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-2 border"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('customerStatement.endDate')}</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-2 border"
              />
            </div>
            <div className="ml-auto bg-primary/10 text-primary px-4 py-2 rounded-lg">
              <span className="text-sm font-bold uppercase tracking-wider block text-primary/80">{t('customerStatement.periodTotal')}</span>
              <span className="text-xl font-black">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-6 overflow-y-auto flex-1 print:overflow-visible print:p-0" id="statement-content">
          <PrintHeader />
          <div className="hidden print:block text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{t('customerStatement.title')}</h2>
            <p className="text-lg font-bold text-slate-800 mt-2">{customer.name}</p>
            <p className="text-sm text-slate-600">{t('customerStatement.document')}: {customer.document}</p>
            <p className="text-sm text-slate-600">{t('customerStatement.email')}: {customer.email}</p>
            <p className="text-sm text-slate-600 mt-2">{t('customerStatement.period')}: {startDate ? new Date(startDate).toLocaleDateString() : t('customerStatement.start')} {t('customerStatement.to')} {endDate ? new Date(endDate).toLocaleDateString() : t('customerStatement.today')}</p>
          </div>

          <div className="print:hidden mb-6">
            <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
            <p className="text-sm text-slate-500">{customer.document} • {customer.email}</p>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 print:bg-transparent print:border-slate-300">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('customerStatement.date')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('customerStatement.receipt')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('customerStatement.description')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('customerStatement.items')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('customerStatement.value')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {customerTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {t('customerStatement.noTransactions')}
                  </td>
                </tr>
              ) : (
                customerTransactions.map(transaction => {
                  const isMultiItem = transaction.items && transaction.items.length > 0;
                  const product = !isMultiItem && transaction.productId ? products.find(p => p.id === transaction.productId) : null;
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">
                        {transaction.receiptNumber ? String(transaction.receiptNumber).padStart(3, '0') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {isMultiItem ? `${transaction.items!.length} ${t('customerStatement.itemsCount')}` : (product ? product.name : '-')}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-800 text-right">
                        {formatCurrency(transaction.value)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {customerTransactions.length > 0 && (
              <tfoot className="hidden print:table-footer-group">
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-right font-bold text-slate-800 uppercase tracking-wider border-t border-slate-300">
                    {t('customerStatement.periodTotal')}:
                  </td>
                  <td className="px-4 py-4 text-right font-black text-lg text-slate-800 border-t border-slate-300">
                    {formatCurrency(totalSpent)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerStatementModal;
