import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PrintHeader from '../components/PrintHeader';
import { useTranslation } from 'react-i18next';
import { exportToCSV } from '../lib/exportUtils';
import { jsPDF } from 'jspdf';
import { useFinancials } from '../hooks/useFinancials';
import 'jspdf-autotable';

const DRE = () => {
  const { transactions, companyInfo } = useAppContext();
  const { t } = useTranslation();

  const [dateFilter, setDateFilter] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'todos'>('mes');
  const [ivaRate, setIvaRate] = useState<number>(companyInfo?.ivaRate !== undefined ? companyInfo.ivaRate : 3); // Default to 3% or company setting

  // Update ivaRate if companyInfo changes
  React.useEffect(() => {
    if (companyInfo?.ivaRate !== undefined) {
      setIvaRate(companyInfo.ivaRate);
    }
  }, [companyInfo?.ivaRate]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateFilter === 'hoje') {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (dateFilter === 'semana') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return { startDate: startOfWeek.toISOString().split('T')[0], endDate: todayStr };
    }
    if (dateFilter === 'mes') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return { startDate: startOfMonth, endDate: endOfMonth };
    }
    if (dateFilter === 'ano') {
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      return { startDate: startOfYear, endDate: endOfYear };
    }
    return { startDate: '', endDate: '' };
  }, [dateFilter]);

  const { dreDetails, filteredTransactions } = useFinancials(startDate, endDate);

  const {
    receitaBruta,
    baseTributavel,
    impostosSobreVendas,
    receitaLiquida,
    cmv,
    margemContribuicao,
    despesasAdmin,
    folhaPagamento,
    marketingVendas,
    impostosRegistados,
    ebitda,
    pontoEquilibrio,
    margemSeguranca,
  } = dreDetails;

  const alavancagemOperacional = ebitda > 0 ? margemContribuicao / ebitda : 0;

  // Apuramento de IVA
  const ivaLiquidado = filteredTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, curr) => acc + (curr.ivaAmount || 0), 0);

  const ivaDedutivel = filteredTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, curr) => acc + (curr.ivaAmount || 0), 0);

  const ivaPagar = ivaLiquidado - ivaDedutivel;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: t('common.currency', 'MZN'),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0.00%';
    return ((value / total) * 100).toFixed(2) + '%';
  };

  const handleExportCSV = () => {
    const exportData = [
      { Conta: t('dre.grossRevenue', 'Receita Bruta Total (Faturado) (+)'), Valor: receitaBruta, Percentual: '100.00%' },
      { Conta: t('dre.taxableBase', 'Base Tributável'), Valor: baseTributavel, Percentual: formatPercent(baseTributavel, receitaBruta) },
      { Conta: `${t('dre.iva', 'IVA')} (${ivaRate === 0 ? t('dre.exempt', 'Isento') : `${ivaRate}%`}) (-)`, Valor: -impostosSobreVendas, Percentual: formatPercent(impostosSobreVendas, receitaBruta) },
      { Conta: t('dre.netRevenue', 'Receita Líquida (=)'), Valor: receitaLiquida, Percentual: formatPercent(receitaLiquida, receitaBruta) },
      { Conta: t('dre.cogs', 'Custos de Mercadoria/Serviços (CMV) (-)'), Valor: -cmv, Percentual: formatPercent(cmv, receitaBruta) },
      { Conta: t('dre.contributionMargin', 'Margem de Contribuição (=)'), Valor: margemContribuicao, Percentual: formatPercent(margemContribuicao, receitaBruta) },
      { Conta: t('dre.adminExpenses', 'Despesas Administrativas (-)'), Valor: -despesasAdmin, Percentual: formatPercent(despesasAdmin, receitaBruta) },
      { Conta: t('dre.payroll', 'Folha de Pagamento & Encargos (-)'), Valor: -folhaPagamento, Percentual: formatPercent(folhaPagamento, receitaBruta) },
      { Conta: t('dre.marketing', 'Marketing & Vendas (-)'), Valor: -marketingVendas, Percentual: formatPercent(marketingVendas, receitaBruta) },
      { Conta: t('dre.otherTaxes', 'Outros Impostos (Registados) (-)'), Valor: -impostosRegistados, Percentual: formatPercent(impostosRegistados, receitaBruta) },
      { Conta: t('dre.netIncome', 'Resultado Líquido (=)'), Valor: ebitda, Percentual: formatPercent(ebitda, receitaBruta) },
    ];
    exportToCSV(exportData, `DRE_${dateFilter}.csv`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(t('sidebar.dre'), 14, 22);
    
    // Add period
    doc.setFontSize(11);
    doc.text(`${t('dre.period', 'Período')}: ${t(`dashboard.filters.${dateFilter}`).toUpperCase()}`, 14, 30);

    // Add table
    const tableData = [
      [t('dre.grossRevenue', 'Receita Bruta Total (Faturado) (+)'), formatCurrency(receitaBruta), '100.00%'],
      [t('dre.taxableBase', 'Base Tributável'), formatCurrency(baseTributavel), formatPercent(baseTributavel, receitaBruta)],
      [`${t('dre.iva', 'IVA')} (${ivaRate === 0 ? t('dre.exempt', 'Isento') : `${ivaRate}%`}) (-)`, `(${formatCurrency(impostosSobreVendas)})`, formatPercent(impostosSobreVendas, receitaBruta)],
      [t('dre.netRevenue', 'Receita Líquida (=)'), formatCurrency(receitaLiquida), formatPercent(receitaLiquida, receitaBruta)],
      [t('dre.cogs', 'Custos de Mercadoria/Serviços (CMV) (-)'), `(${formatCurrency(cmv)})`, formatPercent(cmv, receitaBruta)],
      [t('dre.contributionMargin', 'Margem de Contribuição (=)'), formatCurrency(margemContribuicao), formatPercent(margemContribuicao, receitaBruta)],
      [t('dre.adminExpenses', 'Despesas Administrativas (-)'), `(${formatCurrency(despesasAdmin)})`, formatPercent(despesasAdmin, receitaBruta)],
      [t('dre.payroll', 'Folha de Pagamento & Encargos (-)'), `(${formatCurrency(folhaPagamento)})`, formatPercent(folhaPagamento, receitaBruta)],
      [t('dre.marketing', 'Marketing & Vendas (-)'), `(${formatCurrency(marketingVendas)})`, formatPercent(marketingVendas, receitaBruta)],
      [t('dre.otherTaxes', 'Outros Impostos (Registados) (-)'), `(${formatCurrency(impostosRegistados)})`, formatPercent(impostosRegistados, receitaBruta)],
      [t('dre.netIncome', 'Resultado Líquido (=)'), formatCurrency(ebitda), formatPercent(ebitda, receitaBruta)],
    ];

    (doc as any).autoTable({
      startY: 40,
      head: [[t('dre.accountDescription', 'Descrição da Conta'), `${t('dre.value', 'Valor')} (${t('common.currency', 'MZN')})`, `% ${t('dre.grossRev', 'Rec. Bruta')}`]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 108, 71] }, // Primary color
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 30 },
      },
    });

    doc.save(`DRE_${dateFilter}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header Section with Period Selector */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h3 className="font-headline text-3xl font-extrabold text-primary tracking-tight">{t('sidebar.dre')}</h3>
          <p className="text-on-surface-variant mt-1 text-sm">{t('dre.subtitle', 'Visão analítica de performance financeira por competência.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1 border border-outline-variant/20 print:hidden">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-2">{t('dre.ivaRate', 'Taxa IVA:')}</span>
            <select
              value={ivaRate}
              onChange={(e) => setIvaRate(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-primary border-none focus:ring-0 cursor-pointer"
            >
              <option value={0}>{t('dre.exempt', 'Isento')} (0%)</option>
              <option value={3}>3%</option>
              <option value={5}>5%</option>
              <option value={16}>16%</option>
            </select>
          </div>
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/20 print:hidden">
            {(['hoje', 'semana', 'mes', 'ano', 'todos'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                  dateFilter === filter
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-variant/50'
                }`}
              >
                {t(`dashboard.filters.${filter}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 print:hidden">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-surface-container-highest text-on-surface px-4 py-2 rounded font-bold text-sm hover:bg-surface-variant transition-all"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-surface-container-highest text-on-surface px-4 py-2 rounded font-bold text-sm hover:bg-surface-variant transition-all"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              PDF
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-bold text-sm hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              {t('dashboard.print')}
            </button>
          </div>
        </div>
      </section>

      <PrintHeader />
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-2">{t('sidebar.dre')}</h2>
        <p className="text-sm text-slate-600">{t('dre.period', 'Período')}: {t(`dashboard.filters.${dateFilter}`).toUpperCase()}</p>
      </div>

      {/* DRE Structured Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(0,30,64,0.08)] overflow-hidden print:shadow-none">
        <div className="grid grid-cols-12 bg-primary text-on-primary p-4 text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="col-span-6 md:col-span-8">{t('dre.accountDescription', 'Descrição da Conta')}</div>
          <div className="col-span-3 md:col-span-2 text-right">{t('dre.value', 'Valor')} ({t('common.currency', 'MZN')})</div>
          <div className="col-span-3 md:col-span-2 text-right">% {t('dre.grossRev', 'Rec. Bruta')}</div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {/* Gross Revenue Section */}
          <div className="bg-secondary/5">
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-6 md:col-span-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-lg">trending_up</span>
                </div>
                <span className="font-headline font-bold text-primary">{t('dre.grossRevenue', 'Receita Bruta Total (Faturado) (+)')}</span>
              </div>
              <div className="col-span-3 md:col-span-2 text-right font-headline font-extrabold text-primary text-lg">
                {formatCurrency(receitaBruta)}
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold">100.00%</span>
              </div>
            </div>
          </div>

          {/* Base Tributável */}
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              {t('dre.taxableBase', 'Base Tributável')}
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-primary font-semibold">
              {formatCurrency(baseTributavel)}
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(baseTributavel, receitaBruta)}
            </div>
          </div>

          {/* Variable Costs */}
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              {t('dre.iva', 'IVA')} ({ivaRate === 0 ? t('dre.exempt', 'Isento') : `${ivaRate}%`}) (-)
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(impostosSobreVendas)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(impostosSobreVendas, receitaBruta)}
            </div>
          </div>

          {/* Net Revenue */}
          <div className="bg-surface-container-low/50">
            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 md:col-span-8 pl-4 border-l-4 border-secondary">
                <span className="font-headline font-bold text-secondary uppercase text-xs tracking-wider">{t('dre.netRevenue', 'Receita Líquida (=)')}</span>
              </div>
              <div className="col-span-3 md:col-span-2 text-right font-headline font-bold text-secondary">
                {formatCurrency(receitaLiquida)}
              </div>
              <div className="col-span-3 md:col-span-2 text-right text-xs font-bold text-secondary">
                {formatPercent(receitaLiquida, receitaBruta)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              {t('dre.cogs', 'Custos de Mercadoria/Serviços (CMV) (-)')}
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(cmv)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(cmv, receitaBruta)}
            </div>
          </div>

          {/* Contribution Margin */}
          <div className="bg-surface-container-low">
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-6 md:col-span-8 pl-4 border-l-4 border-primary">
                <span className="font-headline font-bold text-primary uppercase text-xs tracking-wider">{t('dre.contributionMargin', 'Margem de Contribuição (=)')}</span>
              </div>
              <div className="col-span-3 md:col-span-2 text-right font-headline font-bold text-primary">
                {formatCurrency(margemContribuicao)}
              </div>
              <div className="col-span-3 md:col-span-2 text-right text-xs font-bold text-primary">
                {formatPercent(margemContribuicao, receitaBruta)}
              </div>
            </div>
          </div>

          {/* Fixed Costs */}
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              {t('dre.adminExpenses', 'Despesas Administrativas (-)')}
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(despesasAdmin)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(despesasAdmin, receitaBruta)}
            </div>
          </div>
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              {t('dre.payroll', 'Folha de Pagamento & Encargos (-)')}
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(folhaPagamento)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(folhaPagamento, receitaBruta)}
            </div>
          </div>
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              {t('dre.marketing', 'Marketing & Vendas (-)')}
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(marketingVendas)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(marketingVendas, receitaBruta)}
            </div>
          </div>
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              {t('dre.otherTaxes', 'Outros Impostos (Registados) (-)')}
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(impostosRegistados)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(impostosRegistados, receitaBruta)}
            </div>
          </div>

          {/* Net Income */}
          <div className="bg-primary/5">
            <div className="grid grid-cols-12 p-6 items-center border-t-2 border-primary/20">
              <div className="col-span-6 md:col-span-8 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg ${ebitda >= 0 ? 'bg-primary shadow-primary/20' : 'bg-error shadow-error/20'}`}>
                  <span className="material-symbols-outlined">{ebitda >= 0 ? 'account_balance' : 'trending_down'}</span>
                </div>
                <div>
                  <span className={`font-headline font-black text-xl tracking-tight ${ebitda >= 0 ? 'text-primary' : 'text-error'}`}>
                    {t('dre.netIncome', 'Resultado Líquido (=)')}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-tighter">
                    {ebitda >= 0 ? t('dre.profit', 'Lucro do Exercício') : t('dre.loss', 'Prejuízo do Exercício')}
                  </p>
                </div>
              </div>
              <div className={`col-span-3 md:col-span-2 text-right font-headline font-black text-2xl tracking-tighter ${ebitda >= 0 ? 'text-primary' : 'text-error'}`}>
                {formatCurrency(ebitda)}
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className={`${ebitda >= 0 ? 'bg-primary text-on-primary' : 'bg-error text-white'} px-4 py-1.5 rounded-full text-xs font-bold shadow-md`}>
                  {formatPercent(ebitda, receitaBruta)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Summary Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline-variant/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('dre.breakeven', 'Ponto de Equilíbrio')}</p>
            <p className="font-headline font-bold text-lg text-primary">{formatCurrency(pontoEquilibrio)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">speed</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('dre.marginOfSafety', 'Margem de Segurança')}</p>
            <p className="font-headline font-bold text-lg text-primary">{margemSeguranca.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container/30 flex items-center justify-center text-error">
            <span className="material-symbols-outlined">info</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('dre.operatingLeverage', 'Alavancagem Op.')}</p>
            <p className="font-headline font-bold text-lg text-primary">{alavancagemOperacional.toFixed(2)}x</p>
          </div>
        </div>
      </div>
      
      {/* Apuramento de IVA */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="bg-surface-container-lowest p-6 border-b border-outline-variant/20">
          <h4 className="text-lg font-headline font-extrabold text-primary">Apuramento de IVA</h4>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">IVA Liquidado (Vendas)</p>
            <p className="font-headline font-bold text-2xl text-secondary mt-2">{formatCurrency(ivaLiquidado)}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">IVA Dedutível (Compras)</p>
            <p className="font-headline font-bold text-2xl text-error mt-2">{formatCurrency(ivaDedutivel)}</p>
          </div>
          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${ivaPagar > 0 ? 'bg-error-container/20 border-error/30' : 'bg-secondary-container/20 border-secondary/30'}`}>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{ivaPagar > 0 ? 'IVA a Pagar' : 'IVA a Recuperar'}</p>
            <p className={`font-headline font-bold text-2xl mt-2 ${ivaPagar > 0 ? 'text-error' : 'text-secondary'}`}>{formatCurrency(Math.abs(ivaPagar))}</p>
          </div>
        </div>
      </div>

      {/* System Footer */}
      <footer className="mt-12 p-8 border-t border-outline-variant/10 text-center print:hidden">
        <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-[0.3em]">{companyInfo?.name || 'Financial Architect'} © 2024 - Sistema de Alta Precisão</p>
      </footer>
    </div>
  );
};

export default DRE;
