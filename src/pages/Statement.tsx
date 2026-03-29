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
  const { transactions, companyInfo, customers, suppliers } = useAppContext();
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
      '111': { conta: '111', descricao: t('statement.accounts.111.desc', 'Caixa (Numerário)'), categoria: t('statement.accounts.111.cat', '11 Caixa'), debito: 0, credito: 0, movimentos: [] },
      '121': { conta: '121', descricao: t('statement.accounts.121.desc', 'Bancos (Transferência Bancária)'), categoria: t('statement.accounts.121.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '122': { conta: '122', descricao: t('statement.accounts.122.desc', 'M-Pesa'), categoria: t('statement.accounts.122.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '123': { conta: '123', descricao: t('statement.accounts.123.desc', 'E-mola'), categoria: t('statement.accounts.123.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '124': { conta: '124', descricao: t('statement.accounts.124.desc', 'Cartão/Cheque'), categoria: t('statement.accounts.124.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '211': { conta: '211', descricao: t('statement.accounts.211.desc', 'Compras de Mercadorias'), categoria: t('statement.accounts.211.cat', '21 Compras'), debito: 0, credito: 0, movimentos: [] },
      '261': { conta: '261', descricao: t('statement.accounts.261.desc', 'Matérias primas'), categoria: t('statement.accounts.261.cat', '26 Matérias primas, auxiliares e materiais'), debito: 0, credito: 0, movimentos: [] },
      '321': { conta: '321', descricao: t('statement.accounts.321.desc', 'Edifícios e outras construções'), categoria: t('statement.accounts.321.cat', '32 Activos tangíveis'), debito: 0, credito: 0, movimentos: [] },
      '381': { conta: '381', descricao: t('statement.accounts.381.desc', 'Amortizações acumuladas'), categoria: t('statement.accounts.381.cat', '38 Amortizações acumuladas'), debito: 0, credito: 0, movimentos: [] },
      '411': { conta: '411', descricao: t('statement.accounts.411.desc', 'Clientes c/c (Diversos)'), categoria: t('statement.accounts.411.cat', '41 Clientes'), debito: 0, credito: 0, movimentos: [] },
      '421': { conta: '421', descricao: t('statement.accounts.421.desc', 'Fornecedores c/c (Diversos)'), categoria: t('statement.accounts.421.cat', '42 Fornecedores'), debito: 0, credito: 0, movimentos: [] },
      '441': { conta: '441', descricao: t('statement.accounts.441.desc', 'Imposto sobre o rendimento'), categoria: t('statement.accounts.441.cat', '44 Estado'), debito: 0, credito: 0, movimentos: [] },
      '451': { conta: '451', descricao: t('statement.accounts.451.desc', 'Outros devedores'), categoria: t('statement.accounts.451.cat', '45 Outros devedores'), debito: 0, credito: 0, movimentos: [] },
      '461': { conta: '461', descricao: t('statement.accounts.461.desc', 'Outros credores'), categoria: t('statement.accounts.461.cat', '46 Outros credores'), debito: 0, credito: 0, movimentos: [] },
      '481': { conta: '481', descricao: t('statement.accounts.481.desc', 'Provisões para processos judiciais'), categoria: t('statement.accounts.481.cat', '48 Provisões'), debito: 0, credito: 0, movimentos: [] },
      '491': { conta: '491', descricao: t('statement.accounts.491.desc', 'Acréscimos de rendimentos'), categoria: t('statement.accounts.491.cat', '49 Acréscimos e diferimentos'), debito: 0, credito: 0, movimentos: [] },
      '511': { conta: '511', descricao: t('statement.accounts.511.desc', 'Capital social'), categoria: t('statement.accounts.511.cat', '51 Capital'), debito: 0, credito: 0, movimentos: [] },
      '591': { conta: '591', descricao: t('statement.accounts.591.desc', 'Resultados transitados'), categoria: t('statement.accounts.591.cat', '59 Resultados transitados'), debito: 0, credito: 0, movimentos: [] },
      '621': { conta: '621', descricao: t('statement.accounts.621.desc', 'Remunerações do pessoal'), categoria: t('statement.accounts.621.cat', '62 Gastos com o pessoal'), debito: 0, credito: 0, movimentos: [] },
      '631': { conta: '631', descricao: t('statement.accounts.631.desc', 'Subcontratos'), categoria: t('statement.accounts.631.cat', '63 Fornecimento e serviços de terceiros'), debito: 0, credito: 0, movimentos: [] },
      '681': { conta: '681', descricao: t('statement.accounts.681.desc', 'Impostos e taxas'), categoria: t('statement.accounts.681.cat', '68 Outros gastos e perdas operacionais'), debito: 0, credito: 0, movimentos: [] },
      '711': { conta: '711', descricao: t('statement.accounts.711.desc', 'Vendas de mercadorias'), categoria: t('statement.accounts.711.cat', '71 Vendas'), debito: 0, credito: 0, movimentos: [] },
      '721': { conta: '721', descricao: t('statement.accounts.721.desc', 'Prestação de serviços'), categoria: t('statement.accounts.721.cat', '72 Prestação de serviços'), debito: 0, credito: 0, movimentos: [] },
      '781': { conta: '781', descricao: t('statement.accounts.781.desc', 'Juros obtidos'), categoria: t('statement.accounts.781.cat', '78 Rendimentos e ganhos financeiros'), debito: 0, credito: 0, movimentos: [] },
      '881': { conta: '881', descricao: t('statement.accounts.881.desc', 'Resultado líquido do peródo'), categoria: t('statement.accounts.881.cat', '88 Resultado líquido do peródo'), debito: 0, credito: 0, movimentos: [] },
    };

    // Add dynamic accounts for customers
    customers.forEach((c, index) => {
      const conta = `411.${index + 1}`;
      accountsMap[conta] = {
        conta,
        descricao: c.name,
        categoria: t('statement.accounts.411.cat', '41 Clientes'),
        debito: 0,
        credito: 0,
        movimentos: []
      };
    });

    // Add dynamic accounts for suppliers
    suppliers.forEach((s, index) => {
      const conta = `421.${index + 1}`;
      accountsMap[conta] = {
        conta,
        descricao: s.name,
        categoria: t('statement.accounts.421.cat', '42 Fornecedores'),
        debito: 0,
        credito: 0,
        movimentos: []
      };
    });

    filteredTransactions.forEach(t => {
      const isServicos = companyInfo?.sector === 'servicos';
      const isComercio = companyInfo?.sector === 'comercio';
      const isMisto = companyInfo?.sector === 'misto';

      let caixaOrBanco = '111'; // Default to Caixa
      if (['Transferência Bancária', 'Bank Transfer', 'Virement Bancaire', '银行转账'].includes(t.paymentMethod || '')) caixaOrBanco = '121';
      else if (t.paymentMethod === 'M-Pesa') caixaOrBanco = '122';
      else if (t.paymentMethod === 'E-mola') caixaOrBanco = '123';
      else if (['Cartão', 'Cheque', 'Card', 'Carte', '卡', 'Chèque', '支票'].includes(t.paymentMethod || '')) caixaOrBanco = '124';

      if (t.type === 'receita') {
        // Credit Vendas/Serviços (71/72)
        const hasProducts = t.productId || (t.items && t.items.length > 0);
        const creditAccount = (isComercio || (isMisto && hasProducts)) ? '711' : '721';
        accountsMap[creditAccount].credito += t.value;
        accountsMap[creditAccount].movimentos.push({ ...t, tipoMovimento: 'credito' });

        if (t.customerId) {
          // Find customer account
          const customerIndex = customers.findIndex(c => c.id === t.customerId);
          const customerAccount = customerIndex >= 0 ? `411.${customerIndex + 1}` : '411';

          // Debit Clientes (41)
          accountsMap[customerAccount].debito += t.value;
          accountsMap[customerAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });

          if (t.paymentStatus === 'pago') {
            // Credit Clientes (41)
            accountsMap[customerAccount].credito += t.value;
            accountsMap[customerAccount].movimentos.push({ ...t, tipoMovimento: 'credito' });
            // Debit Caixa/Bancos (11/12)
            accountsMap[caixaOrBanco].debito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'debito' });
          }
        } else {
          if (t.paymentStatus === 'pago') {
            // Debit Caixa/Bancos (11/12)
            accountsMap[caixaOrBanco].debito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'debito' });
          } else {
            // If it's pending but no customer, we still need to debit something. Let's use 411 as generic.
            accountsMap['411'].debito += t.value;
            accountsMap['411'].movimentos.push({ ...t, tipoMovimento: 'debito' });
          }
        }
      } else {
        // Despesa
        let debitAccount = '681'; // Default
        const isSalary = t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica';

        if (isSalary) {
          debitAccount = '621';
        } else if (isServicos) {
          debitAccount = '631';
        } else {
          if (t.category === 'Produto' || t.supplierId || (t.items && t.items.length > 0)) {
            debitAccount = '211';
          } else if (t.category === 'Impostos' || t.category === 'Estado') {
            debitAccount = '441';
          } else if (['Operacional', 'Infraestrutura', 'Marketing', 'SaaS', 'Água', 'Energia', 'Renda', 'Combustível'].includes(t.category)) {
            debitAccount = '631';
          } else {
            debitAccount = '681';
          }
        }

        // Debit Expense Account
        accountsMap[debitAccount].debito += t.value;
        accountsMap[debitAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });

        if (t.supplierId) {
          // Find supplier account
          const supplierIndex = suppliers.findIndex(s => s.id === t.supplierId);
          const supplierAccount = supplierIndex >= 0 ? `421.${supplierIndex + 1}` : '421';

          // Credit Fornecedores (42)
          accountsMap[supplierAccount].credito += t.value;
          accountsMap[supplierAccount].movimentos.push({ ...t, tipoMovimento: 'credito' });

          if (t.paymentStatus === 'pago') {
            // Debit Fornecedores (42)
            accountsMap[supplierAccount].debito += t.value;
            accountsMap[supplierAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });
            // Credit Caixa/Bancos (11/12)
            accountsMap[caixaOrBanco].credito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          }
        } else {
          if (t.paymentStatus === 'pago') {
            // Credit Caixa/Bancos (11/12)
            accountsMap[caixaOrBanco].credito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          } else {
            // If it's pending but no supplier, we still need to credit something. Let's use 421 as generic.
            accountsMap['421'].credito += t.value;
            accountsMap['421'].movimentos.push({ ...t, tipoMovimento: 'credito' });
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
  }, [filteredTransactions, companyInfo, customers, suppliers, t]);

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
