import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';

interface KardexModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function KardexModal({ isOpen, onClose, product }: KardexModalProps) {
  const { t } = useTranslation();
  const { transactions } = useAppContext();

  if (!isOpen || !product) return null;

  const productTransactions = transactions.filter(t => 
    t.type !== 'cotacao' && t.items?.some(item => item.productId === product.id)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: t('common.currency', 'MZN')
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Kardex (Histórico de Movimentos)</h2>
            <p className="text-sm text-on-surface-variant mt-1">{product.name} ({product.sku})</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {productTransactions.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              Nenhum movimento encontrado para este produto.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Data</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Documento</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Qtd</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Preço Unit.</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {productTransactions.map(tx => {
                  const item = tx.items?.find(i => i.productId === product.id);
                  if (!item) return null;
                  
                  const isEntry = tx.type === 'despesa'; // Compra = Entrada
                  const isExit = tx.type === 'receita'; // Venda = Saída

                  return (
                    <tr key={tx.id} className="hover:bg-surface-container-low/30">
                      <td className="py-3 px-4 text-sm text-on-surface">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${isEntry ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                          {isEntry ? 'Entrada (Compra)' : 'Saída (Venda)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{tx.description}</td>
                      <td className={`py-3 px-4 text-sm font-bold text-right ${isEntry ? 'text-secondary' : 'text-primary'}`}>
                        {isEntry ? '+' : '-'}{item.quantity}
                      </td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-sm font-bold text-on-surface text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
