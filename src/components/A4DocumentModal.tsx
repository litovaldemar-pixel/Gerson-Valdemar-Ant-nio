import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Transaction } from '../types';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface A4DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const A4DocumentModal = ({ isOpen, onClose, transaction }: A4DocumentModalProps) => {
  const { t } = useTranslation();
  const { companyInfo, products, customers, suppliers } = useAppContext();
  const printRef = useRef<HTMLDivElement>(null);

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
  const customer = transaction.customerId ? customers.find(c => c.id === transaction.customerId) : null;
  const supplier = transaction.supplierId ? suppliers.find(s => s.id === transaction.supplierId) : null;
  
  const unitPrice = isMultiItem ? 0 : (transaction.quantity ? transaction.value / transaction.quantity : transaction.value);
  const quantity = transaction.quantity || 1;
  const subtotal = isMultiItem 
    ? transaction.items!.reduce((acc, item) => acc + item.subtotal, 0)
    : (unitPrice * quantity);

  // If we have cartitems we calculate discount and IVA from there
  let ivaAmount = transaction.ivaAmount || 0;
  let discount = transaction.discount || 0;

  const totalValue = transaction.value;

  const docType = transaction.type === 'cotacao' 
    ? 'COTAÇÃO / PROFORMA' 
    : transaction.type === 'receita' ? 'FATURA / RECIBO' : 'ORDEM DE COMPRA';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(t('common.locale', 'pt-MZ'), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Documento_${transaction.id.substring(0, 8).toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto print:my-0 print:shadow-none">
        
        {/* Controls Overlay (Hidden on Print) */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">description</span>
            Documento {transaction.id.substring(0, 6).toUpperCase()}
          </h2>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Download PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">print</span> Imprimir
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition ml-2">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Document Content - Best for A4 */}
        <div className="p-10 md:p-14 bg-white" ref={printRef}>
          {/* Header Row */}
          <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
            <div className="flex flex-col">
              {companyInfo?.logoUrl ? (
                <img src={companyInfo.logoUrl} alt="Logo" className="h-16 object-contain mb-3" />
              ) : (
                <h1 className="text-3xl font-black text-primary uppercase tracking-tighter mb-2">{companyInfo?.name || 'VENDALINK'}</h1>
              )}
              {companyInfo?.nuit && <p className="text-sm font-bold text-slate-600">NUIT: {companyInfo.nuit}</p>}
              {companyInfo?.location && <p className="text-sm text-slate-600">{companyInfo.location}</p>}
              {companyInfo?.contact && <p className="text-sm text-slate-600">{companyInfo.contact}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-slate-800 mb-2">{docType}</h2>
              <div className="text-sm">
                <p><span className="font-bold">Referência:</span> #{transaction.id.substring(0, 8).toUpperCase()}</p>
                <p><span className="font-bold">Data de Emissão:</span> {formatDate(transaction.date)}</p>
                {transaction.dueDate && (
                  <p><span className="font-bold">Validade/Vencimento:</span> {formatDate(transaction.dueDate)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Client/Supplier Info */}
          <div className="flex justify-between mb-8">
            <div className="w-1/2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Faturado para:</h3>
              {customer ? (
                <div>
                  <p className="text-lg font-bold text-slate-800">{customer.name}</p>
                  {customer.document && <p className="text-sm text-slate-600">NUIT/Doc: {customer.document}</p>}
                  {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
                </div>
              ) : supplier ? (
                <div>
                  <p className="text-lg font-bold text-slate-800">{supplier.name}</p>
                  {supplier.document && <p className="text-sm text-slate-600">NUIT/Doc: {supplier.document}</p>}
                </div>
              ) : (
                <p className="text-lg font-bold text-slate-800">Consumidor Final (Diversos)</p>
              )}
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left mb-8 border-collapse">
            <thead>
              <tr className="border-y-2 border-slate-300">
                <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase text-right">Qtd</th>
                <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase text-right">Preço Un.</th>
                <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isMultiItem ? (
                transaction.items!.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-2 text-sm font-medium text-slate-800">{item.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-600 text-right">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-slate-600 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-2 text-sm font-bold text-slate-800 text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-2 text-sm font-medium text-slate-800">{transaction.description}</td>
                  <td className="py-3 px-2 text-sm text-slate-600 text-right">{quantity}</td>
                  <td className="py-3 px-2 text-sm text-slate-600 text-right">{formatCurrency(unitPrice)}</td>
                  <td className="py-3 px-2 text-sm font-bold text-slate-800 text-right">{formatCurrency(subtotal)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Box */}
          <div className="flex justify-end mb-12">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Descontos:</span>
                <span className="font-medium">-{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-2">
                <span>IVA/Impostos:</span>
                <span className="font-medium">{formatCurrency(ivaAmount)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-800 pt-1">
                <span>Total:</span>
                <span>{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="grid grid-cols-2 gap-8 text-xs text-slate-500 pt-8 border-t border-slate-200">
            <div>
              <h4 className="font-bold text-slate-700 mb-1 uppercase tracking-wider">Termos e Pagamento</h4>
              <p>O pagamento deve ser efetuado no prazo acordado.</p>
              <p>Status: <span className="font-bold">{transaction.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE'}</span></p>
              {transaction.paymentMethod && <p>Método: {transaction.paymentMethod}</p>}
            </div>
            <div className="text-right">
              <p className="italic">Documento gerado pelo sistema Vendalink</p>
              <p>Obrigado pelo seu negócio!</p>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-modal-open .fixed { position: absolute; left: 0; top: 0; margin: 0; padding: 0; background: white; }
          .print-modal-open .fixed > div { box-shadow: none; border: none; width: 100%; max-width: 100%; margin: 0; }
          .print-modal-open .fixed > div > div:nth-child(2) { visibility: visible; }
          .print-modal-open .fixed > div > div:nth-child(2) * { visibility: visible; }
        }
      `}</style>
    </div>
  );
};

export default A4DocumentModal;
