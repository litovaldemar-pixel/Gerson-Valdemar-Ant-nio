import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

interface AccountBalance {
  conta: string;
  descricao: string;
  categoria: string;
  debito: number;
  credito: number;
  saldoDevedor?: number;
  saldoCredor?: number;
}

const Statement = () => {
  const { transactions, companyInfo } = useAppContext();
  
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
      });
  }, [transactions, startDate, endDate]);

  const balanceteData = useMemo(() => {
    const accountsMap: Record<string, AccountBalance> = {
      '11': { conta: '11', descricao: 'Caixa', categoria: 'Ativos', debito: 0, credito: 0 },
      '12': { conta: '12', descricao: 'Bancos', categoria: 'Ativos', debito: 0, credito: 0 },
      '21': { conta: '21', descricao: 'Compras', categoria: 'Ativos', debito: 0, credito: 0 },
      '22': { conta: '22', descricao: 'Mercadorias', categoria: 'Ativos', debito: 0, credito: 0 },
      '31': { conta: '31', descricao: 'Clientes', categoria: 'Clientes', debito: 0, credito: 0 },
      '42': { conta: '42', descricao: 'Fornecedores', categoria: 'Fornecedores', debito: 0, credito: 0 },
      '44': { conta: '44', descricao: 'Estado', categoria: 'Passivos', debito: 0, credito: 0 },
      '51': { conta: '51', descricao: 'Capital', categoria: 'Capital', debito: 0, credito: 0 },
      '61': { conta: '61', descricao: 'Custo das Mercadorias Vendidas', categoria: 'Despesas', debito: 0, credito: 0 },
      '62': { conta: '62', descricao: 'Fornecimentos e Serviços de Terceiros', categoria: 'Despesas', debito: 0, credito: 0 },
      '63': { conta: '63', descricao: 'Gastos com o Pessoal', categoria: 'Despesas', debito: 0, credito: 0 },
      '64': { conta: '64', descricao: 'Impostos e Taxas', categoria: 'Despesas', debito: 0, credito: 0 },
      '68': { conta: '68', descricao: 'Outros Gastos', categoria: 'Despesas', debito: 0, credito: 0 },
      '71': { conta: '71', descricao: 'Vendas', categoria: 'Receitas', debito: 0, credito: 0 },
      '72': { conta: '72', descricao: 'Prestações de Serviços', categoria: 'Receitas', debito: 0, credito: 0 },
      '78': { conta: '78', descricao: 'Outros Rendimentos', categoria: 'Receitas', debito: 0, credito: 0 },
    };

    filteredTransactions.forEach(t => {
      if (t.type === 'receita') {
        // Debit Caixa/Bancos (11/12)
        accountsMap['12'].debito += t.value;
        
        // Credit Vendas/Serviços (71/72)
        if (t.category === 'Serviços') {
          accountsMap['72'].credito += t.value;
        } else {
          accountsMap['71'].credito += t.value;
        }
      } else {
        // Credit Caixa/Bancos (11/12)
        accountsMap['12'].credito += t.value;
        
        // Debit specific expense account
        if (t.category === 'Produto' || t.supplierId) {
          accountsMap['21'].debito += t.value;
        } else if (t.category === 'Pessoal') {
          accountsMap['63'].debito += t.value;
        } else if (t.category === 'Impostos') {
          accountsMap['64'].debito += t.value;
        } else if (t.category === 'Estado') {
          accountsMap['44'].debito += t.value;
        } else if (t.category === 'Operacional' || t.category === 'Infraestrutura' || t.category === 'Marketing' || t.category === 'SaaS') {
          accountsMap['62'].debito += t.value;
        } else {
          accountsMap['68'].debito += t.value;
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
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">Balancete do Razão</h2>
          <p className="text-on-surface-variant font-medium mt-1">Balancete analítico estruturado por contas (PGC-NIRF).</p>
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

      {/* Printable Content */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden print:shadow-none print:bg-transparent">
        {/* Print Header */}
        <div className="hidden print:block text-center mb-8 border-b border-outline-variant/20 pb-6">
          <h1 className="text-2xl font-black uppercase tracking-wider mb-2">{companyInfo?.name || 'SUA EMPRESA'}</h1>
          <h2 className="text-xl font-bold text-slate-800">Balancete do Razão</h2>
          <p className="text-sm text-slate-600 mt-2">Período: {startDate ? new Date(startDate).toLocaleDateString('pt-MZ') : 'Início'} a {endDate ? new Date(endDate).toLocaleDateString('pt-MZ') : 'Hoje'}</p>
        </div>

        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center print:hidden">
          <h3 className="font-headline font-bold text-lg text-primary">Contas Movimentadas</h3>
          <span className="text-xs text-on-surface-variant">{balanceteData.length} contas com saldo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 print:bg-transparent print:border-b print:border-outline-variant/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20" rowSpan={2}>Conta</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20" rowSpan={2}>Descrição</th>
                <th className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center border-b border-outline-variant/20" colSpan={2}>Movimentos</th>
                <th className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center border-b border-outline-variant/20" colSpan={2}>Saldos</th>
              </tr>
              <tr className="bg-surface-container-low/30 print:bg-transparent print:border-b print:border-outline-variant/20">
                <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">Débito</th>
                <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">Crédito</th>
                <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">Devedor</th>
                <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right border-b border-outline-variant/20">Credor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 print:divide-outline-variant/20">
              {balanceteData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma movimentação encontrada neste período.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedBalancete).map(([categoria, accounts]) => {
                  const accs = accounts as AccountBalance[];
                  return (
                    <React.Fragment key={categoria}>
                      <tr className="bg-surface-container-low/20 print:bg-transparent">
                        <td colSpan={6} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-primary border-y border-outline-variant/10">
                          {categoria}
                        </td>
                      </tr>
                      {accs.map(acc => (
                        <tr key={acc.conta} className="hover:bg-surface-container-low/30 transition-colors print:hover:bg-transparent">
                          <td className="px-6 py-3 text-sm font-mono font-bold text-primary">{acc.conta}</td>
                          <td className="px-6 py-3 text-sm font-medium text-on-surface-variant">{acc.descricao}</td>
                          <td className="px-6 py-3 text-sm text-right text-on-surface-variant">{acc.debito > 0 ? formatCurrency(acc.debito) : '-'}</td>
                          <td className="px-6 py-3 text-sm text-right text-on-surface-variant">{acc.credito > 0 ? formatCurrency(acc.credito) : '-'}</td>
                          <td className="px-6 py-3 text-sm font-bold text-right text-secondary">{(acc.saldoDevedor || 0) > 0 ? formatCurrency(acc.saldoDevedor!) : '-'}</td>
                          <td className="px-6 py-3 text-sm font-bold text-right text-error">{(acc.saldoCredor || 0) > 0 ? formatCurrency(acc.saldoCredor!) : '-'}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {balanceteData.length > 0 && (
              <tfoot className="bg-surface-container-low/50 print:bg-transparent">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-right font-black text-primary uppercase tracking-wider border-t-2 border-outline-variant/30">
                    Totais:
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
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
};

export default Statement;
