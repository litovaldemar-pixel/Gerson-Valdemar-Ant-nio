import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getCategoryTranslationKey } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'motion/react';
import PrintHeader from '../components/PrintHeader';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { transactions, customers, suppliers, products, companyInfo, globalSearchTerm } = useAppContext();
  const [dateFilter, setDateFilter] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'todos'>('mes');
  const { t } = useTranslation();

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
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
          <button 
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            {t('dashboard.print')}
          </button>
        </div>
      </section>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <section className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <span className="material-symbols-outlined text-3xl">warning</span>
          <div>
            <h4 className="font-bold">{t('dashboard.lowStockAlert')}</h4>
            <p className="text-sm">{t('dashboard.lowStockMessage', { count: lowStockProducts.length })}</p>
          </div>
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

      {/* Charts and Secondary Metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10"
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
          className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6"
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
        </motion.div>
      </section>
    </motion.div>
  );
};

export default Dashboard;
