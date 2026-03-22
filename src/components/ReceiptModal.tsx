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
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
        {/* Modal Header - Hidden on print */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center print:hidden bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Recibo</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors" title="Imprimir Recibo">
              <span className="material-symbols-outlined">print</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors" title="Fechar">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Receipt Content - This is what gets printed */}
        <div className="p-8 bg-white text-slate-900 print:p-4" id="receipt-content">
          {/* Company Header */}
          <div className="text-center mb-6 border-b border-dashed border-slate-300 pb-6">
            <h1 className="text-2xl font-black uppercase tracking-wider mb-2">{companyInfo?.name || 'SUA EMPRESA'}</h1>
            {companyInfo?.nuit && <p className="text-sm text-slate-600 font-medium">NUIT: {companyInfo.nuit}</p>}
            {companyInfo?.location && <p className="text-sm text-slate-600">{companyInfo.location}</p>}
            {companyInfo?.contact && <p className="text-sm text-slate-600">Celular: {companyInfo.contact}</p>}
          </div>

          {/* Receipt Info */}
          <div className="mb-6 text-sm">
            <h2 className="text-center font-bold text-lg mb-4 uppercase tracking-widest">
              {transaction.type === 'receita' ? 'Recibo de Venda' : 'Recibo de Compra'}
            </h2>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Data:</span>
              <span className="font-medium">{formatDate(transaction.date)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Recibo Nº:</span>
              <span className="font-medium font-mono">
                {transaction.receiptNumber ? String(transaction.receiptNumber).padStart(3, '0') : transaction.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Operador:</span>
              <span className="font-medium">Admin</span>
            </div>
            {customer && (
              <div className="flex justify-between mb-1 mt-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-medium">{customer.name}</span>
              </div>
            )}
            {supplier && (
              <div className="flex justify-between mb-1 mt-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500">Fornecedor:</span>
                <span className="font-medium">{supplier.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed border-slate-300 py-4 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 font-medium">Qtd</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium text-right">Preço</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {isMultiItem ? (
                  transaction.items!.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 align-top">{item.quantity}</td>
                      <td className="py-2 pr-2">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="py-2 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right align-top font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2 align-top">{quantity}</td>
                    <td className="py-2 pr-2">
                      <div className="font-medium">{product ? product.name : transaction.description}</div>
                      {product && <div className="text-xs text-slate-500">{transaction.description}</div>}
                    </td>
                    <td className="py-2 text-right align-top">{formatCurrency(unitPrice)}</td>
                    <td className="py-2 text-right align-top font-medium">{formatCurrency(totalValue)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-lg font-black">
              <span>TOTAL</span>
              <span>{formatCurrency(totalValue)}</span>
            </div>
            {transaction.paymentMethod && (
              <div className="flex justify-between text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">
                <span>Método de Pagamento:</span>
                <span className="font-medium">{transaction.paymentMethod}</span>
              </div>
            )}
            {transaction.paymentStatus && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Status:</span>
                <span className="font-medium uppercase">{transaction.paymentStatus}</span>
              </div>
            )}
          </div>

          {/* QR Code and Footer */}
          <div className="flex flex-col items-center justify-center text-center text-sm text-slate-500 border-t border-dashed border-slate-300 pt-6">
            <div className="mb-4">
              <QRCodeSVG value={qrData} size={100} level="M" />
            </div>
            <p className="mb-1">Obrigado pela preferência!</p>
            <p className="text-xs">Processado por computador</p>
          </div>
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
