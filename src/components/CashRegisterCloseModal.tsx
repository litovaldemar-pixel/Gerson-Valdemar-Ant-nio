import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

interface CashRegisterCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CashRegisterCloseModal = ({ isOpen, onClose }: CashRegisterCloseModalProps) => {
  const { t } = useTranslation();
  const { transactions, companyInfo } = useAppContext();
  const [drawerAmount, setDrawerAmount] = useState<string>('');
  const [isPrinted, setIsPrinted] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const todayTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(today) && t.type !== 'cotacao');
  }, [transactions, today]);

  const totalsByMethod = useMemo(() => {
    const totals: Record<string, number> = {
      'Numerário': 0,
      'M-Pesa': 0,
      'E-mola': 0,
      'Cartão': 0,
      'Transferência Bancária': 0,
      'Cheque': 0
    };

    todayTransactions.forEach(t => {
      if (t.paymentStatus === 'pago') {
        const value = t.type === 'receita' ? t.value : -t.value; // Despesas removem dinheiro
        if (t.paymentMethod) {
          if (!totals[t.paymentMethod]) totals[t.paymentMethod] = 0;
          totals[t.paymentMethod] += value;
        }
      }
    });

    return totals;
  }, [todayTransactions]);

  const systemCash = totalsByMethod['Numerário'] || 0;
  const countedCash = parseFloat(drawerAmount) || 0;
  const cashDifference = countedCash - systemCash;

  const totalSales = todayTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.value, 0);
  const totalExpenses = todayTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: 'MZN',
    }).format(value);
  };

  const handlePrint = () => {
    setIsPrinted(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden ${isPrinted ? 'print:w-80 print:shadow-none print:mx-auto' : ''}`}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">point_of_sale</span>
            Fecho de Caixa (Turno)
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6 print:hidden">
            <p className="text-sm text-slate-500">Resumo financeiro do dia de hoje</p>
            <h3 className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString('pt-MZ')}</h3>
          </div>

          {/* Printable Area - looks like a thermal receipt when printed */}
          <div className="print-area font-mono text-sm space-y-4 text-slate-800">
            <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-4 hidden print:block">
              <h2 className="text-xl font-bold uppercase">{companyInfo?.name || 'VendaLink'}</h2>
              <p>FECHO DE CAIXA (Z-Leitura)</p>
              <p>Data: {new Date().toLocaleDateString('pt-MZ')} {new Date().toLocaleTimeString('pt-MZ')}</p>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-300 pb-4">
              <div className="flex justify-between font-bold text-primary print:text-black">
                <span>Total Vendas:</span>
                <span>{formatCurrency(totalSales)}</span>
              </div>
              <div className="flex justify-between font-bold text-error print:text-black">
                <span>Total Despesas/Sangrias:</span>
                <span>-{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between font-black text-lg pt-2 mt-2 border-t border-slate-200">
                <span>Total Líquido:</span>
                <span>{formatCurrency(totalSales - totalExpenses)}</span>
              </div>
            </div>

            <div className="py-2">
              <h4 className="font-bold mb-2 uppercase text-xs text-slate-500 print:text-black">Por Método de Pagamento:</h4>
              {Object.entries(totalsByMethod).filter(([_, val]) => val !== 0).map(([method, val]) => (
                <div key={method} className="flex justify-between text-sm py-1">
                  <span>{method}</span>
                  <span className="font-bold">{formatCurrency((val as number))}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-100 p-4 rounded-lg mt-6 border border-slate-200 print:bg-transparent print:border-none print:p-0">
              <h4 className="font-bold mb-3 uppercase text-xs text-primary print:text-black print:border-b print:border-dashed print:pb-2">Conciliação de Gaveta (Numerário)</h4>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Sistema (Esperado):</span>
                <span className="font-bold">{formatCurrency(systemCash)}</span>
              </div>
              
              <div className="flex justify-between items-center mb-3 pt-2">
                <span className="text-sm">Gaveta (Contado):</span>
                <div className="print:hidden w-32">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={drawerAmount}
                    onChange={(e) => setDrawerAmount(e.target.value)}
                    className="w-full text-right p-2 border border-slate-300 rounded font-bold text-secondary focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <span className="hidden print:inline font-bold">{formatCurrency(countedCash)}</span>
              </div>
              
              {(drawerAmount !== '') && (
                <div className={`flex justify-between items-center mt-3 pt-3 border-t ${cashDifference < 0 ? 'border-error/30 text-error' : cashDifference > 0 ? 'border-secondary/30 text-secondary' : 'border-slate-300 text-slate-700'}`}>
                  <span className="font-bold">{cashDifference < 0 ? 'Falta de Caixa:' : cashDifference > 0 ? 'Sobra de Caixa:' : 'Caixa Certo!'}</span>
                  <span className="font-black">{formatCurrency(Math.abs(cashDifference))}</span>
                </div>
              )}
            </div>

            <div className="hidden print:block text-center pt-8 mt-12 border-t border-dashed border-slate-400">
              <p>___________________________</p>
              <p className="mt-1 text-xs">Assinatura do Operador</p>
            </div>
          </div>

          <div className="mt-8 pt-4 gap-3 flex flex-col print:hidden border-t border-slate-200">
            <button 
              onClick={handlePrint}
              disabled={drawerAmount === ''}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">print</span>
              Imprimir Z-Leitura
            </button>
            <button onClick={onClose} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-200 transition">
              Fechar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-modal-open .fixed { position: absolute; left: 0; top: 0; margin: 0; padding: 0; background: white; width: 100%; height: 100%; }
          .print-modal-open .fixed > div { box-shadow: none; border: none; width: 80mm; max-width: 100%; margin: 0 auto; }
          .print-modal-open .fixed > div * { visibility: visible; }
          .print-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CashRegisterCloseModal;
