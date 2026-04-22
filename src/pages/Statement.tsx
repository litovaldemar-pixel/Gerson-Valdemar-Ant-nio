import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import PrintHeader from '../components/PrintHeader';
import { useTranslation } from 'react-i18next';
import { useFinancials } from '../hooks/useFinancials';

const Statement = () => {
  const { t } = useTranslation();
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });

  const { balanceteData } = useFinancials(startDate, endDate);

  const groupedBalancete = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    balanceteData.forEach(acc => {
      if (!groups[acc.categoria]) {
        groups[acc.categoria] = [];
      }
      groups[acc.categoria].push(acc);
    });
    return groups;
  }, [balanceteData]);

  const totalDebito = balanceteData.reduce((acc, curr) => acc + curr.debito, 0);
  const totalCredito = balanceteData.reduce((acc, curr) => acc + curr.credito, 0);
  const totalSaldoDevedor = balanceteData.reduce((acc, curr) => acc + (curr.saldoDevedor || 0), 0);
  const totalSaldoCredor = balanceteData.reduce((acc, curr) => acc + (curr.saldoCredor || 0), 0);

  const [showMovements, setShowMovements] = useState<Record<string, boolean>>({});

  const toggleMovements = (conta: string) => {
    setShowMovements(prev => ({
      ...prev,
      [conta]: !prev[conta]
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: t('common.currency', 'MZN'),
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
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">{t('sidebar.statement')}</h2>
          <p className="text-on-surface-variant font-medium mt-1">{t('statement.subtitle', 'Balancete analítico estruturado por contas (PGC-NIRF).')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
            {(['hoje', 'semana', 'mes', 'ano', 'todos'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setQuickFilter(filter)}
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors text-on-surface-variant hover:bg-surface-variant/50`}
              >
                {t(`dashboard.filters.${filter}`)}
              </button>
            ))}
          </div>
          <button 
            onClick={handlePrint}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            {t('dashboard.print')}
          </button>
        </div>
      </section>

      {/* Filters - Hidden on print */}
      <section className="bg-surface-container-low rounded-xl p-6 print:hidden">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">{t('statement.startDate', 'Data Inicial')}</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">{t('statement.endDate', 'Data Final')}</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
            />
          </div>
        </div>
      </section>

      {/* Printable Content */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden print:shadow-none print:bg-transparent">
        <PrintHeader />
        <div className="hidden print:block text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{t('statement.printTitle', 'Balancete do Razão')}</h2>
          <p className="text-sm text-slate-600 mt-1">{t('statement.period', 'Período')}: {startDate ? new Date(startDate).toLocaleDateString(t('common.locale', 'pt-MZ')) : t('statement.start', 'Início')} {t('statement.to', 'a')} {endDate ? new Date(endDate).toLocaleDateString(t('common.locale', 'pt-MZ')) : t('statement.today', 'Hoje')}</p>
        </div>

        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center print:hidden">
          <h3 className="font-headline font-bold text-lg text-primary">{t('statement.accountsMoved', 'Contas Movimentadas')}</h3>
          <span className="text-xs text-on-surface-variant">{balanceteData.length} {t('statement.accountsWithBalance', 'contas com saldo')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 print:bg-transparent print:border-b print:border-outline-variant/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">{t('statement.account', 'Conta')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">{t('statement.description', 'Descrição')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">{t('statement.debitMov', 'Mov. Débito')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">{t('statement.creditMov', 'Mov. Crédito')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">{t('statement.debitBalance', 'Saldo Débito')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">{t('statement.creditBalance', 'Saldo Crédito')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 print:divide-outline-variant/20">
              {balanceteData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    {t('statement.noMovements', 'Nenhuma movimentação encontrada neste período.')}
                  </td>
                </tr>
              ) : (
                Object.entries(groupedBalancete).map(([categoria, accounts]) => {
                  const accs = accounts as AccountBalance[];
                  const catDebito = accs.reduce((sum, acc) => sum + acc.debito, 0);
                  const catCredito = accs.reduce((sum, acc) => sum + acc.credito, 0);
                  const catSaldoDevedor = accs.reduce((sum, acc) => sum + (acc.saldoDevedor || 0), 0);
                  const catSaldoCredor = accs.reduce((sum, acc) => sum + (acc.saldoCredor || 0), 0);
                  
                  return (
                    <React.Fragment key={categoria}>
                      <tr className="bg-surface-container-low border-b border-outline-variant/20">
                        <td colSpan={2} className="px-6 py-3 text-sm font-bold text-primary">
                          {categoria}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-right text-on-surface-variant"></td>
                        <td className="px-6 py-3 text-sm font-bold text-right text-on-surface-variant"></td>
                        <td className="px-6 py-3 text-sm font-bold text-right text-secondary"></td>
                        <td className="px-6 py-3 text-sm font-bold text-right text-error"></td>
                      </tr>
                      {accs.map(acc => (
                        <React.Fragment key={acc.conta}>
                          <tr 
                            onClick={() => toggleMovements(acc.conta)}
                            className="hover:bg-surface-container-low/30 transition-colors print:hover:bg-transparent bg-surface-container-lowest cursor-pointer group"
                          >
                            <td className="px-6 py-3 text-sm font-mono text-on-surface-variant flex items-center gap-2 pl-10">
                              <span className={`material-symbols-outlined text-sm transition-transform ${showMovements[acc.conta] ? 'rotate-180' : ''}`}>
                                expand_more
                              </span>
                              {acc.conta}
                            </td>
                            <td className="px-6 py-3 text-sm text-on-surface-variant">{acc.descricao}</td>
                            <td className="px-6 py-3 text-sm text-right text-on-surface-variant">{acc.debito > 0 ? formatCurrency(acc.debito) : '0,00'}</td>
                            <td className="px-6 py-3 text-sm text-right text-on-surface-variant">{acc.credito > 0 ? formatCurrency(acc.credito) : '0,00'}</td>
                            <td className="px-6 py-3 text-sm text-right text-secondary">{(acc.saldoDevedor || 0) > 0 ? formatCurrency(acc.saldoDevedor!) : '0,00'}</td>
                            <td className="px-6 py-3 text-sm text-right text-error">{(acc.saldoCredor || 0) > 0 ? formatCurrency(acc.saldoCredor!) : '0,00'}</td>
                          </tr>
                          {showMovements[acc.conta] && acc.movimentos.map((mov, idx) => (
                            <tr key={`${acc.conta}-mov-${idx}`} className="text-xs bg-surface-container-lowest/50 border-b border-outline-variant/5">
                              <td className="px-6 py-2 text-right text-on-surface-variant/70 font-mono">{new Date(mov.date).toLocaleDateString(t('common.locale', 'pt-MZ'))}</td>
                              <td className="px-6 py-2 pl-16 text-on-surface-variant/80">{mov.description}</td>
                              <td className="px-6 py-2 text-right text-on-surface-variant/80">{mov.tipoMovimento === 'debito' ? formatCurrency(mov.value) : '0,00'}</td>
                              <td className="px-6 py-2 text-right text-on-surface-variant/80">{mov.tipoMovimento === 'credito' ? formatCurrency(mov.value) : '0,00'}</td>
                              <td className="px-6 py-2"></td>
                              <td className="px-6 py-2"></td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-surface-container-lowest border-t border-outline-variant/10">
                        <td colSpan={2} className="px-6 py-2 text-sm font-bold text-right text-on-surface-variant">
                          {t('statement.netSum', 'Soma Líquida')}
                        </td>
                        <td className="px-6 py-2 text-sm font-bold text-right text-on-surface-variant">{catDebito > 0 ? formatCurrency(catDebito) : '0,00'}</td>
                        <td className="px-6 py-2 text-sm font-bold text-right text-on-surface-variant">{catCredito > 0 ? formatCurrency(catCredito) : '0,00'}</td>
                        <td className="px-6 py-2 text-sm font-bold text-right text-secondary">{catSaldoDevedor > 0 ? formatCurrency(catSaldoDevedor) : '0,00'}</td>
                        <td className="px-6 py-2 text-sm font-bold text-right text-error">{catSaldoCredor > 0 ? formatCurrency(catSaldoCredor) : '0,00'}</td>
                      </tr>
                      <tr className="bg-surface-container-lowest border-b-2 border-outline-variant/20">
                        <td colSpan={2} className="px-6 py-2 text-sm font-bold text-right text-on-surface-variant">
                          {t('statement.balancesSum', 'Soma Saldos')}
                        </td>
                        <td colSpan={2} className="px-6 py-2"></td>
                        <td className="px-6 py-2 text-sm font-bold text-right text-secondary">{catSaldoDevedor > 0 ? formatCurrency(catSaldoDevedor) : '0,00'}</td>
                        <td className="px-6 py-2 text-sm font-bold text-right text-error">{catSaldoCredor > 0 ? formatCurrency(catSaldoCredor) : '0,00'}</td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {balanceteData.length > 0 && (
              <tfoot className="bg-surface-container-low/50 print:bg-transparent">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-right font-black text-primary uppercase tracking-wider border-t-2 border-outline-variant/30">
                    {t('statement.netSum', 'Soma Líquida')}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-primary border-t-2 border-outline-variant/30">
                    {formatCurrency(totalDebito)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-primary border-t-2 border-outline-variant/30">
                    {formatCurrency(totalCredito)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-secondary border-t-2 border-outline-variant/30">
                    {formatCurrency(totalSaldoDevedor)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-error border-t-2 border-outline-variant/30">
                    {formatCurrency(totalSaldoCredor)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-right font-black text-primary uppercase tracking-wider border-b-2 border-outline-variant/30">
                    {t('statement.balancesSum', 'Soma Saldos')}
                  </td>
                  <td colSpan={2} className="px-6 py-4 border-b-2 border-outline-variant/30"></td>
                  <td className="px-6 py-4 text-right font-black text-secondary border-b-2 border-outline-variant/30">
                    {formatCurrency(totalSaldoDevedor)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-error border-b-2 border-outline-variant/30">
                    {formatCurrency(totalSaldoCredor)}
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
