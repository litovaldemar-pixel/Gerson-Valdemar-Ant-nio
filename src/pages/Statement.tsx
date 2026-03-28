import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PrintHeader from '../components/PrintHeader';
import { useTranslation } from 'react-i18next';

interface AccountBalance {
  conta: string;
  descricao: string;
  categoria: string;
  debito: number;
  credito: number;
  saldoDevedor?: number;
  saldoCredor?: number;
  movimentos: any[];
}

const Statement = () => {
  const { transactions, companyInfo } = useAppContext();
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

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      });
  }, [transactions, startDate, endDate]);

  const balanceteData = useMemo(() => {
    const accountsMap: Record<string, AccountBalance> = {
      '111': { conta: '111', descricao: 'Caixa Despesas', categoria: '11 Caixa', debito: 0, credito: 0, movimentos: [] },
      '121': { conta: '121', descricao: 'Depósitos à Ordem', categoria: '12 Bancos', debito: 0, credito: 0, movimentos: [] },
      '211': { conta: '211', descricao: 'Compras de Mercadorias', categoria: '21 Compras', debito: 0, credito: 0, movimentos: [] },
      '261': { conta: '261', descricao: 'Matérias primas', categoria: '26 Matérias primas, auxiliares e materiais', debito: 0, credito: 0, movimentos: [] },
      '321': { conta: '321', descricao: 'Edifícios e outras construções', categoria: '32 Activos tangíveis', debito: 0, credito: 0, movimentos: [] },
      '381': { conta: '381', descricao: 'Amortizações acumuladas', categoria: '38 Amortizações acumuladas', debito: 0, credito: 0, movimentos: [] },
      '411': { conta: '411', descricao: 'Clientes c/c', categoria: '41 Clientes', debito: 0, credito: 0, movimentos: [] },
      '421': { conta: '421', descricao: 'Fornecedores c/c', categoria: '42 Fornecedores', debito: 0, credito: 0, movimentos: [] },
      '441': { conta: '441', descricao: 'Imposto sobre o rendimento', categoria: '44 Estado', debito: 0, credito: 0, movimentos: [] },
      '451': { conta: '451', descricao: 'Outros devedores', categoria: '45 Outros devedores', debito: 0, credito: 0, movimentos: [] },
      '461': { conta: '461', descricao: 'Outros credores', categoria: '46 Outros credores', debito: 0, credito: 0, movimentos: [] },
      '481': { conta: '481', descricao: 'Provisões para processos judiciais', categoria: '48 Provisões', debito: 0, credito: 0, movimentos: [] },
      '491': { conta: '491', descricao: 'Acréscimos de rendimentos', categoria: '49 Acréscimos e diferimentos', debito: 0, credito: 0, movimentos: [] },
      '511': { conta: '511', descricao: 'Capital social', categoria: '51 Capital', debito: 0, credito: 0, movimentos: [] },
      '591': { conta: '591', descricao: 'Resultados transitados', categoria: '59 Resultados transitados', debito: 0, credito: 0, movimentos: [] },
      '621': { conta: '621', descricao: 'Remunerações do pessoal', categoria: '62 Gastos com o pessoal', debito: 0, credito: 0, movimentos: [] },
      '631': { conta: '631', descricao: 'Subcontratos', categoria: '63 Fornecimento e serviços de terceiros', debito: 0, credito: 0, movimentos: [] },
      '681': { conta: '681', descricao: 'Impostos e taxas', categoria: '68 Outros gastos e perdas operacionais', debito: 0, credito: 0, movimentos: [] },
      '711': { conta: '711', descricao: 'Vendas de mercadorias', categoria: '71 Vendas', debito: 0, credito: 0, movimentos: [] },
      '721': { conta: '721', descricao: 'Prestação de serviços', categoria: '72 Prestação de serviços', debito: 0, credito: 0, movimentos: [] },
      '781': { conta: '781', descricao: 'Juros obtidos', categoria: '78 Rendimentos e ganhos financeiros', debito: 0, credito: 0, movimentos: [] },
      '881': { conta: '881', descricao: 'Resultado líquido do peródo', categoria: '88 Resultado líquido do peródo', debito: 0, credito: 0, movimentos: [] },
    };

    filteredTransactions.forEach(t => {
      const isServicos = companyInfo?.sector === 'servicos';
      const isComercio = companyInfo?.sector === 'comercio';
      const isMisto = companyInfo?.sector === 'misto';

      if (t.type === 'receita') {
        // Debit Caixa/Bancos (11/12)
        accountsMap['121'].debito += t.value;
        accountsMap['121'].movimentos.push({ ...t, tipoMovimento: 'debito' });
        
        // Credit Vendas/Serviços (71/72)
        if (isComercio || (isMisto && t.productId)) {
          accountsMap['711'].credito += t.value;
          accountsMap['711'].movimentos.push({ ...t, tipoMovimento: 'credito' });
        } else {
          accountsMap['721'].credito += t.value;
          accountsMap['721'].movimentos.push({ ...t, tipoMovimento: 'credito' });
        }
      } else {
        // Credit Caixa/Bancos (11/12)
        accountsMap['121'].credito += t.value;
        accountsMap['121'].movimentos.push({ ...t, tipoMovimento: 'credito' });
        
        // Debit specific expense account
        const isSalary = t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica';

        if (isSalary) {
          accountsMap['621'].debito += t.value;
          accountsMap['621'].movimentos.push({ ...t, tipoMovimento: 'debito' });
        } else if (isServicos) {
          // Para empresas de serviços, todas as outras despesas vão para 63
          accountsMap['631'].debito += t.value;
          accountsMap['631'].movimentos.push({ ...t, tipoMovimento: 'debito' });
        } else {
          // Para empresas de comércio ou mistas
          if (t.category === 'Produto' || t.supplierId) {
            accountsMap['211'].debito += t.value;
            accountsMap['211'].movimentos.push({ ...t, tipoMovimento: 'debito' });
          } else if (t.category === 'Impostos' || t.category === 'Estado') {
            accountsMap['441'].debito += t.value;
            accountsMap['441'].movimentos.push({ ...t, tipoMovimento: 'debito' });
          } else if (t.category === 'Operacional' || t.category === 'Infraestrutura' || t.category === 'Marketing' || t.category === 'SaaS' || t.category === 'Água' || t.category === 'Energia' || t.category === 'Renda' || t.category === 'Combustível') {
            accountsMap['631'].debito += t.value;
            accountsMap['631'].movimentos.push({ ...t, tipoMovimento: 'debito' });
          } else {
            accountsMap['681'].debito += t.value;
            accountsMap['681'].movimentos.push({ ...t, tipoMovimento: 'debito' });
          }
        }
      }
    });

    return Object.values(accountsMap)
      .filter(acc => acc.debito > 0 || acc.credito > 0)
      .map(acc => {
        const saldo = acc.debito - acc.credito;
        return {
          ...acc,
          saldoDevedor: saldo > 0 ? saldo : 0,
          saldoCredor: saldo < 0 ? Math.abs(saldo) : 0,
        };
      })
      .sort((a, b) => a.conta.localeCompare(b.conta));
  }, [filteredTransactions]);

  const groupedBalancete = useMemo(() => {
    const groups: Record<string, AccountBalance[]> = {};
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
          <p className="text-sm text-slate-600 mt-1">{t('statement.period', 'Período')}: {startDate ? new Date(startDate).toLocaleDateString('pt-MZ') : t('statement.start', 'Início')} {t('statement.to', 'a')} {endDate ? new Date(endDate).toLocaleDateString('pt-MZ') : t('statement.today', 'Hoje')}</p>
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
                              <td className="px-6 py-2 text-right text-on-surface-variant/70 font-mono">{new Date(mov.date).toLocaleDateString('pt-MZ')}</td>
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
