import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import PrintHeader from '../components/PrintHeader';

const DRE = () => {
  const { transactions, companyInfo } = useAppContext();

  const [dateFilter, setDateFilter] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'todos'>('mes');
  const [ivaRate, setIvaRate] = useState<number>(companyInfo?.ivaRate !== undefined ? companyInfo.ivaRate : 3); // Default to 3% or company setting

  // Update ivaRate if companyInfo changes
  React.useEffect(() => {
    if (companyInfo?.ivaRate !== undefined) {
      setIvaRate(companyInfo.ivaRate);
    }
  }, [companyInfo?.ivaRate]);

  const filterByDate = (dateString: string) => {
    if (dateFilter === 'todos') return true;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (dateFilter === 'hoje') {
      return dateString === todayStr;
    }
    if (dateFilter === 'semana') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startStr = startOfWeek.toISOString().split('T')[0];
      return dateString >= startStr && dateString <= todayStr;
    }
    if (dateFilter === 'mes') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return dateString >= startOfMonth && dateString <= endOfMonth;
    }
    if (dateFilter === 'ano') {
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      return dateString >= startOfYear && dateString <= endOfYear;
    }
    return true;
  };

  // Filter transactions by selected period
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => filterByDate(t.date));
  }, [transactions, dateFilter]);

  // Calculate values based on filtered transactions
  const receitaBruta = filteredTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, curr) => acc + curr.value, 0);

  // Calcula a Base Tributável e o IVA
  // Base Tributável = Valor Total da Fatura / (1 + (% IVA / 100))
  // IVA = Base Tributável * (% IVA / 100)
  const baseTributavel = ivaRate > 0 ? receitaBruta / (1 + (ivaRate / 100)) : receitaBruta;
  const impostosSobreVendas = ivaRate > 0 ? baseTributavel * (ivaRate / 100) : 0;

  const impostosRegistados = filteredTransactions
    .filter(t => t.type === 'despesa' && (t.category === 'Impostos' || t.category === 'Estado'))
    .reduce((acc, curr) => acc + curr.value, 0);
    
  const cmv = filteredTransactions
    .filter(t => t.type === 'despesa' && (t.category === 'Produto' || t.category === 'Fornecedores' || t.category === 'CMV' || t.supplierId))
    .reduce((acc, curr) => acc + curr.value, 0);
    
  const receitaLiquida = receitaBruta - impostosSobreVendas;
  const margemContribuicao = receitaLiquida - cmv;

  const folhaPagamento = filteredTransactions
    .filter(t => t.type === 'despesa' && (t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica'))
    .reduce((acc, curr) => acc + curr.value, 0);

  const marketingVendas = filteredTransactions
    .filter(t => t.type === 'despesa' && t.category === 'Marketing')
    .reduce((acc, curr) => acc + curr.value, 0);

  const despesasAdmin = filteredTransactions
    .filter(t => t.type === 'despesa' && 
      !(t.category === 'Impostos' || t.category === 'Estado') &&
      !(t.category === 'Produto' || t.category === 'Fornecedores' || t.category === 'CMV' || t.supplierId) &&
      !(t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica') &&
      !(t.category === 'Marketing')
    )
    .reduce((acc, curr) => acc + curr.value, 0);

  const ebitda = margemContribuicao - despesasAdmin - folhaPagamento - marketingVendas - impostosRegistados;

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
          <h3 className="font-headline text-3xl font-extrabold text-primary tracking-tight">Demonstração de Resultados (DRE)</h3>
          <p className="text-on-surface-variant mt-1 text-sm">Visão analítica de performance financeira por competência.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1 border border-outline-variant/20 print:hidden">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-2">Taxa IVA:</span>
            <select
              value={ivaRate}
              onChange={(e) => setIvaRate(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-primary border-none focus:ring-0 cursor-pointer"
            >
              <option value={0}>Isento (0%)</option>
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
                {filter === 'hoje' ? 'Hoje' :
                 filter === 'semana' ? 'Semana' :
                 filter === 'mes' ? 'Mês' :
                 filter === 'ano' ? 'Ano' : 'Todos'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-bold text-sm hover:opacity-90 transition-all print:hidden"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar PDF
          </button>
        </div>
      </section>

      <PrintHeader />
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-2">Demonstração de Resultados (DRE)</h2>
        <p className="text-sm text-slate-600">Período: {dateFilter.toUpperCase()}</p>
      </div>

      {/* DRE Structured Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(0,30,64,0.08)] overflow-hidden print:shadow-none">
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
                <span className="font-headline font-bold text-primary">Receita Bruta Total (Faturado) (+)</span>
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
              Base Tributável
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
              IVA ({ivaRate === 0 ? 'Isento' : `${ivaRate}%`}) (-)
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
                <span className="font-headline font-bold text-secondary uppercase text-xs tracking-wider">Receita Líquida (=)</span>
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
          <div className="grid grid-cols-12 p-5 items-center dre-table-row transition-colors">
            <div className="col-span-6 md:col-span-8 pl-11 text-on-surface-variant text-sm font-medium">
              Outros Impostos (Registados) (-)
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
                    Resultado Líquido (=)
                  </span>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-tighter">
                    {ebitda >= 0 ? 'Lucro do Exercício' : 'Prejuízo do Exercício'}
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
