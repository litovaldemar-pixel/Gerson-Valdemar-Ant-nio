import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useFinancials } from '../hooks/useFinancials';

const FinancialReport = () => {
  const { t } = useTranslation();
  const { companyInfo } = useAppContext();
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM for monthly

  const handlePrint = () => {
    window.print();
  };

  const { startDate, endDate } = useMemo(() => {
    const sDate = new Date(selectedDate);
    if (reportType === 'monthly') {
      const start = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
      const end = new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0);
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    } else if (reportType === 'annual') {
      const year = parseInt(selectedDate);
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    } else {
      // weekly
      const day = sDate.getDay();
      const diff = sDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const start = new Date(sDate.setDate(diff));
      const end = new Date(sDate.setDate(start.getDate() + 6));
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    }
  }, [reportType, selectedDate]);

  const { totalRevenue, totalExpense, balance, balanceteData } = useFinancials(startDate, endDate);

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
