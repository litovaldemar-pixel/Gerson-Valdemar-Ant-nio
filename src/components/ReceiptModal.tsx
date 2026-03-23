import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Transaction } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const ReceiptModal = ({ isOpen, onClose, transaction }: ReceiptModalProps) => {
  const { companyInfo, products, customers, suppliers } = useAppContext();

  if (!isOpen || !transaction) return null;

  const isMultiItem = transaction.items && transaction.items.length > 0;
  const product = !isMultiItem && transaction.productId ? products.find(p => p.id === transaction.productId) : null;
  const customer = transaction.customerId ? customers.find(c => c.id === transaction.customerId) : null;
  const supplier = transaction.supplierId ? suppliers.find(s => s.id === transaction.supplierId) : null;
  
  const unitPrice = isMultiItem ? 0 : (transaction.quantity ? transaction.value / transaction.quantity : transaction.value);
  const quantity = transaction.quantity || 1;
  const totalValue = transaction.value;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate QR Code data
  const qrData = JSON.stringify({
    id: transaction.id,
    date: transaction.date,
    total: totalValue,
    nuit: companyInfo?.nuit || ''
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none flex flex-col max-h-[90vh]">
        {/* Modal Header - Hidden on print */}
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center print:hidden bg-slate-50 shrink-0">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Recibo</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Receipt Content - This is what gets printed */}
        <div className="p-6 bg-white text-slate-900 print:p-4 overflow-y-auto" id="receipt-content">
          {/* Company Header */}
          <div className="text-center mb-4 border-b border-dashed border-slate-300 pb-4">
            <h1 className="text-xl font-black uppercase tracking-wider mb-1">{companyInfo?.name || 'SUA EMPRESA'}</h1>
            {companyInfo?.nuit && <p className="text-[10px] text-slate-600 font-medium">NUIT: {companyInfo.nuit}</p>}
            {companyInfo?.location && <p className="text-[10px] text-slate-600">{companyInfo.location}</p>}
            {companyInfo?.contact && <p className="text-[10px] text-slate-600">Celular: {companyInfo.contact}</p>}
          </div>

          {/* Receipt Info */}
          <div className="mb-4 text-[11px]">
            <h2 className="text-center font-bold text-xs mb-3 uppercase tracking-widest">
              {transaction.type === 'receita' ? 'Recibo de Venda' : 'Recibo de Compra'}
            </h2>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-500">Data:</span>
              <span className="font-medium">{formatDate(transaction.date)}</span>
            </div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-500">Recibo Nº:</span>
              <span className="font-medium font-mono">
                {transaction.receiptNumber ? String(transaction.receiptNumber).padStart(3, '0') : transaction.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            {customer && (
              <div className="flex justify-between mb-0.5 mt-1 pt-1 border-t border-slate-100">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-medium">{customer.name}</span>
              </div>
            )}
            {supplier && (
              <div className="flex justify-between mb-0.5 mt-1 pt-1 border-t border-slate-100">
                <span className="text-slate-500">Fornecedor:</span>
                <span className="font-medium">{supplier.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-1 font-medium">Qtd</th>
                  <th className="pb-1 font-medium">Descrição</th>
                  <th className="pb-1 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {isMultiItem ? (
                  transaction.items!.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 align-top">{item.quantity} {item.unit || 'un'}</td>
                      <td className="py-1 pr-2">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="py-1 text-right align-top font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-1 align-top">{quantity} {transaction.unit || 'un'}</td>
                    <td className="py-1 pr-2">
                      <div className="font-medium">{product ? product.name : transaction.description}</div>
                    </td>
                    <td className="py-1 text-right align-top font-medium">{formatCurrency(totalValue)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1 mb-6">
            <div className="flex justify-between text-base font-black">
              <span>TOTAL</span>
              <span>{formatCurrency(totalValue)}</span>
            </div>
            {transaction.paymentMethod && (
              <div className="flex justify-between text-[10px] text-slate-600 mt-1 pt-1 border-t border-slate-100">
                <span>Pagamento:</span>
                <span className="font-medium">{transaction.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* QR Code and Footer */}
          <div className="flex flex-col items-center justify-center text-center text-[10px] text-slate-500 border-t border-dashed border-slate-300 pt-4">
            <div className="mb-2">
              <QRCodeSVG value={qrData} size={60} level="M" />
            </div>
            <p className="mb-0.5">Obrigado pela preferência!</p>
            <p>Processado por computador</p>
          </div>
        </div>

        {/* Modal Footer - Explicit Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 print:hidden bg-slate-50 shrink-0">
          <button 
            onClick={handlePrint} 
            className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Imprimir
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            Sair
          </button>
        </div>
      </div>
      
      {/* Print Styles scoped to when modal is open */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          @page {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;
