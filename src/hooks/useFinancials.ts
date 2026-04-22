import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types';

export interface AccountBalance {
  conta: string;
  descricao: string;
  categoria: string;
  debito: number;
  credito: number;
  saldoDevedor?: number;
  saldoCredor?: number;
  movimentos: any[];
}

export function useFinancials(startDate: string, endDate: string) {
  const { transactions, companyInfo, customers, suppliers } = useAppContext();
  const { t } = useTranslation();
  const ivaRate = companyInfo?.ivaRate !== undefined ? companyInfo.ivaRate : 0;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const { balanceteData, dreDetails, totalRevenue, totalExpense, balance } = useMemo(() => {
    // 1. Calculate Balancete
    const accountsMap: Record<string, AccountBalance> = {
      '111': { conta: '111', descricao: t('statement.accounts.111.desc', 'Caixa (Numerário)'), categoria: t('statement.accounts.111.cat', '11 Caixa'), debito: 0, credito: 0, movimentos: [] },
      '121': { conta: '121', descricao: t('statement.accounts.121.desc', 'Bancos (Transferência)'), categoria: t('statement.accounts.121.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '122': { conta: '122', descricao: t('statement.accounts.122.desc', 'M-Pesa'), categoria: t('statement.accounts.122.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '123': { conta: '123', descricao: t('statement.accounts.123.desc', 'E-mola'), categoria: t('statement.accounts.123.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '124': { conta: '124', descricao: t('statement.accounts.124.desc', 'Cartão/Cheque'), categoria: t('statement.accounts.124.cat', '12 Bancos'), debito: 0, credito: 0, movimentos: [] },
      '211': { conta: '211', descricao: t('statement.accounts.211.desc', 'Compras de Mercadorias'), categoria: t('statement.accounts.211.cat', '21 Compras'), debito: 0, credito: 0, movimentos: [] },
      '381': { conta: '381', descricao: t('statement.accounts.381.desc', 'Amortizações acumuladas'), categoria: t('statement.accounts.381.cat', '38 Amortizações acumuladas'), debito: 0, credito: 0, movimentos: [] },
      '411': { conta: '411', descricao: t('statement.accounts.411.desc', 'Clientes c/c (Diversos)'), categoria: t('statement.accounts.411.cat', '41 Clientes'), debito: 0, credito: 0, movimentos: [] },
      '421': { conta: '421', descricao: t('statement.accounts.421.desc', 'Fornecedores c/c (Diversos)'), categoria: t('statement.accounts.421.cat', '42 Fornecedores'), debito: 0, credito: 0, movimentos: [] },
      '441': { conta: '441', descricao: t('statement.accounts.441.desc', 'Imposto sobre rendimento'), categoria: t('statement.accounts.441.cat', '44 Estado'), debito: 0, credito: 0, movimentos: [] },
      '442': { conta: '442', descricao: t('statement.accounts.442.desc', 'IRPS'), categoria: t('statement.accounts.442.cat', '44 Estado'), debito: 0, credito: 0, movimentos: [] },
      '4491': { conta: '4491', descricao: t('statement.accounts.4491.desc', 'INSS'), categoria: t('statement.accounts.4491.cat', '44 Estado'), debito: 0, credito: 0, movimentos: [] },
      '4621': { conta: '4621', descricao: t('statement.accounts.4621.desc', 'Sócios - Remunerações a pagar'), categoria: t('statement.accounts.4621.cat', '46 Outros credores'), debito: 0, credito: 0, movimentos: [] },
      '4622': { conta: '4622', descricao: t('statement.accounts.4622.desc', 'Pessoal - Remunerações a pagar'), categoria: t('statement.accounts.4622.cat', '46 Outros credores'), debito: 0, credito: 0, movimentos: [] },
      '511': { conta: '511', descricao: t('statement.accounts.511.desc', 'Capital social'), categoria: t('statement.accounts.511.cat', '51 Capital'), debito: 0, credito: 0, movimentos: [] },
      '621': { conta: '621', descricao: t('statement.accounts.621.desc', 'Remunerações órgãos sociais'), categoria: t('statement.accounts.621.cat', '62 Gastos com pessoal'), debito: 0, credito: 0, movimentos: [] },
      '622': { conta: '622', descricao: t('statement.accounts.622.desc', 'Remunerações do pessoal'), categoria: t('statement.accounts.622.cat', '62 Gastos com pessoal'), debito: 0, credito: 0, movimentos: [] },
      '623': { conta: '623', descricao: t('statement.accounts.623.desc', 'Encargos sobre remunerações'), categoria: t('statement.accounts.623.cat', '62 Gastos com pessoal'), debito: 0, credito: 0, movimentos: [] },
      '631': { conta: '631', descricao: t('statement.accounts.631.desc', 'Subcontratos/Serviços'), categoria: t('statement.accounts.631.cat', '63 Fornecimento e serviços'), debito: 0, credito: 0, movimentos: [] },
      '681': { conta: '681', descricao: t('statement.accounts.681.desc', 'Impostos e taxas'), categoria: t('statement.accounts.681.cat', '68 Outros gastos'), debito: 0, credito: 0, movimentos: [] },
      '711': { conta: '711', descricao: t('statement.accounts.711.desc', 'Vendas de mercadorias'), categoria: t('statement.accounts.711.cat', '71 Vendas'), debito: 0, credito: 0, movimentos: [] },
      '721': { conta: '721', descricao: t('statement.accounts.721.desc', 'Prestação de serviços'), categoria: t('statement.accounts.721.cat', '72 Prestação de serviços'), debito: 0, credito: 0, movimentos: [] },
    };

    customers.forEach((c, index) => {
      const conta = `411.${index + 1}`;
      accountsMap[conta] = { conta, descricao: c.name, categoria: t('statement.accounts.411.cat', '41 Clientes'), debito: 0, credito: 0, movimentos: [] };
    });

    suppliers.forEach((s, index) => {
      const conta = `421.${index + 1}`;
      accountsMap[conta] = { conta, descricao: s.name, categoria: t('statement.accounts.421.cat', '42 Fornecedores'), debito: 0, credito: 0, movimentos: [] };
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
        accountsMap[creditAccount].movimentos.push({ ...t, tipoMovimento: 'credito' });

        if (t.customerId) {
          const customerIndex = customers.findIndex(c => c.id === t.customerId);
          const customerAccount = customerIndex >= 0 ? `411.${customerIndex + 1}` : '411';
          accountsMap[customerAccount].debito += t.value;
          accountsMap[customerAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });

          if (t.paymentStatus === 'pago') {
            accountsMap[customerAccount].credito += t.value;
            accountsMap[customerAccount].movimentos.push({ ...t, tipoMovimento: 'credito' });
            accountsMap[caixaOrBanco].debito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'debito' });
          }
        } else {
          if (t.paymentStatus === 'pago') {
            accountsMap[caixaOrBanco].debito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'debito' });
          } else {
            accountsMap['411'].debito += t.value;
            accountsMap['411'].movimentos.push({ ...t, tipoMovimento: 'debito' });
          }
        }
      } else {
        let debitAccount = '681';
        
        if (t.category === 'Salário Sócio') {
          debitAccount = '621';
          accountsMap[debitAccount].debito += t.value;
          accountsMap[debitAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });
          
          if (t.paymentStatus === 'pago') {
            accountsMap[caixaOrBanco].credito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          } else {
            accountsMap['4621'].credito += t.value;
            accountsMap['4621'].movimentos.push({ ...t, tipoMovimento: 'credito' });
          }
          return;
        } else if (t.category === 'Salário Colaborador') {
          debitAccount = '623';
          accountsMap[debitAccount].debito += t.value;
          accountsMap[debitAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });
          
          if (t.paymentStatus === 'pago') {
            accountsMap[caixaOrBanco].credito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          } else {
            accountsMap['4622'].credito += t.value;
            accountsMap['4622'].movimentos.push({ ...t, tipoMovimento: 'credito' });
          }
          return;
        } else if (t.category === 'INSS Empresa' || t.category === 'INSS Retido') {
          debitAccount = t.category === 'INSS Empresa' ? '623' : (t.description?.includes('Sócio') ? '4621' : '4622');
          accountsMap[debitAccount].debito += t.value;
          accountsMap[debitAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });
          
          if (t.paymentStatus === 'pago' && t.category === 'INSS Empresa') {
            accountsMap[caixaOrBanco].credito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          } else {
            accountsMap['4491'].credito += t.value;
            accountsMap['4491'].movimentos.push({ ...t, tipoMovimento: 'credito' });
          }
          return;
        } else if (t.category === 'IRPS Retido') {
          debitAccount = t.description?.includes('Sócio') ? '4621' : '4622';
          accountsMap[debitAccount].debito += t.value;
          accountsMap[debitAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });
          accountsMap['442'].credito += t.value;
          accountsMap['442'].movimentos.push({ ...t, tipoMovimento: 'credito' });
          return;
        } else if (t.category === 'Pagamento Salário') {
          debitAccount = t.description?.includes('Sócio') ? '4621' : '4622';
          accountsMap[debitAccount].debito += t.value;
          accountsMap[debitAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });
          accountsMap[caixaOrBanco].credito += t.value;
          accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          return;
        }

        const isSalary = t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica';

        if (isSalary) debitAccount = '622';
        else if (isServicos && !(t.category === 'Impostos' || t.category === 'Estado')) debitAccount = '631';
        else if (t.category === 'Produto' || t.supplierId || (t.items && t.items.length > 0)) debitAccount = '211';
        else if (t.category === 'Impostos' || t.category === 'Estado') debitAccount = '441';
        else if (['Operacional', 'Infraestrutura', 'Marketing', 'SaaS', 'Água', 'Energia', 'Renda', 'Combustível'].includes(t.category)) debitAccount = '631';
        else debitAccount = '681';

        accountsMap[debitAccount].debito += t.value;
        accountsMap[debitAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });

        if (t.supplierId) {
          const supplierIndex = suppliers.findIndex(s => s.id === t.supplierId);
          const supplierAccount = supplierIndex >= 0 ? `421.${supplierIndex + 1}` : '421';
          accountsMap[supplierAccount].credito += t.value;
          accountsMap[supplierAccount].movimentos.push({ ...t, tipoMovimento: 'credito' });

          if (t.paymentStatus === 'pago') {
            accountsMap[supplierAccount].debito += t.value;
            accountsMap[supplierAccount].movimentos.push({ ...t, tipoMovimento: 'debito' });
            accountsMap[caixaOrBanco].credito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          }
        } else {
          if (t.paymentStatus === 'pago') {
            accountsMap[caixaOrBanco].credito += t.value;
            accountsMap[caixaOrBanco].movimentos.push({ ...t, tipoMovimento: 'credito' });
          } else {
            accountsMap['421'].credito += t.value;
            accountsMap['421'].movimentos.push({ ...t, tipoMovimento: 'credito' });
          }
        }
      }
    });

    const finalBalancete = Object.values(accountsMap)
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

    // 2. Calculate DRE perfectly matching Balancete values where applicable
    // We can extract directly from filteredTransactions to keep granularity
    const receitaBruta = filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + curr.value, 0);

    const baseTributavel = ivaRate > 0 ? receitaBruta / (1 + (ivaRate / 100)) : receitaBruta;
    const impostosSobreVendas = ivaRate > 0 ? baseTributavel * (ivaRate / 100) : 0;
    const receitaLiquida = receitaBruta - impostosSobreVendas;

    const cmv = filteredTransactions
      .filter(t => t.type === 'despesa' && (t.category === 'Produto' || t.category === 'Fornecedores' || t.category === 'CMV' || t.supplierId || (t.items && t.items.length > 0)))
      .reduce((acc, curr) => acc + curr.value, 0);

    const margemContribuicao = receitaLiquida - cmv;

    const folhaPagamento = filteredTransactions
      .filter(t => t.type === 'despesa' && (t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica' || t.category.includes('Salário') || t.category.includes('INSS')))
      .reduce((acc, curr) => acc + curr.value, 0);

    const marketingVendas = filteredTransactions
      .filter(t => t.type === 'despesa' && t.category === 'Marketing')
      .reduce((acc, curr) => acc + curr.value, 0);

    const impostosRegistados = filteredTransactions
      .filter(t => t.type === 'despesa' && (t.category === 'Impostos' || t.category === 'Estado'))
      .reduce((acc, curr) => acc + curr.value, 0);

    const despesasAdmin = filteredTransactions
      .filter(t => t.type === 'despesa' && 
        !(t.category === 'Impostos' || t.category === 'Estado') &&
        !(t.category === 'Produto' || t.category === 'Fornecedores' || t.category === 'CMV' || t.supplierId || (t.items && t.items.length > 0)) &&
        !(t.category === 'Pessoal' || t.category === 'Salário' || t.category === 'Assistência Médica' || t.category.includes('Salário') || t.category.includes('INSS')) &&
        !(t.category === 'Marketing')
      )
      .reduce((acc, curr) => acc + curr.value, 0);

    const ebitda = margemContribuicao - despesasAdmin - folhaPagamento - marketingVendas - impostosRegistados;
    const totalDespesas = cmv + despesasAdmin + folhaPagamento + marketingVendas + impostosRegistados + impostosSobreVendas;

    const dreData = {
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
      pontoEquilibrio: margemContribuicao > 0 ? (despesasAdmin + folhaPagamento + marketingVendas) / (margemContribuicao / receitaBruta) : 0,
      margemSeguranca: receitaBruta > 0 ? ((receitaBruta - (margemContribuicao > 0 ? (despesasAdmin + folhaPagamento + marketingVendas) / (margemContribuicao / receitaBruta) : 0)) / receitaBruta) * 100 : 0,
    };

    return { 
      balanceteData: finalBalancete, 
      dreDetails: dreData,
      totalRevenue: receitaBruta,
      totalExpense: totalDespesas,
      balance: ebitda
    };
  }, [filteredTransactions, companyInfo, customers, suppliers, t, ivaRate]);

  return {
    filteredTransactions,
    balanceteData,
    dreDetails,
    totalRevenue,
    totalExpense,
    balance
  };
}
