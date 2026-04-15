import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const FinancialReport = () => {
  const { t } = useTranslation();
  const { companyInfo, transactions, customers, suppliers } = useAppContext();
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM for monthly
  const ivaRate = companyInfo?.ivaRate !== undefined ? companyInfo.ivaRate : 3;

  const handlePrint = () => {
    window.print();
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const sDate = new Date(selectedDate);
      
      if (reportType === 'monthly') {
        return tDate.getMonth() === sDate.getMonth() && tDate.getFullYear() === sDate.getFullYear();
      } else if (reportType === 'annual') {
        return tDate.getFullYear() === parseInt(selectedDate);
      } else if (reportType === 'weekly') {
        // Simple week filter: same week of the year
        const getWeek = (d: Date) => {
          const date = new Date(d.getTime());
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
          const week1 = new Date(date.getFullYear(), 0, 4);
          return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        };
        return getWeek(tDate) === getWeek(sDate) && tDate.getFullYear() === sDate.getFullYear();
      }
      return true;
    });
  }, [transactions, reportType, selectedDate]);

  const { totalRevenue, totalExpense, balance, dreDetails } = useMemo(() => {
    const receitaBruta = filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + curr.value, 0);

    const baseTributavel = ivaRate > 0 ? receitaBruta / (1 + (ivaRate / 100)) : receitaBruta;
    const impostosSobreVendas = ivaRate > 0 ? baseTributavel * (ivaRate / 100) : 0;

    const impostosRegistados = filteredTransactions
      .filter(t => t.type === 'despesa' && (t.category === 'Impostos' || t.category === 'Estado'))
      .reduce((acc, curr) => acc + curr.value, 0);
      
    const cmv = filteredTransactions
      .filter(t => t.type === 'despesa' && (t.category === 'Produto' || t.category === 'Fornecedores' || t.category === 'CMV' || t.supplierId || (t.items && t.items.length > 0)))
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
        !(t.category === 'Produto' || t.category === 'Fornecedores' || t.category === 'CMV' || t.supplierId || (t.items && t.items.length > 0)) &&
        !(t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica') &&
        !(t.category === 'Marketing')
      )
      .reduce((acc, curr) => acc + curr.value, 0);

    const ebitda = margemContribuicao - despesasAdmin - folhaPagamento - marketingVendas - impostosRegistados;
    const totalDespesas = cmv + despesasAdmin + folhaPagamento + marketingVendas + impostosRegistados + impostosSobreVendas;

    return { 
      totalRevenue: receitaBruta, 
      totalExpense: totalDespesas, 
      balance: ebitda,
      dreDetails: {
        receitaBruta,
        impostosSobreVendas,
        receitaLiquida,
        cmv,
        margemContribuicao,
        despesasAdmin,
        folhaPagamento,
        marketingVendas,
        impostosRegistados
      }
    };
  }, [filteredTransactions, ivaRate]);

  const balanceteData = useMemo(() => {
    const accountsMap: Record<string, any> = {
      '111': { conta: '111', descricao: t('statement.accounts.111.desc', 'Caixa (Numerário)'), categoria: t('statement.accounts.111.cat', '11 Caixa'), debito: 0, credito: 0 },
      '121': { conta: '121', descricao: t('statement.accounts.121.desc', 'Bancos (Transferência Bancária)'), categoria: t('statement.accounts.121.cat', '12 Bancos'), debito: 0, credito: 0 },
      '122': { conta: '122', descricao: t('statement.accounts.122.desc', 'M-Pesa'), categoria: t('statement.accounts.122.cat', '12 Bancos'), debito: 0, credito: 0 },
      '123': { conta: '123', descricao: t('statement.accounts.123.desc', 'E-mola'), categoria: t('statement.accounts.123.cat', '12 Bancos'), debito: 0, credito: 0 },
      '124': { conta: '124', descricao: t('statement.accounts.124.desc', 'Cartão/Cheque'), categoria: t('statement.accounts.124.cat', '12 Bancos'), debito: 0, credito: 0 },
      '211': { conta: '211', descricao: t('statement.accounts.211.desc', 'Compras de Mercadorias'), categoria: t('statement.accounts.211.cat', '21 Compras'), debito: 0, credito: 0 },
      '261': { conta: '261', descricao: t('statement.accounts.261.desc', 'Matérias primas'), categoria: t('statement.accounts.261.cat', '26 Matérias primas, auxiliares e materiais'), debito: 0, credito: 0 },
      '321': { conta: '321', descricao: t('statement.accounts.321.desc', 'Edifícios e outras construções'), categoria: t('statement.accounts.321.cat', '32 Activos tangíveis'), debito: 0, credito: 0 },
      '381': { conta: '381', descricao: t('statement.accounts.381.desc', 'Amortizações acumuladas'), categoria: t('statement.accounts.381.cat', '38 Amortizações acumuladas'), debito: 0, credito: 0 },
      '411': { conta: '411', descricao: t('statement.accounts.411.desc', 'Clientes c/c (Diversos)'), categoria: t('statement.accounts.411.cat', '41 Clientes'), debito: 0, credito: 0 },
      '421': { conta: '421', descricao: t('statement.accounts.421.desc', 'Fornecedores c/c (Diversos)'), categoria: t('statement.accounts.421.cat', '42 Fornecedores'), debito: 0, credito: 0 },
      '441': { conta: '441', descricao: t('statement.accounts.441.desc', 'Imposto sobre o rendimento'), categoria: t('statement.accounts.441.cat', '44 Estado'), debito: 0, credito: 0 },
      '451': { conta: '451', descricao: t('statement.accounts.451.desc', 'Outros devedores'), categoria: t('statement.accounts.451.cat', '45 Outros devedores'), debito: 0, credito: 0 },
      '461': { conta: '461', descricao: t('statement.accounts.461.desc', 'Outros credores'), categoria: t('statement.accounts.461.cat', '46 Outros credores'), debito: 0, credito: 0 },
      '481': { conta: '481', descricao: t('statement.accounts.481.desc', 'Provisões para processos judiciais'), categoria: t('statement.accounts.481.cat', '48 Provisões'), debito: 0, credito: 0 },
      '491': { conta: '491', descricao: t('statement.accounts.491.desc', 'Acréscimos de rendimentos'), categoria: t('statement.accounts.491.cat', '49 Acréscimos e diferimentos'), debito: 0, credito: 0 },
      '511': { conta: '511', descricao: t('statement.accounts.511.desc', 'Capital social'), categoria: t('statement.accounts.511.cat', '51 Capital'), debito: 0, credito: 0 },
      '591': { conta: '591', descricao: t('statement.accounts.591.desc', 'Resultados transitados'), categoria: t('statement.accounts.591.cat', '59 Resultados transitados'), debito: 0, credito: 0 },
      '621': { conta: '621', descricao: t('statement.accounts.621.desc', 'Remunerações dos órgãos sociais'), categoria: t('statement.accounts.621.cat', '62 Gastos com o pessoal'), debito: 0, credito: 0 },
      '622': { conta: '622', descricao: t('statement.accounts.622.desc', 'Remunerações do pessoal'), categoria: t('statement.accounts.622.cat', '62 Gastos com o pessoal'), debito: 0, credito: 0 },
      '623': { conta: '623', descricao: t('statement.accounts.623.desc', 'Encargos sobre remunerações'), categoria: t('statement.accounts.623.cat', '62 Gastos com o pessoal'), debito: 0, credito: 0 },
      '631': { conta: '631', descricao: t('statement.accounts.631.desc', 'Subcontratos'), categoria: t('statement.accounts.631.cat', '63 Fornecimento e serviços de terceiros'), debito: 0, credito: 0 },
      '681': { conta: '681', descricao: t('statement.accounts.681.desc', 'Impostos e taxas'), categoria: t('statement.accounts.681.cat', '68 Outros gastos e perdas operacionais'), debito: 0, credito: 0 },
      '711': { conta: '711', descricao: t('statement.accounts.711.desc', 'Vendas de mercadorias'), categoria: t('statement.accounts.711.cat', '71 Vendas'), debito: 0, credito: 0 },
      '721': { conta: '721', descricao: t('statement.accounts.721.desc', 'Prestação de serviços'), categoria: t('statement.accounts.721.cat', '72 Prestação de serviços'), debito: 0, credito: 0 },
      '781': { conta: '781', descricao: t('statement.accounts.781.desc', 'Juros obtidos'), categoria: t('statement.accounts.781.cat', '78 Rendimentos e ganhos financeiros'), debito: 0, credito: 0 },
      '881': { conta: '881', descricao: t('statement.accounts.881.desc', 'Resultado líquido do peródo'), categoria: t('statement.accounts.881.cat', '88 Resultado líquido do peródo'), debito: 0, credito: 0 },
      '4491': { conta: '4491', descricao: t('statement.accounts.4491.desc', 'INSS'), categoria: t('statement.accounts.4491.cat', '44 Estado'), debito: 0, credito: 0 },
      '442': { conta: '442', descricao: t('statement.accounts.442.desc', 'IRPS'), categoria: t('statement.accounts.442.cat', '44 Estado'), debito: 0, credito: 0 },
      '4621': { conta: '4621', descricao: t('statement.accounts.4621.desc', 'Sócios - Remunerações a pagar'), categoria: t('statement.accounts.4621.cat', '46 Outros credores'), debito: 0, credito: 0 },
      '4622': { conta: '4622', descricao: t('statement.accounts.4622.desc', 'Pessoal - Remunerações a pagar'), categoria: t('statement.accounts.4622.cat', '46 Outros credores'), debito: 0, credito: 0 },
    };

    customers.forEach((c, index) => {
      const conta = `411.${index + 1}`;
      accountsMap[conta] = { conta, descricao: c.name, categoria: t('statement.accounts.411.cat', '41 Clientes'), debito: 0, credito: 0 };
    });

    suppliers.forEach((s, index) => {
      const conta = `421.${index + 1}`;
      accountsMap[conta] = { conta, descricao: s.name, categoria: t('statement.accounts.421.cat', '42 Fornecedores'), debito: 0, credito: 0 };
    });

    filteredTransactions.forEach(t => {
      const isServicos = companyInfo?.sector === 'servicos';
      const isComercio = companyInfo?.sector === 'comercio';
      const isMisto = companyInfo?.sector === 'misto';

      let caixaOrBanco = '111';
      if (['Transferência Bancária', 'Bank Transfer', 'Virement Bancaire', '银行转账'].includes(t.paymentMethod || '')) caixaOrBanco = '121';
      else if (t.paymentMethod === 'M-Pesa') caixaOrBanco = '122';
      else if (t.paymentMethod === 'E-mola') caixaOrBanco = '123';
      else if (['Cartão', 'Cheque', 'Card', 'Carte', '卡', 'Chèque', '支票'].includes(t.paymentMethod || '')) caixaOrBanco = '124';

      if (t.type === 'receita') {
        const hasProducts = t.productId || (t.items && t.items.length > 0);
        const creditAccount = (isComercio || (isMisto && hasProducts)) ? '711' : '721';
        accountsMap[creditAccount].credito += t.value;

        if (t.customerId) {
          const customerIndex = customers.findIndex(c => c.id === t.customerId);
          const customerAccount = customerIndex >= 0 ? `411.${customerIndex + 1}` : '411';
          accountsMap[customerAccount].debito += t.value;

          if (t.paymentStatus === 'pago') {
            accountsMap[customerAccount].credito += t.value;
            accountsMap[caixaOrBanco].debito += t.value;
          }
        } else {
          if (t.paymentStatus === 'pago') {
            accountsMap[caixaOrBanco].debito += t.value;
          } else {
            accountsMap['411'].debito += t.value;
          }
        }
      } else {
        let debitAccount = '681';
        
        if (t.category === 'Salário Sócio') {
          debitAccount = '621';
          accountsMap[debitAccount].debito += t.value;
          if (t.paymentStatus === 'pago') accountsMap[caixaOrBanco].credito += t.value;
          else accountsMap['4621'].credito += t.value;
          return;
        } else if (t.category === 'Salário Colaborador') {
          debitAccount = '623';
          accountsMap[debitAccount].debito += t.value;
          if (t.paymentStatus === 'pago') accountsMap[caixaOrBanco].credito += t.value;
          else accountsMap['4622'].credito += t.value;
          return;
        } else if (t.category === 'INSS Empresa') {
          debitAccount = '623';
          accountsMap[debitAccount].debito += t.value;
          if (t.paymentStatus === 'pago') accountsMap[caixaOrBanco].credito += t.value;
          else accountsMap['4491'].credito += t.value;
          return;
        } else if (t.category === 'INSS Retido') {
          debitAccount = t.description?.includes('Sócio') ? '4621' : '4622';
          accountsMap[debitAccount].debito += t.value;
          accountsMap['4491'].credito += t.value;
          return;
        } else if (t.category === 'IRPS Retido') {
          debitAccount = t.description?.includes('Sócio') ? '4621' : '4622';
          accountsMap[debitAccount].debito += t.value;
          accountsMap['442'].credito += t.value;
          return;
        } else if (t.category === 'Pagamento Salário') {
          debitAccount = t.description?.includes('Sócio') ? '4621' : '4622';
          accountsMap[debitAccount].debito += t.value;
          accountsMap[caixaOrBanco].credito += t.value;
          return;
        }

        const isSalary = t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica';

        if (isSalary) {
          debitAccount = '622';
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

        accountsMap[debitAccount].debito += t.value;

        if (t.supplierId) {
          const supplierIndex = suppliers.findIndex(s => s.id === t.supplierId);
          const supplierAccount = supplierIndex >= 0 ? `421.${supplierIndex + 1}` : '421';
          accountsMap[supplierAccount].credito += t.value;

          if (t.paymentStatus === 'pago') {
            accountsMap[supplierAccount].debito += t.value;
            accountsMap[caixaOrBanco].credito += t.value;
          }
        } else {
          if (t.paymentStatus === 'pago') {
            accountsMap[caixaOrBanco].credito += t.value;
          } else {
            accountsMap['421'].credito += t.value;
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

  const getSituationText = () => {
    if (balance > 0) {
      return `No período selecionado, a empresa operou com superávit, registrando um lucro líquido de ${balance.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}, indicando uma situação financeira saudável e sustentável.`;
    } else if (balance < 0) {
      return `No período selecionado, a empresa operou com déficit, registrando um prejuízo de ${Math.abs(balance).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}. Recomenda-se atenção redobrada à gestão de custos e estratégias de aumento de receitas.`;
    } else {
      return `No período selecionado, a empresa operou no ponto de equilíbrio, sem lucro ou prejuízo registrado.`;
    }
  };

  const formatPeriod = () => {
    if (reportType === 'monthly') {
      const [year, month] = selectedDate.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('pt-MZ', { month: 'long', year: 'numeric' }).toUpperCase();
    } else if (reportType === 'annual') {
      return selectedDate;
    } else {
      return `Semana de ${new Date(selectedDate).toLocaleDateString('pt-MZ')}`;
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Controls - Hidden when printing */}
      <div className="mb-8 print:hidden bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-outline-variant/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary font-headline tracking-tight">Relatório Financeiro</h1>
            <p className="text-sm text-on-surface-variant mt-1">Gere e baixe relatórios detalhados da sua empresa.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as any);
                if (e.target.value === 'annual') setSelectedDate(new Date().getFullYear().toString());
                else if (e.target.value === 'monthly') setSelectedDate(new Date().toISOString().slice(0, 7));
                else setSelectedDate(new Date().toISOString().slice(0, 10));
              }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="annual">Anual</option>
            </select>

            {reportType === 'annual' ? (
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            ) : reportType === 'monthly' ? (
              <input
                type="month"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-outline-variant/30 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            )}

            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined">download</span>
              Baixar / Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white text-black p-8 md:p-12 rounded-2xl shadow-sm border border-outline-variant/20 print:shadow-none print:border-none print:p-0"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            {companyInfo?.logoUrl ? (
              <img src={companyInfo.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-20 h-20 bg-slate-100 flex items-center justify-center rounded-lg border border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-400">business</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">{companyInfo?.name || 'Nome da Empresa'}</h1>
              <p className="text-sm text-slate-600 mt-1">{companyInfo?.location || 'Endereço não definido'}</p>
              <p className="text-sm text-slate-600">{companyInfo?.contact || 'Contacto não definido'}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase text-slate-800">Relatório Financeiro</h2>
            <p className="text-sm font-medium text-slate-600 mt-1">Período: {formatPeriod()}</p>
            <p className="text-sm text-slate-500 mt-1">Gerado em: {new Date().toLocaleDateString('pt-MZ')}</p>
          </div>
        </div>

        {/* Company Details */}
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-2 mb-4">1. Identificação da Empresa</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <span className="font-bold text-slate-700">NUIT:</span> {companyInfo?.nuit || 'N/A'}
            </div>
            <div>
              <span className="font-bold text-slate-700">NUEL:</span> {companyInfo?.nuel || 'N/A'}
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-700">Constituição:</span> {companyInfo?.constitution || 'N/A'}
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-700">Descrição das Atividades:</span>
              <p className="mt-1 text-slate-600 whitespace-pre-wrap">{companyInfo?.description || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-700">Participação dos Sócios:</span>
              <p className="mt-1 text-slate-600 whitespace-pre-wrap">{companyInfo?.partners || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-2 mb-4">2. Resumo Financeiro</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase">Total de Receitas</p>
              <p className="text-xl font-black text-green-700 mt-1">{totalRevenue.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase">Total de Despesas</p>
              <p className="text-xl font-black text-red-700 mt-1">{totalExpense.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</p>
            </div>
            <div className={`p-4 border rounded-lg ${balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs font-bold uppercase text-slate-600">Resultado Líquido</p>
              <p className={`text-xl font-black mt-1 ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {balance.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Accounts */}
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-2 mb-4">3. Descrição das Contas Movimentadas (Balancete)</h3>
          {balanceteData.length > 0 ? (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase">Conta</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase">Descrição</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase text-right">Débito</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase text-right">Crédito</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {balanceteData.map((acc, index) => {
                  const saldo = acc.debito - acc.credito;
                  return (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-3 px-4 font-medium text-slate-800">{acc.conta}</td>
                      <td className="py-3 px-4 text-slate-800">{acc.descricao}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{acc.debito > 0 ? acc.debito.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' }) : '-'}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{acc.credito > 0 ? acc.credito.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' }) : '-'}</td>
                      <td className={`py-3 px-4 text-right font-bold ${saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {Math.abs(saldo).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })} {saldo >= 0 ? '(D)' : '(C)'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500 italic">Nenhuma movimentação registrada neste período.</p>
          )}
        </div>

        {/* Conclusion / Status */}
        <div className="mb-12">
          <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-2 mb-4">4. Situação da Empresa</h3>
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-slate-800 leading-relaxed text-justify">
              {getSituationText()}
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-24 pt-8">
          <div className="text-center">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-sm uppercase">A Gerência / Administração</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-sm uppercase">Contabilidade / Finanças</p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default FinancialReport;
