import React from 'react';
import { useAppContext } from '../context/AppContext';

const DRE = () => {
  const { transactions, companyInfo } = useAppContext();

  // State for period selection
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter transactions by selected month
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const tMonth = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
      return tMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Calculate values based on filtered transactions
  const receitaBruta = filteredTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, curr) => acc + curr.value, 0);

  // Calculate taxes and CMV based on specific categories if they exist, otherwise use a default percentage for demonstration
  const impostos = filteredTransactions
    .filter(t => t.type === 'despesa' && t.category === 'Impostos')
    .reduce((acc, curr) => acc + curr.value, 0) || (receitaBruta * 0.0944);
    
  const cmv = filteredTransactions
    .filter(t => t.type === 'despesa' && (t.category === 'CMV' || t.category === 'Fornecedores'))
    .reduce((acc, curr) => acc + curr.value, 0) || (receitaBruta * 0.2667);
    
  const margemContribuicao = receitaBruta - impostos - cmv;

  const despesasAdmin = filteredTransactions
    .filter(t => t.type === 'despesa' && (t.category === 'Operacional' || t.category === 'Infraestrutura' || t.category === 'Serviços'))
    .reduce((acc, curr) => acc + curr.value, 0) || (receitaBruta * 0.1222);

  const folhaPagamento = filteredTransactions
    .filter(t => t.type === 'despesa' && t.category === 'Pessoal')
    .reduce((acc, curr) => acc + curr.value, 0) || (receitaBruta * 0.1889);

  const marketingVendas = filteredTransactions
    .filter(t => t.type === 'despesa' && t.category === 'Marketing')
    .reduce((acc, curr) => acc + curr.value, 0) || (receitaBruta * 0.0278);

  const ebitda = margemContribuicao - despesasAdmin - folhaPagamento - marketingVendas;

  // Calculate Breakeven Point (Ponto de Equilíbrio)
  // PE = Fixed Costs / Contribution Margin Ratio
  const fixedCosts = despesasAdmin + folhaPagamento + marketingVendas;
  const contributionMarginRatio = receitaBruta > 0 ? margemContribuicao / receitaBruta : 0;
  const pontoEquilibrio = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;

  // Calculate Margin of Safety (Margem de Segurança)
  // MS = (Actual Sales - Breakeven Sales) / Actual Sales
  const margemSeguranca = receitaBruta > 0 ? ((receitaBruta - pontoEquilibrio) / receitaBruta) * 100 : 0;

  // Calculate Operating Leverage (Alavancagem Operacional)
  // DOL = Contribution Margin / Operating Income (EBITDA in this simplified case)
  const alavancagemOperacional = ebitda > 0 ? margemContribuicao / ebitda : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0.00%';
    return ((value / total) * 100).toFixed(2) + '%';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header Section with Period Selector */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h3 className="font-headline text-3xl font-extrabold text-primary tracking-tight">DRE Mensal</h3>
          <p className="text-on-surface-variant mt-1 text-sm">Visão analítica de performance financeira por competência.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-lg print:bg-transparent print:p-0">
          <div className="flex flex-col px-3 print:px-0">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Período</label>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-semibold text-primary cursor-pointer"
              />
            </div>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant/50 mx-2 print:hidden"></div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-bold text-sm hover:opacity-90 transition-all print:hidden"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar PDF
          </button>
        </div>
      </section>

      {/* DRE Structured Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(0,30,64,0.08)] overflow-hidden">
        <div className="grid grid-cols-12 bg-primary text-on-primary p-4 text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="col-span-6 md:col-span-8">Descrição da Conta</div>
          <div className="col-span-3 md:col-span-2 text-right">Valor (MZN)</div>
          <div className="col-span-3 md:col-span-2 text-right">% Rec. Bruta</div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {/* Gross Revenue Section */}
          <div className="bg-secondary/5">
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-6 md:col-span-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-lg">trending_up</span>
                </div>
                <span className="font-headline font-bold text-primary">Receita Bruta Total (+)</span>
              </div>
              <div className="col-span-3 md:col-span-2 text-right font-headline font-extrabold text-primary text-lg">
                {formatCurrency(receitaBruta)}
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold">100.00%</span>
              </div>
            </div>
          </div>

          {/* Variable Costs */}
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              Impostos sobre Vendas (-)
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(impostos)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(impostos, receitaBruta)}
            </div>
          </div>
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              Custos de Mercadoria/Serviços (CMV) (-)
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
                <span className="font-headline font-bold text-primary uppercase text-xs tracking-wider">Margem de Contribuição (=)</span>
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
              Despesas Administrativas (-)
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
              Folha de Pagamento & Encargos (-)
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
              Marketing & Vendas (-)
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-sm text-tertiary-container font-semibold">
              ({formatCurrency(marketingVendas)})
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs text-on-surface-variant font-medium">
              {formatPercent(marketingVendas, receitaBruta)}
            </div>
          </div>

          {/* EBITDA */}
          <div className="bg-primary/5">
            <div className="grid grid-cols-12 p-6 items-center border-t-2 border-primary/20">
              <div className="col-span-6 md:col-span-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div>
                  <span className="font-headline font-black text-primary text-xl tracking-tight">EBITDA (=)</span>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-tighter">Resultado Operacional</p>
                </div>
              </div>
              <div className="col-span-3 md:col-span-2 text-right font-headline font-black text-primary text-2xl tracking-tighter">
                {formatCurrency(ebitda)}
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className="bg-primary text-on-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
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
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ponto de Equilíbrio</p>
            <p className="font-headline font-bold text-lg text-primary">{formatCurrency(pontoEquilibrio)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">speed</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Margem de Segurança</p>
            <p className="font-headline font-bold text-lg text-primary">{margemSeguranca.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container/30 flex items-center justify-center text-error">
            <span className="material-symbols-outlined">info</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Alavancagem Op.</p>
            <p className="font-headline font-bold text-lg text-primary">{alavancagemOperacional.toFixed(2)}x</p>
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
