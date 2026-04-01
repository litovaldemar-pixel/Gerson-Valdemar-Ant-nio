import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { Transaction } from '../types';
import { toast } from 'sonner';

interface EmployeePayroll {
  id: string;
  name: string;
  grossSalary: number;
  irpsRate: number;
}

export default function Payroll() {
  const { t } = useTranslation();
  const { addTransaction } = useAppContext();

  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states for adding new employee
  const [employeeName, setEmployeeName] = useState('');
  const [grossSalary, setGrossSalary] = useState<number | ''>('');
  const [irpsRate, setIrpsRate] = useState<number>(10);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !grossSalary) return;

    const newEmployee: EmployeePayroll = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: employeeName,
      grossSalary: Number(grossSalary),
      irpsRate: Number(irpsRate)
    };

    setEmployees([...employees, newEmployee]);
    setEmployeeName('');
    setGrossSalary('');
    setIrpsRate(10);
  };

  const removeEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const calculateEmployeePayroll = (emp: EmployeePayroll) => {
    const gross = emp.grossSalary;
    const inssEmployee = gross * 0.03;
    const inssEmployer = gross * 0.04;
    const totalInss = inssEmployee + inssEmployer;
    const irps = gross > 20000 ? gross * (emp.irpsRate / 100) : 0;
    const netSalary = gross - inssEmployee - irps;
    
    return { gross, inssEmployee, inssEmployer, totalInss, irps, netSalary };
  };

  const totals = employees.reduce((acc, emp) => {
    const calc = calculateEmployeePayroll(emp);
    return {
      gross: acc.gross + calc.gross,
      inssEmployee: acc.inssEmployee + calc.inssEmployee,
      inssEmployer: acc.inssEmployer + calc.inssEmployer,
      totalInss: acc.totalInss + calc.totalInss,
      irps: acc.irps + calc.irps,
      netSalary: acc.netSalary + calc.netSalary
    };
  }, { gross: 0, inssEmployee: 0, inssEmployer: 0, totalInss: 0, irps: 0, netSalary: 0 });

  const handleProcessPayroll = () => {
    if (employees.length === 0) return;

    employees.forEach(emp => {
      const calc = calculateEmployeePayroll(emp);

      // 1. Net Salary Transaction
      const netSalaryTx: Omit<Transaction, 'id'> = {
        type: 'despesa',
        description: `Salário Líquido - ${emp.name}`,
        value: calc.netSalary,
        date: date,
        category: 'Pessoal',
        paymentStatus: 'pago',
        paymentMethod: 'Transferência Bancária',
      };

      // 2. INSS Transaction (Employee 3% + Employer 4%)
      const inssTx: Omit<Transaction, 'id'> = {
        type: 'despesa',
        description: `INSS (7%) - ${emp.name}`,
        value: calc.totalInss,
        date: date,
        category: 'Estado',
        paymentStatus: 'pendente',
      };

      addTransaction(netSalaryTx);
      addTransaction(inssTx);

      // 3. IRPS Transaction
      if (calc.irps > 0) {
        const irpsTx: Omit<Transaction, 'id'> = {
          type: 'despesa',
          description: `IRPS - ${emp.name}`,
          value: calc.irps,
          date: date,
          category: 'Estado',
          paymentStatus: 'pendente',
        };
        addTransaction(irpsTx);
      }
    });

    setEmployees([]);
    toast.success(t('payroll.successMessage'));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white font-headline tracking-tight">
          {t('payroll.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('payroll.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-1 h-fit">
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
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('payroll.inss')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('payroll.irps')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('payroll.net')}</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map(emp => {
                      const calc = calculateEmployeePayroll(emp);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{emp.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right">{formatCurrency(calc.gross)}</td>
                          <td className="py-3 px-4 text-sm text-error text-right">-{formatCurrency(calc.inssEmployee)}</td>
                          <td className="py-3 px-4 text-sm text-error text-right">-{formatCurrency(calc.irps)}</td>
                          <td className="py-3 px-4 text-sm font-bold text-primary text-right">{formatCurrency(calc.netSalary)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => removeEmployee(emp.id)}
                              className="text-slate-400 hover:text-error transition-colors p-1"
                              title={t('payroll.remove')}
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
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
                    <span className="text-slate-600 dark:text-slate-400">{t('payroll.totalInssEmployee')}</span>
                    <span className="font-medium text-error">-{formatCurrency(totals.inssEmployee)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{t('payroll.totalIrps')}</span>
                    <span className="font-medium text-error">-{formatCurrency(totals.irps)}</span>
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

              <div className="mt-6 flex justify-end">
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
