import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TransactionType } from '../types';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<TransactionType>('receita');
  const [category, setCategory] = useState('Operacional');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const { products } = useAppContext();

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setDescription(t.description);
    setValue(t.value.toString());
    setType(t.type);
    setCategory(t.category);
    setProductId(t.productId || '');
    setQuantity(t.quantity?.toString() || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setValue('');
    setType('receita');
    setCategory('Operacional');
    setProductId('');
    setQuantity('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !value) return;

    const transactionData: any = {
      description,
      value: parseFloat(value),
      type,
      category,
    };

    if (productId && quantity) {
      transactionData.productId = productId;
      transactionData.quantity = parseInt(quantity, 10);
    } else {
      transactionData.productId = null;
      transactionData.quantity = null;
    }

    if (editingId) {
      updateTransaction(editingId, transactionData);
      setEditingId(null);
    } else {
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        ...transactionData
      });
    }

    setDescription('');
    setValue('');
    setType('receita');
    setCategory('Operacional');
    setProductId('');
    setQuantity('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getTransactionValue = (t: any) => {
    if (t.productId && t.quantity) {
      const product = products.find(p => p.id === t.productId);
      if (product) {
        return t.quantity * product.price;
      }
    }
    return t.value;
  };

  const totalReceitas = transactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + getTransactionValue(curr), 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + getTransactionValue(curr), 0);
  const saldoPrevisto = totalReceitas - totalDespesas;

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      {/* Header Section */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">Lançamentos</h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie suas movimentações financeiras com precisão.</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Imprimir
          </button>
          <button className="px-5 py-2.5 bg-surface-container-lowest text-primary border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filtros Avançados
          </button>
          <button className="px-5 py-2.5 bg-secondary text-on-secondary rounded-lg font-bold text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Novo Lançamento
          </button>
        </div>
      </section>

      {/* Quick Entry Form Section */}
      <section className="bg-surface-container-low rounded-xl p-6 print:hidden">
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Entrada Rápida</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 items-end">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Descrição</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="Ex: Aluguel Escritório"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Valor (MZN)</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="0,00"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Tipo</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim appearance-none"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Categoria</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Operacional">Operacional</option>
              <option value="Marketing">Marketing</option>
              <option value="Pessoal">Pessoal</option>
              <option value="Infraestrutura">Infraestrutura</option>
              <option value="Serviços">Serviços</option>
              <option value="SaaS">SaaS</option>
              <option value="Produto">Produto</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Produto (Opcional)</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Nenhum</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Qtd</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="0"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!productId}
              required={!!productId}
            />
          </div>
          <div className="flex gap-2 w-full lg:col-span-7">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-full md:w-auto bg-surface-variant text-on-surface-variant px-6 py-3 rounded-lg font-bold text-sm hover:bg-outline-variant transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" className="w-full md:w-auto bg-primary text-on-primary px-8 py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors ml-auto">
              {editingId ? 'Atualizar' : 'Confirmar'}
            </button>
          </div>
        </form>
      </section>

      {/* Transactions Table Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden print:shadow-none print:border print:border-outline-variant/20">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="font-headline font-bold text-lg text-primary">Histórico de Movimentações</h3>
          <div className="flex items-center gap-4 print:hidden">
            <span className="text-xs text-on-surface-variant">Mostrando 1-{transactions.length} de {transactions.length} lançamentos</span>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 print:bg-transparent print:border-b print:border-outline-variant/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Data</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Produto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Qtd</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Preço Venda</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Custo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Stock Atual</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 print:divide-outline-variant/20">
              {transactions.map((t) => {
                const product = t.productId ? products.find(p => p.id === t.productId) : null;
                return (
                <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors group print:hover:bg-transparent">
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{formatDate(t.date)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">
                    {t.description}
                    <div className="text-xs font-normal text-on-surface-variant mt-1">{t.category}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{product ? product.name : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-mono">{t.quantity || '-'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-right text-primary">
                    {product ? formatCurrency(product.price) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right text-error">
                    {product ? formatCurrency(product.cost) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product ? (
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${product.stock <= product.minStock ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {product.stock} un
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full print:border print:border-outline-variant/20 print:bg-transparent print:text-on-surface ${t.type === 'receita' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-headline font-bold print:text-on-surface ${t.type === 'receita' ? 'text-secondary' : 'text-error'}`}>
                    {t.type === 'receita' ? '+' : '-'} {formatCurrency(getTransactionValue(t))}
                  </td>
                  <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(t)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteTransaction(t.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-surface-container-low/20 flex justify-center print:hidden">
          <button className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
            Ver todos os lançamentos
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </section>

      {/* Sticky Footer Summary (Bento Style) */}
      <footer className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Saldo Previsto</p>
            <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(saldoPrevisto)}</h4>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10">account_balance</span>
        </div>
        <div className="bg-secondary-container text-on-secondary-container rounded-xl p-6 border border-secondary/10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">Receitas Mês</p>
          <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(totalReceitas)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            12% em relação ao mês anterior
          </div>
        </div>
        <div className="bg-error-container text-on-error-container rounded-xl p-6 border border-error/10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">Despesas Mês</p>
          <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(totalDespesas)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">trending_down</span>
            -4% em relação ao mês anterior
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Transactions;
