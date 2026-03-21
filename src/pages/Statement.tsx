import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const Statement = () => {
  const { transactions, products, customers, suppliers, companyInfo } = useAppContext();
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate]);

  const totalReceitas = filteredTransactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
  const totalDespesas = filteredTransactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);
  const saldo = totalReceitas - totalDespesas;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      {/* Header Section */}
      <section className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">Balancete Geral</h2>
          <p className="text-on-surface-variant font-medium mt-1">Visão geral de todas as movimentações no período.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Imprimir
          </button>
        </div>
      </section>

      {/* Filters - Hidden on print */}
      <section className="bg-surface-container-low rounded-xl p-6 print:hidden">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Data Inicial</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Data Final</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
            />
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">arrow_upward</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Total Entradas</p>
              <h3 className="text-2xl font-black text-secondary">{formatCurrency(totalReceitas)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined">arrow_downward</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Total Saídas</p>
              <h3 className="text-2xl font-black text-error">{formatCurrency(totalDespesas)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${saldo >= 0 ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Saldo do Período</p>
              <h3 className={`text-2xl font-black ${saldo >= 0 ? 'text-primary' : 'text-error'}`}>{formatCurrency(saldo)}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Printable Content */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden print:shadow-none print:bg-transparent">
        {/* Print Header */}
        <div className="hidden print:block text-center mb-8 border-b border-outline-variant/20 pb-6">
          <h1 className="text-2xl font-black uppercase tracking-wider mb-2">{companyInfo?.name || 'SUA EMPRESA'}</h1>
          <h2 className="text-xl font-bold text-slate-800">Balancete Geral</h2>
          <p className="text-sm text-slate-600 mt-2">Período: {startDate ? new Date(startDate).toLocaleDateString('pt-MZ') : 'Início'} a {endDate ? new Date(endDate).toLocaleDateString('pt-MZ') : 'Hoje'}</p>
        </div>

        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center print:hidden">
          <h3 className="font-headline font-bold text-lg text-primary">Movimentações do Período</h3>
          <span className="text-xs text-on-surface-variant">{filteredTransactions.length} registros encontrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 print:bg-transparent print:border-b print:border-outline-variant/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Data</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recibo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Entidade</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 print:divide-outline-variant/20">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma movimentação encontrada neste período.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const customer = t.customerId ? customers.find(c => c.id === t.customerId) : null;
                  const supplier = t.supplierId ? suppliers.find(s => s.id === t.supplierId) : null;
                  const entityName = customer ? customer.name : (supplier ? supplier.name : '-');
                  
                  return (
                    <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors print:hover:bg-transparent">
                      <td className="px-6 py-4 text-sm font-medium text-on-surface-variant whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                        {t.receiptNumber ? String(t.receiptNumber).padStart(3, '0') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        {t.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {t.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {entityName}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'receita' ? 'text-secondary' : 'text-error'}`}>
                        {t.type === 'receita' ? '+' : '-'}{formatCurrency(t.value)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="hidden print:table-footer-group">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right font-bold text-on-surface-variant uppercase tracking-wider border-t border-outline-variant/20">
                    Total Entradas:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-secondary border-t border-outline-variant/20">
                    {formatCurrency(totalReceitas)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right font-bold text-on-surface-variant uppercase tracking-wider">
                    Total Saídas:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-error">
                    {formatCurrency(totalDespesas)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right font-black text-primary uppercase tracking-wider border-t border-outline-variant/20">
                    Saldo Final do Período:
                  </td>
                  <td className={`px-6 py-4 text-right font-black text-lg border-t border-outline-variant/20 ${saldo >= 0 ? 'text-primary' : 'text-error'}`}>
                    {formatCurrency(saldo)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
};

export default Statement;
