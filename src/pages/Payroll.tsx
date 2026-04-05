import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { Transaction } from '../types';
import { toast } from 'sonner';
import { exportToCSV } from '../lib/exportUtils';

import PrintHeader from '../components/PrintHeader';

interface EmployeePayroll {
  id: string;
  name: string;
  isPartner: boolean;
  grossSalary: number;
  irpsRate: number;
  allowances: number; // Subsídios
  absentDays: number; // Número de dias em falta
  advances: number; // Adiantamentos (Vales)
}

export default function Payroll() {
  const { t } = useTranslation();
  const { addTransaction } = useAppContext();

  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states for adding new employee
  const [employeeName, setEmployeeName] = useState('');
  const [isPartner, setIsPartner] = useState(false);
  const [grossSalary, setGrossSalary] = useState<number | ''>('');
  const [irpsRate, setIrpsRate] = useState<number>(10);
  const [allowances, setAllowances] = useState<number | ''>('');
  const [absentDays, setAbsentDays] = useState<number | ''>('');
  const [advances, setAdvances] = useState<number | ''>('');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !grossSalary) return;

    const newEmployee: EmployeePayroll = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: employeeName,
      isPartner,
      grossSalary: Number(grossSalary),
      irpsRate: Number(irpsRate),
      allowances: Number(allowances) || 0,
      absentDays: Number(absentDays) || 0,
      advances: Number(advances) || 0
    };

    setEmployees([...employees, newEmployee]);
    setEmployeeName('');
    setIsPartner(false);
    setGrossSalary('');
    setIrpsRate(10);
    setAllowances('');
    setAbsentDays('');
    setAdvances('');
  };

  const removeEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const calculateEmployeePayroll = (emp: EmployeePayroll) => {
    const gross = emp.grossSalary;
    const allowances = emp.allowances || 0;
    
    // Calculate absence value based on days (assuming 30 days per month)
    const dailyRate = gross / 30;
    const absenceValue = dailyRate * (emp.absentDays || 0);
    
    const baseForInss = gross + allowances - absenceValue;
    
    const inssEmployee = baseForInss * 0.03;
    const inssEmployer = baseForInss * 0.04;
    const totalInss = inssEmployee + inssEmployer;
    
    const baseForIrps = baseForInss - inssEmployee;
    const irps = baseForIrps > 20000 ? baseForIrps * (emp.irpsRate / 100) : 0;
    
    const netSalary = baseForInss - inssEmployee - irps - emp.advances;
    
    return { 
      gross, 
      allowances,
      absenceValue,
      inssEmployee, 
      inssEmployer, 
      totalInss, 
      irps, 
      netSalary, 
      absentDays: emp.absentDays, 
      advances: emp.advances 
    };
  };

  const totals = employees.reduce((acc, emp) => {
    const calc = calculateEmployeePayroll(emp);
    return {
      gross: acc.gross + calc.gross,
      allowances: acc.allowances + calc.allowances,
      absenceValue: acc.absenceValue + calc.absenceValue,
      inssEmployee: acc.inssEmployee + calc.inssEmployee,
      inssEmployer: acc.inssEmployer + calc.inssEmployer,
      totalInss: acc.totalInss + calc.totalInss,
      irps: acc.irps + calc.irps,
      advances: acc.advances + calc.advances,
      netSalary: acc.netSalary + calc.netSalary
    };
  }, { gross: 0, allowances: 0, absenceValue: 0, inssEmployee: 0, inssEmployer: 0, totalInss: 0, irps: 0, advances: 0, netSalary: 0 });

  const handleProcessPayroll = () => {
    if (employees.length === 0) return;

    employees.forEach(emp => {
      const calc = calculateEmployeePayroll(emp);
      const roleStr = emp.isPartner ? 'Sócio' : 'Colaborador';

      // Calculate due date (10th of next month)
      const txDate = new Date(date);
      const nextMonth = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 10);
      const dueDateStr = nextMonth.toISOString().split('T')[0];

      // 1. Gross Salary Transaction
      const grossSalaryTx: Omit<Transaction, 'id'> = {
        type: 'despesa',
        description: `Processamento Salário Bruto - ${emp.name} (${roleStr})`,
        value: calc.gross + calc.allowances, // Total remuneration
        date: date,
        category: emp.isPartner ? 'Salário Sócio' : 'Salário Colaborador',
        paymentStatus: 'pendente',
      };

      // 2. INSS Employer (4%)
      const inssEmployerTx: Omit<Transaction, 'id'> = {
        type: 'despesa',
        description: `INSS Empresa (4%) - ${emp.name} (${roleStr})`,
        value: calc.inssEmployer,
        date: date,
        dueDate: dueDateStr,
        category: 'INSS Empresa',
        paymentStatus: 'pendente',
      };

      // 3. INSS Employee Retido (3%)
      const inssEmployeeTx: Omit<Transaction, 'id'> = {
        type: 'despesa',
        description: `INSS Retido (3%) - ${emp.name} (${roleStr})`,
        value: calc.inssEmployee,
        date: date,
        dueDate: dueDateStr,
        category: 'INSS Retido',
        paymentStatus: 'pendente',
      };

      addTransaction(grossSalaryTx);
      addTransaction(inssEmployerTx);
      addTransaction(inssEmployeeTx);

      // 4. IRPS Retido
      if (calc.irps > 0) {
        const irpsTx: Omit<Transaction, 'id'> = {
          type: 'despesa',
          description: `IRPS Retido - ${emp.name} (${roleStr})`,
          value: calc.irps,
          date: date,
          dueDate: dueDateStr,
          category: 'IRPS Retido',
          paymentStatus: 'pendente',
        };
        addTransaction(irpsTx);
      }

      // 5. Net Salary Payment
      const netSalaryTx: Omit<Transaction, 'id'> = {
        type: 'despesa',
        description: `Pagamento Salário Líquido - ${emp.name} (${roleStr})`,
        value: calc.netSalary,
        date: date,
        category: 'Pagamento Salário',
        paymentStatus: 'pago',
        paymentMethod: 'Transferência Bancária',
      };
      addTransaction(netSalaryTx);
    });

    setEmployees([]);
    toast.success(t('payroll.successMessage'));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: t('common.currency', 'MZN')
    }).format(value);
  };

  const handleExport = () => {
    const exportData = employees.map(emp => {
      const calc = calculateEmployeePayroll(emp);
      return {
        Nome: emp.name,
        'Salário Bruto': calc.gross,
        'Subsídios': calc.allowances,
        'INSS (3%)': calc.inssEmployee,
        'INSS Empresa (4%)': calc.inssEmployer,
        'IRPS': calc.irps,
        'Faltas (Dias)': calc.absentDays,
        'Faltas (Valor)': calc.absenceValue,
        'Adiantamentos': calc.advances,
        'Salário Líquido': calc.netSalary
      };
    });
    exportToCSV(exportData, `folha_pagamento_${date}.csv`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PrintHeader />
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white font-headline tracking-tight">
          {t('payroll.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('payroll.subtitle')}
        </p>
      </div>

      <div className="hidden print:block text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{t('payroll.title')}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-1 h-fit print:hidden">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('payroll.addEmployee')}</h2>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('payroll.employeeName')}
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder={t('payroll.employeeNamePlaceholder')}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPartner"
                checked={isPartner}
                onChange={(e) => setIsPartner(e.target.checked)}
                className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <label htmlFor="isPartner" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                É Sócio/Gerente?
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('payroll.grossSalary')}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder={t('payroll.grossSalaryPlaceholder')}
              />
            </div>

            {Number(grossSalary) > 20000 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('payroll.irpsRate')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={irpsRate}
                  onChange={(e) => setIrpsRate(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">{t('payroll.irpsRateHelp')}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subsídios
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={allowances}
                  onChange={(e) => setAllowances(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Faltas (Dias)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={absentDays}
                  onChange={(e) => setAbsentDays(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Adiantamentos
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={advances}
                  onChange={(e) => setAdvances(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!employeeName || !grossSalary}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              {t('payroll.addMember')}
            </button>
          </form>
        </div>

        {/* List and Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('payroll.employeeList')}</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('payroll.processingDate')}:
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                {t('payroll.noEmployees')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('payroll.employee')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('payroll.gross')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Subsídios</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('payroll.inss')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('payroll.irps')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Faltas/Adiant.</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('payroll.net')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center print:hidden">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map(emp => {
                      const calc = calculateEmployeePayroll(emp);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{emp.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right">{formatCurrency(calc.gross)}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right">{formatCurrency(calc.allowances)}</td>
                          <td className="py-3 px-4 text-sm text-error text-right">-{formatCurrency(calc.inssEmployee)}</td>
                          <td className="py-3 px-4 text-sm text-error text-right">-{formatCurrency(calc.irps)}</td>
                          <td className="py-3 px-4 text-sm text-error text-right">-{formatCurrency(calc.absenceValue + calc.advances)}</td>
                          <td className="py-3 px-4 text-sm font-bold text-primary text-right">{formatCurrency(calc.netSalary)}</td>
                          <td className="py-3 px-4 text-center print:hidden">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  // Simple print functionality for individual payslip
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                    printWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>Recibo de Vencimento - ${emp.name}</title>
                                          <style>
                                            body { font-family: sans-serif; padding: 20px; }
                                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                            th { background-color: #f2f2f2; }
                                            .text-right { text-align: right; }
                                            .bold { font-weight: bold; }
                                          </style>
                                        </head>
                                        <body>
                                          <h2>Recibo de Vencimento</h2>
                                          <p><strong>Funcionário:</strong> ${emp.name}</p>
                                          <p><strong>Data de Processamento:</strong> ${date}</p>
                                          <table>
                                            <thead>
                                              <tr>
                                                <th>Descrição</th>
                                                <th class="text-right">Vencimentos</th>
                                                <th class="text-right">Descontos</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              <tr>
                                                <td>Salário Base</td>
                                                <td class="text-right">${formatCurrency(calc.gross)}</td>
                                                <td></td>
                                              </tr>
                                              <tr>
                                                <td>Subsídios</td>
                                                <td class="text-right">${formatCurrency(calc.allowances)}</td>
                                                <td></td>
                                              </tr>
                                              <tr>
                                                <td>INSS (3%)</td>
                                                <td></td>
                                                <td class="text-right">${formatCurrency(calc.inssEmployee)}</td>
                                              </tr>
                                              <tr>
                                                <td>IRPS</td>
                                                <td></td>
                                                <td class="text-right">${formatCurrency(calc.irps)}</td>
                                              </tr>
                                              <tr>
                                                <td>Faltas (${calc.absentDays} dias)</td>
                                                <td></td>
                                                <td class="text-right">${formatCurrency(calc.absenceValue)}</td>
                                              </tr>
                                              <tr>
                                                <td>Adiantamentos</td>
                                                <td></td>
                                                <td class="text-right">${formatCurrency(calc.advances)}</td>
                                              </tr>
                                              <tr>
                                                <td class="bold">Totais</td>
                                                <td class="text-right bold">${formatCurrency(calc.gross + calc.allowances)}</td>
                                                <td class="text-right bold">${formatCurrency(calc.inssEmployee + calc.irps + calc.absenceValue + calc.advances)}</td>
                                              </tr>
                                              <tr>
                                                <td class="bold">Líquido a Receber</td>
                                                <td colspan="2" class="text-right bold">${formatCurrency(calc.netSalary)}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </body>
                                      </html>
                                    `);
                                    printWindow.document.close();
                                    printWindow.print();
                                  }
                                }}
                                className="text-slate-400 hover:text-primary transition-colors p-1"
                                title="Imprimir Recibo"
                              >
                                <span className="material-symbols-outlined text-sm">print</span>
                              </button>
                              <button
                                onClick={() => removeEmployee(emp.id)}
                                className="text-slate-400 hover:text-error transition-colors p-1"
                                title={t('payroll.remove')}
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumo Total */}
          {employees.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('payroll.summary')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{t('payroll.totalGross')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totals.gross)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Subsídios</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totals.allowances)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{t('payroll.totalInssEmployee')}</span>
                    <span className="font-medium text-error">-{formatCurrency(totals.inssEmployee)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{t('payroll.totalIrps')}</span>
                    <span className="font-medium text-error">-{formatCurrency(totals.irps)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Total Faltas/Adiantamentos</span>
                    <span className="font-medium text-error">-{formatCurrency(totals.absenceValue + totals.advances)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{t('payroll.totalNet')}</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(totals.netSalary)}</span>
                  </div>
                </div>

                <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Encargos Totais da Empresa</h3>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('payroll.totalInssEmployer')}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(totals.inssEmployer)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('payroll.totalInss')}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.totalInss)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Custo Total (Bruto + 4%)</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(totals.gross + totals.inssEmployer)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 print:hidden">
                <button
                  onClick={handleExport}
                  className="py-3 px-6 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">download</span>
                  Exportar CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="py-3 px-6 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">print</span>
                  Imprimir Recibos
                </button>
                <button
                  onClick={handleProcessPayroll}
                  className="py-3 px-8 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">payments</span>
                  {t('payroll.processPayroll')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
