import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getCategoryTranslationKey } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { motion } from 'motion/react';
import PrintHeader from '../components/PrintHeader';
import CurrencyConverter from '../components/CurrencyConverter';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { exportToCSV } from '../lib/exportUtils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Dashboard = () => {
  const { transactions, customers, suppliers, products, companyInfo, globalSearchTerm } = useAppContext();
  const [dateFilter, setDateFilter] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'todos'>('mes');
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  const filterByPreviousDate = (dateString: string) => {
    if (dateFilter === 'todos') return false;
    
    const now = new Date();
    
    if (dateFilter === 'hoje') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return dateString === yesterday.toISOString().split('T')[0];
    }
    if (dateFilter === 'semana') {
      const startOfPrevWeek = new Date(now);
      startOfPrevWeek.setDate(now.getDate() - now.getDay() - 7);
      const endOfPrevWeek = new Date(now);
      endOfPrevWeek.setDate(now.getDate() - now.getDay() - 1);
      const startStr = startOfPrevWeek.toISOString().split('T')[0];
      const endStr = endOfPrevWeek.toISOString().split('T')[0];
      return dateString >= startStr && dateString <= endStr;
    }
    if (dateFilter === 'mes') {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      return dateString >= startOfPrevMonth && dateString <= endOfPrevMonth;
    }
    if (dateFilter === 'ano') {
      const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
      const endOfPrevYear = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
      return dateString >= startOfPrevYear && dateString <= endOfPrevYear;
    }
    return false;
  };

  const filteredTransactions = transactions.filter(t => filterByDate(t.date));
  const previousTransactions = transactions.filter(t => filterByPreviousDate(t.date));

  const totalReceitas = filteredTransactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
  const totalDespesas = filteredTransactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);
  const saldoPrevisto = totalReceitas - totalDespesas;

  const prevReceitas = previousTransactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
  const prevDespesas = previousTransactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);

  const calculatePercentage = (current: number, previous: number) => {
    if (dateFilter === 'todos') return 0;
    
    const createdDate = companyInfo?.createdAt ? new Date(companyInfo.createdAt).toISOString().split('T')[0] : '1970-01-01';
    
    let currentPeriodStart = '';
    const now = new Date();
    if (dateFilter === 'hoje') currentPeriodStart = now.toISOString().split('T')[0];
    else if (dateFilter === 'semana') {
      const d = new Date(now);
      d.setDate(now.getDate() - now.getDay());
      currentPeriodStart = d.toISOString().split('T')[0];
    }
    else if (dateFilter === 'mes') currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    else if (dateFilter === 'ano') currentPeriodStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    
    if (createdDate >= currentPeriodStart) {
      return 0;
    }

    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const receitaPercent = calculatePercentage(totalReceitas, prevReceitas);
  const despesaPercent = calculatePercentage(totalDespesas, prevDespesas);

  // Financial Indicators
  const margemLucro = totalReceitas > 0 ? ((saldoPrevisto / totalReceitas) * 100).toFixed(1) : '0.0';
  const indiceDespesas = totalReceitas > 0 ? ((totalDespesas / totalReceitas) * 100).toFixed(1) : '0.0';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: t('common.currency', 'MZN'),
    }).format(value);
  };

  // Curva ABC
  const productSales = filteredTransactions
    .filter(t => t.type === 'receita' && t.items)
    .flatMap(t => t.items || [])
    .reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = { id: item.productId, name: item.name, total: 0, quantity: 0 };
      }
      acc[item.productId].total += item.subtotal;
      acc[item.productId].quantity += item.quantity;
      return acc;
    }, {} as Record<string, { id: string, name: string, total: number, quantity: number }>);

  const sortedProducts = Object.values(productSales).sort((a: any, b: any) => b.total - a.total) as Array<{ id: string, name: string, total: number, quantity: number }>;
  const totalSalesValue = sortedProducts.reduce((sum, p) => sum + p.total, 0);

  let cumulativeValue = 0;
  const abcAnalysis = sortedProducts.map(p => {
    cumulativeValue += p.total;
    const percentage = totalSalesValue > 0 ? (cumulativeValue / totalSalesValue) * 100 : 0;
    let classe = 'C';
    if (percentage <= 80) classe = 'A';
    else if (percentage <= 95) classe = 'B';
    return { ...p, percentage, classe };
  });

  const produtosClasseA = abcAnalysis.filter(p => p.classe === 'A');
  const idsComVenda = new Set(abcAnalysis.map(p => p.id));
  const produtosEncalhados = products.filter(p => !idsComVenda.has(p.id));

  // Metas de vendas (Sempre baseada no mês atual, independente do dateFilter)
  const metaVendas = companyInfo?.monthlySalesGoal || 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const totalReceitasMesAtual = transactions
    .filter(t => t.type === 'receita' && t.date >= startOfMonth && t.date <= endOfMonth)
    .reduce((sum, t) => sum + t.value, 0);
  const progressoMeta = metaVendas > 0 ? Math.min((totalReceitasMesAtual / metaVendas) * 100, 100) : 0;
  const metaData = [{ name: 'Meta', value: progressoMeta, fill: '#006c47' }];

  // Process data for the chart (Group by Date)
  const chartDataMap = filteredTransactions.reduce((acc, curr) => {
    const date = new Date(curr.date).toLocaleDateString(t('common.locale', 'pt-MZ'), { day: '2-digit', month: 'short' });
    if (!acc[date]) {
      acc[date] = { name: date, Receitas: 0, Despesas: 0 };
    }
    if (curr.type === 'receita') acc[date].Receitas += curr.value;
    if (curr.type === 'despesa') acc[date].Despesas += curr.value;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(chartDataMap).reverse(); // Reverse to show chronological order if sorted descending originally

  // Cash Flow Projection Data
  const futureTransactions = transactions.filter(t => t.type !== 'cotacao' && t.paymentStatus === 'pendente' && t.dueDate && t.dueDate >= new Date().toISOString().split('T')[0]);
  const cashFlowMap = futureTransactions.reduce((acc, curr) => {
    if (!curr.dueDate) return acc;
    const date = new Date(curr.dueDate).toLocaleDateString(t('common.locale', 'pt-MZ'), { day: '2-digit', month: 'short' });
    if (!acc[date]) {
      acc[date] = { name: date, Entrada: 0, Saida: 0 };
    }
    if (curr.type === 'receita') acc[date].Entrada += curr.value;
    if (curr.type === 'despesa') acc[date].Saida += curr.value;
    return acc;
  }, {} as Record<string, any>);
  
  const cashFlowData = Object.values(cashFlowMap).sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime());

  const filteredCustomers = customers.filter(c => {
    if (!globalSearchTerm) return true;
    const term = globalSearchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term) || c.document?.toLowerCase().includes(term);
  });

  const filteredSuppliers = suppliers.filter(s => {
    if (!globalSearchTerm) return true;
    const term = globalSearchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term) || s.document?.toLowerCase().includes(term);
  });

  const filteredProducts = products.filter(p => {
    if (!globalSearchTerm) return true;
    const term = globalSearchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
  });

  const lowStockProducts = filteredProducts.filter(p => p.stock <= p.minStock);

  const contasAReceber = filteredTransactions
    .filter(t => t.type === 'receita' && t.paymentStatus === 'pendente')
    .reduce((acc, curr) => acc + curr.value, 0);

  const contasAPagar = filteredTransactions
    .filter(t => t.type === 'despesa' && t.paymentStatus === 'pendente')
    .reduce((acc, curr) => acc + curr.value, 0);

  // Donut Chart Data
  const despesasPorCategoria = filteredTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, curr) => {
      const catName = t(`transactions.categories.${getCategoryTranslationKey(curr.category)}`, curr.category) as string;
      acc[catName] = (acc[catName] || 0) + curr.value;
      return acc;
    }, {} as Record<string, number>);
  const despesasData = Object.entries(despesasPorCategoria).map(([name, value]) => ({ name, value }));

  const receitasPorCategoria = filteredTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, curr) => {
      const catName = t(`transactions.categories.${getCategoryTranslationKey(curr.category)}`, curr.category) as string;
      acc[catName] = (acc[catName] || 0) + curr.value;
      return acc;
    }, {} as Record<string, number>);
  const receitasData = Object.entries(receitasPorCategoria).map(([name, value]) => ({ name, value }));

  const COLORS = ['#006c47', '#0061a4', '#7c5800', '#ba1a1a', '#605d62', '#006874'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize="14" 
        fontWeight="bold"
        style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.8)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const handleExportCSV = () => {
    const exportData = [
      { Metrica: t('dashboard.profitMargin'), Valor: `${margemLucro}%` },
      { Metrica: t('dashboard.expenseIndex'), Valor: `${indiceDespesas}%` },
      { Metrica: t('dashboard.currentBalance'), Valor: saldoPrevisto },
      { Metrica: t('dashboard.totalRevenue'), Valor: totalReceitas },
      { Metrica: t('dashboard.totalExpenses'), Valor: totalDespesas },
      { Metrica: 'Contas a Receber', Valor: contasAReceber },
      { Metrica: 'Contas a Pagar', Valor: contasAPagar },
      { Metrica: t('dashboard.customers'), Valor: filteredCustomers.length },
      { Metrica: t('dashboard.suppliers'), Valor: filteredSuppliers.length },
      { Metrica: t('dashboard.products'), Valor: filteredProducts.length },
      { Metrica: t('dashboard.lowStockAlert').replace('Atenção: ', '').replace('Warning: ', '').replace('警告：', '').replace('Attention : ', ''), Valor: lowStockProducts.length },
    ];
    exportToCSV(exportData, `Dashboard_${dateFilter}.csv`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(t('dashboard.title'), 14, 22);
    
    // Add period
    doc.setFontSize(11);
    doc.text(`${t('common.period')}: ${dateFilter === 'hoje' ? t('common.today') : dateFilter === 'semana' ? t('common.week') : dateFilter === 'mes' ? t('common.month') : dateFilter === 'ano' ? t('common.year') : t('common.all')}`, 14, 30);

    // Add table
    const tableData = [
      [t('dashboard.profitMargin'), `${margemLucro}%`],
      [t('dashboard.expenseIndex'), `${indiceDespesas}%`],
      [t('dashboard.currentBalance'), formatCurrency(saldoPrevisto)],
      [t('dashboard.totalRevenue'), formatCurrency(totalReceitas)],
      [t('dashboard.totalExpenses'), formatCurrency(totalDespesas)],
      ['Contas a Receber', formatCurrency(contasAReceber)],
      ['Contas a Pagar', formatCurrency(contasAPagar)],
      [t('dashboard.customers'), filteredCustomers.length.toString()],
      [t('dashboard.suppliers'), filteredSuppliers.length.toString()],
      [t('dashboard.products'), filteredProducts.length.toString()],
      [t('dashboard.lowStockAlert').replace('Atenção: ', '').replace('Warning: ', '').replace('警告：', '').replace('Attention : ', ''), lowStockProducts.length.toString()],
    ];

    (doc as any).autoTable({
      startY: 40,
      head: [['Métrica', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 108, 71] }, // Primary color
    });

    doc.save(`Dashboard_${dateFilter}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 lg:p-8 flex-1 space-y-8"
    >
      <PrintHeader />
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{t('dashboard.title')}</h2>
        <p className="text-sm text-slate-600 mt-2">{t('common.period')}: {dateFilter === 'hoje' ? t('common.today') : dateFilter === 'semana' ? t('common.week') : dateFilter === 'mes' ? t('common.month') : dateFilter === 'ano' ? t('common.year') : t('common.all')}</p>
      </div>

      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">{t('dashboard.title')}</h2>
          <p className="text-on-surface-variant font-medium mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
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

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <section 
          className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-error-container/90 transition-colors"
          onClick={() => window.location.href = '/produtos?filter=low_stock'}
        >
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl">warning</span>
            <div>
              <h4 className="font-bold">{t('dashboard.lowStockAlert')}</h4>
              <p className="text-sm">{t('dashboard.lowStockMessage', { count: lowStockProducts.length })}</p>
            </div>
          </div>
          <span className="material-symbols-outlined">chevron_right</span>
        </section>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm flex flex-col justify-between"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('dashboard.profitMargin')}</p>
            <h4 className="text-3xl font-headline font-extrabold mt-1 text-primary">
              {margemLucro}%
            </h4>
          </div>
          <div className="mt-2 text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">analytics</span>
            {t('dashboard.expenseIndex')}: {indiceDespesas}%
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden shadow-sm"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('dashboard.currentBalance')}</p>
            <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(saldoPrevisto)}</h4>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10">account_balance</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-secondary-container text-on-secondary-container rounded-xl p-6 border border-secondary/10 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('dashboard.totalRevenue')}</p>
          <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(totalReceitas)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">
              {receitaPercent > 0 ? 'trending_up' : receitaPercent < 0 ? 'trending_down' : 'trending_flat'}
            </span>
            {receitaPercent === 0 ? t('dashboard.noComparison') : `${receitaPercent > 0 ? '+' : ''}${receitaPercent.toFixed(1)}% ${t('dashboard.vsPrevious')}`}
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-error-container text-on-error-container rounded-xl p-6 border border-error/10 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('dashboard.totalExpenses')}</p>
          <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(totalDespesas)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">
              {despesaPercent > 0 ? 'trending_up' : despesaPercent < 0 ? 'trending_down' : 'trending_flat'}
            </span>
            {despesaPercent === 0 ? t('dashboard.noComparison') : `${despesaPercent > 0 ? '+' : ''}${despesaPercent.toFixed(1)}% ${t('dashboard.vsPrevious')}`}
          </div>
        </motion.div>
      </section>

      {/* Contas a Pagar / Receber */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors"
          onClick={() => navigate('/transacoes?filter=receber')}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Contas a Receber</p>
            <h4 className="text-2xl font-headline font-extrabold mt-1 text-secondary">{formatCurrency(contasAReceber)}</h4>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined">call_received</span>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors"
          onClick={() => navigate('/transacoes?filter=pagar')}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Contas a Pagar</p>
            <h4 className="text-2xl font-headline font-extrabold mt-1 text-error">{formatCurrency(contasAPagar)}</h4>
          </div>
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
            <span className="material-symbols-outlined">call_made</span>
          </div>
        </motion.div>
      </section>

      {/* Business Intelligence Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metas de Vendas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
           className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-bold font-headline text-primary mb-1">Meta de Vendas</h3>
            <p className="text-xs text-on-surface-variant font-medium">Mês Atual ({new Date().toLocaleDateString(t('common.locale', 'pt-MZ'), { month: 'long', year: 'numeric' })})</p>
          </div>
          
          {metaVendas > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="70%" 
                    outerRadius="100%" 
                    barSize={15} 
                    data={metaData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      background={{ fill: '#e1e3e4' }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <h4 className="text-2xl font-extrabold font-headline text-primary">{progressoMeta.toFixed(1)}%</h4>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Atingido</p>
              </div>
              <div className="w-full mt-4 flex justify-between text-xs font-bold text-on-surface-variant">
                <span>Total: {formatCurrency(totalReceitasMesAtual)}</span>
                <span>Meta: {formatCurrency(metaVendas)}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-surface-variant/20 rounded-lg mt-4 border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">flag</span>
              <p className="text-sm font-medium text-on-surface-variant">Meta mensal não definida.</p>
              <button 
                onClick={() => document.getElementById('company-settings-btn')?.click()}
                className="mt-3 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded font-bold hover:bg-primary/20 transition-colors"
                title="Vá para as Configurações da Empresa para definir uma meta"
              >
                Definir Meta
              </button>
            </div>
          )}
        </motion.div>

        {/* Curva ABC - Classe A */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.36 }}
          className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline text-primary">Estrelas de Venda</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-1">Curva ABC - Classe A (Curva dos 80%)</p>
            </div>
            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-extrabold flex items-center gap-1 border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">star</span>
              TOP
            </div>
          </div>
          
          {produtosClasseA.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[200px]">
              {produtosClasseA.slice(0, 5).map((produto, index) => (
                <div key={produto.id} className="flex justify-between items-center p-3 rounded-lg bg-surface-variant/20 border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-on-surface-variant opacity-50 w-4">{index + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface truncate max-w-[120px]" title={produto.name}>{produto.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{produto.quantity} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(produto.total)}</p>
                  </div>
                </div>
              ))}
              {produtosClasseA.length > 5 && (
                <p className="text-xs text-center text-on-surface-variant mt-2 italic">+ {produtosClasseA.length - 5} produtos na Classe A</p>
              )}
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-surface-variant/20 rounded-lg">
              <p className="text-sm font-medium text-on-surface-variant">Sem vendas no período.</p>
            </div>
          )}
        </motion.div>

        {/* Curva ABC - Encalhados */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4, delay: 0.37 }}
           className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline text-error">Produtos Parados</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-1">Zero vendas no período selecionado</p>
            </div>
            <div className="bg-error/10 text-error px-2 py-1 rounded text-xs font-extrabold flex items-center gap-1 border border-error/20">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              ALERTA
            </div>
          </div>

          {produtosEncalhados.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[200px]">
              {produtosEncalhados.slice(0, 5).map((produto) => (
                <div key={produto.id} className="flex justify-between items-center p-3 rounded-lg bg-error/5 border border-error/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-error/60 text-lg">inventory_2</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface truncate max-w-[120px]" title={produto.name}>{produto.name}</p>
                      <p className="text-[10px] text-error/80 font-medium">Estoque: {produto.stock}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-error uppercase px-2 py-0.5 bg-error/10 rounded">Enc.</p>
                  </div>
                </div>
              ))}
               {produtosEncalhados.length > 5 && (
                <p className="text-xs text-center text-error/80 mt-2 italic">+ {produtosEncalhados.length - 5} produtos parados</p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-surface-variant/20 rounded-lg">
              <span className="material-symbols-outlined text-3xl text-secondary mb-2">check_circle</span>
              <p className="text-sm font-medium text-on-surface-variant">Excelente! Todo o stock tem movimento.</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Charts and Secondary Metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo de Caixa (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10"
        >
          <h3 className="text-lg font-bold font-headline text-primary mb-6">{t('dashboard.cashFlow')}</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737780' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737780' }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f5' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="Receitas" name={t('dashboard.revenue')} fill="#006c47" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Despesas" name={t('dashboard.expenses')} fill="#ba1a1a" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Projeção de Fluxo de Caixa (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10"
        >
          <h3 className="text-lg font-bold font-headline text-primary mb-6">Projeção de Fluxo de Caixa</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737780' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737780' }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f5' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="Entrada" name="Entradas Previstas" fill="#006c47" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Saida" name="Saídas Previstas" fill="#ba1a1a" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Despesas por Categoria (Donut Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col"
        >
          <h3 className="text-lg font-bold font-headline text-primary mb-2">{t('dashboard.expensesByCategory')}</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={despesasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {despesasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receitas por Categoria (Donut Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col"
        >
          <h3 className="text-lg font-bold font-headline text-primary mb-2">{t('dashboard.revenueByCategory')}</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={receitasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {receitasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-6"
        >
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col justify-center items-center text-center">
            <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center text-on-primary-fixed mb-3">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <h4 className="text-3xl font-extrabold font-headline text-primary">{filteredCustomers.length}</h4>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">{t('dashboard.customers')}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col justify-center items-center text-center">
            <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container mb-3">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <h4 className="text-3xl font-extrabold font-headline text-primary">{filteredSuppliers.length}</h4>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">{t('dashboard.suppliers')}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col justify-center items-center text-center">
            <div className="w-14 h-14 bg-tertiary-container rounded-full flex items-center justify-center text-on-tertiary-container mb-3">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <h4 className="text-3xl font-extrabold font-headline text-primary">{filteredProducts.length}</h4>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">{t('dashboard.products')}</p>
          </div>
          <div 
            className={`bg-surface-container-lowest rounded-xl p-6 shadow-sm border ${lowStockProducts.length > 0 ? 'border-error/50 bg-error/5 cursor-pointer hover:bg-error/10 transition-colors' : 'border-outline-variant/10'} flex flex-col justify-center items-center text-center`}
            onClick={() => {
              if (lowStockProducts.length > 0) {
                navigate('/produtos?filter=low_stock');
              }
            }}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${lowStockProducts.length > 0 ? 'bg-error text-on-error' : 'bg-surface-variant text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h4 className={`text-3xl font-extrabold font-headline ${lowStockProducts.length > 0 ? 'text-error' : 'text-primary'}`}>{lowStockProducts.length}</h4>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">{t('dashboard.lowStockAlert').replace('Atenção: ', '').replace('Warning: ', '').replace('警告：', '').replace('Attention : ', '')}</p>
          </div>
        </motion.div>
      </section>

      <section className="mt-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CurrencyConverter />
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Dashboard;
