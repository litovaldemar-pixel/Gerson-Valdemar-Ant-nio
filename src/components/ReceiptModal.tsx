import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Transaction } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const ReceiptModal = ({ isOpen, onClose, transaction }: ReceiptModalProps) => {
  const { t } = useTranslation();
  const { companyInfo, products, customers, suppliers } = useAppContext();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-modal-open');
    } else {
      document.body.classList.remove('print-modal-open');
    }
    return () => document.body.classList.remove('print-modal-open');
  }, [isOpen]);

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
    return new Intl.DateTimeFormat(t('common.locale', 'pt-MZ'), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
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
      <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none flex flex-col max-h-[90vh] print:max-h-none print:h-auto print:overflow-visible print:block">
        {/* Modal Header - Hidden on print */}
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center print:hidden bg-slate-50 shrink-0">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{t('receipt.receipt')}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Receipt Content - This is what gets printed */}
        <div className="p-6 bg-white text-slate-900 print:p-4 overflow-y-auto print:overflow-visible print:block" id="receipt-content">
          {/* Company Header */}
          <div className="text-center mb-4 border-b border-dashed border-slate-300 pb-4 flex flex-col items-center">
            {companyInfo?.logoUrl && (
              <img 
                src={companyInfo.logoUrl} 
                alt="Company Logo" 
                className="w-16 h-16 object-contain mb-2"
              />
            )}
            <h1 className="text-xl font-black uppercase tracking-wider mb-1">{companyInfo?.name || t('receipt.yourCompany')}</h1>
            {companyInfo?.nuit && <p className="text-[10px] text-slate-600 font-medium">{t('companySettings.nuit')}: {companyInfo.nuit}</p>}
            {companyInfo?.location && <p className="text-[10px] text-slate-600">{companyInfo.location}</p>}
            {companyInfo?.contact && <p className="text-[10px] text-slate-600">{t('receipt.cellphone')}: {companyInfo.contact}</p>}
          </div>

          {/* Receipt Info */}
          <div className="mb-4 text-[11px]">
            <h2 className="text-center font-bold text-xs mb-3 uppercase tracking-widest">
              {transaction.category === 'Pessoal' && transaction.description.startsWith('Salário') 
                ? t('receipt.salaryReceipt') 
                : transaction.type === 'receita' 
                  ? t('receipt.salesReceipt') 
                  : t('receipt.purchaseReceipt')}
            </h2>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-500">{t('receipt.date')}:</span>
              <span className="font-medium">{formatDate(transaction.date)}</span>
            </div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-500">{t('receipt.receiptNumber')}:</span>
              <span className="font-medium font-mono">
                {transaction.receiptNumber ? String(transaction.receiptNumber).padStart(3, '0') : transaction.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            {customer && (
              <div className="flex justify-between mb-0.5 mt-1 pt-1 border-t border-slate-100">
                <span className="text-slate-500">{t('receipt.customer')}:</span>
                <span className="font-medium">{customer.name}</span>
              </div>
            )}
            {supplier && (
              <div className="flex justify-between mb-0.5 mt-1 pt-1 border-t border-slate-100">
                <span className="text-slate-500">{t('receipt.supplier')}:</span>
                <span className="font-medium">{supplier.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-1 font-medium">{t('receipt.qty')}</th>
                  <th className="pb-1 font-medium">{t('receipt.description')}</th>
                  <th className="pb-1 font-medium text-right">{t('receipt.total')}</th>
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
              <span>{t('receipt.total')}</span>
              <span>{formatCurrency(totalValue)}</span>
            </div>
            {transaction.paymentMethod && (
              <div className="flex justify-between text-[10px] text-slate-600 mt-1 pt-1 border-t border-slate-100">
                <span>{t('receipt.paymentMethod')}:</span>
                <span className="font-medium">{transaction.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* QR Code and Footer */}
          <div className="flex flex-col items-center justify-center text-center text-[10px] text-slate-500 border-t border-dashed border-slate-300 pt-4">
            <div className="mb-2">
              <QRCodeSVG value={qrData} size={60} level="M" />
            </div>
            <p className="mb-0.5">{t('receipt.thankYou')}</p>
            <p>{t('receipt.processedByComputer')}</p>
          </div>
        </div>

        {/* Modal Footer - Explicit Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 print:hidden bg-slate-50 shrink-0">
          <button 
            onClick={handlePrint} 
            className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            {t('receipt.printReceipt')}
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            {t('companySettings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
