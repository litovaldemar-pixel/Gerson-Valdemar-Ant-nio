import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TransactionType, Transaction, TransactionItem } from '../types';
import ReceiptModal from '../components/ReceiptModal';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, products, customers, suppliers } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<TransactionType>('receita');
  const [category, setCategory] = useState('Operacional');
  
  // For single product (legacy)
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState('');
  
  // For multiple items
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [cartItems, setCartItems] = useState<TransactionItem[]>([]);
  const [selectedReceiptTransaction, setSelectedReceiptTransaction] = useState<Transaction | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Numerário');
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente'>('pago');

  // Calculate total for cart
  const cartTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Calculate total for single item if not using cart
  useEffect(() => {
    if (cartItems.length === 0 && quantity && itemUnitPrice) {
      const q = parseInt(quantity, 10);
      const p = parseFloat(itemUnitPrice);
      if (!isNaN(q) && !isNaN(p)) {
        setValue((q * p).toString());
      }
    }
  }, [quantity, itemUnitPrice, cartItems.length]);

  useEffect(() => {
    if (cartItems.length > 0) {
      setValue(cartTotal.toString());
      if (!description) {
        if (type === 'receita') {
          const customer = customers.find(c => c.id === customerId);
          setDescription(`Venda${customer ? ` para ${customer.name}` : ' Diversa'}`);
        } else {
          const supplier = suppliers.find(s => s.id === supplierId);
          setDescription(`Compra${supplier ? ` de ${supplier.name}` : ' de Stock'}`);
        }
      }
    }
  }, [cartItems, type, customerId, supplierId, customers, suppliers]);

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setDescription(t.description);
    setValue(t.value.toString());
    setType(t.type);
    setCategory(t.category);
    setProductId(t.productId || '');
    setQuantity(t.quantity?.toString() || '');
    setItemUnitPrice(t.unitPrice?.toString() || '');
    setCustomerId(t.customerId || '');
    setSupplierId(t.supplierId || '');
    setPaymentMethod(t.paymentMethod || 'Numerário');
    setPaymentStatus(t.paymentStatus || 'pago');
    setCartItems(t.items || []);
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
    setItemUnitPrice('');
    setCustomerId('');
    setSupplierId('');
    setPaymentMethod('Numerário');
    setPaymentStatus('pago');
    setCartItems([]);
  };

  const handleAddToCart = () => {
    if (!productId || !quantity || !itemUnitPrice) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const qty = parseInt(quantity, 10);
    if (qty <= 0) return;

    if (type === 'receita' && product.stock < qty) {
      alert(`Quantidade solicitada (${qty}) é maior que o stock disponível (${product.stock}).`);
      return;
    }

    const unitPrice = parseFloat(itemUnitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) return;

    const newItem: TransactionItem = {
      productId: product.id,
      name: product.name,
      quantity: qty,
      unitPrice: unitPrice,
      subtotal: unitPrice * qty
    };

    setCartItems([...cartItems, newItem]);
    setProductId('');
    setQuantity('');
    setItemUnitPrice('');
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isMultiItem = cartItems.length > 0;
    
    if (!description) return;
    if (!isMultiItem && !value) return;

    if (type === 'receita' && cartItems.length === 0 && !productId) {
      // Allow simple revenue without products, but if they want to sell products they should use the cart
    }

    // Legacy single product validation (for despesas or simple receitas)
    if (type === 'receita' && cartItems.length === 0 && productId && quantity) {
      const product = products.find(p => p.id === productId);
      if (product) {
        if (product.stock === 0) {
          alert('Não é possível realizar a venda: Stock zero.');
          return;
        }
        if (parseInt(quantity, 10) > product.stock) {
          alert(`Não é possível realizar a venda: Quantidade solicitada (${quantity}) é maior que o stock disponível (${product.stock}).`);
          return;
        }
      }
    }

    const parsedValue = isMultiItem ? cartTotal : parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      alert('Valor da transação inválido.');
      return;
    }

    const transactionData: any = {
      description,
      value: parsedValue,
      type,
      category,
      paymentMethod,
      paymentStatus,
    };

    if (isMultiItem) {
      transactionData.items = cartItems;
      transactionData.customerId = type === 'receita' ? (customerId || null) : null;
      transactionData.supplierId = type === 'despesa' ? (supplierId || null) : null;
      transactionData.productId = null;
      transactionData.quantity = null;
      transactionData.unitPrice = null;
    } else {
      if (productId && quantity) {
        transactionData.productId = productId;
        transactionData.quantity = parseInt(quantity, 10);
        transactionData.unitPrice = itemUnitPrice ? parseFloat(itemUnitPrice) : null;
      } else {
        transactionData.productId = null;
        transactionData.quantity = null;
        transactionData.unitPrice = null;
      }
      transactionData.items = null;
      transactionData.customerId = type === 'receita' ? (customerId || null) : null;
      transactionData.supplierId = type === 'despesa' ? (supplierId || null) : null;
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
    setItemUnitPrice('');
    setCustomerId('');
    setSupplierId('');
    setPaymentMethod('Numerário');
    setPaymentStatus('pago');
    setCartItems([]);
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

  const totalReceitas = transactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 items-end">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Tipo</label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim appearance-none"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TransactionType);
                  setCartItems([]);
                }}
              >
                <option value="receita">Receita (Venda)</option>
                <option value="despesa">Despesa (Compra / Entrada de Stock)</option>
              </select>
            </div>
            
            {type === 'receita' ? (
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">Cliente (Opcional)</label>
                <select
                  className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Consumidor Final</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">Fornecedor (Opcional)</label>
                <select
                  className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Fornecedor Diverso</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2 lg:col-span-3">
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
                <option value="Estado">Estado (Impostos)</option>
                <option value="Serviços">Serviços</option>
                <option value="SaaS">SaaS</option>
                <option value="Produto">Produto</option>
              </select>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 space-y-4">
            <h4 className="text-sm font-bold text-primary">
              {type === 'receita' ? 'Produtos a Vender (Opcional)' : 'Produtos para Entrada de Stock (Opcional)'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="space-y-2 md:col-span-4">
                <label className="text-xs font-bold text-on-surface-variant ml-1">Produto</label>
                <select
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    const p = products.find(prod => prod.id === e.target.value);
                    if (p) {
                      setItemUnitPrice((type === 'receita' ? p.price : p.cost).toString());
                    } else {
                      setItemUnitPrice('');
                    }
                  }}
                >
                  <option value="">Selecione um produto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} | {formatCurrency(type === 'receita' ? p.price : p.cost)})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">Qtd</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="0"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!productId}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-on-surface-variant ml-1">Preço Unit.</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(e.target.value)}
                  disabled={!productId}
                />
              </div>
              <div className="md:col-span-3">
                <button 
                  type="button" 
                  onClick={handleAddToCart}
                  disabled={!productId || !quantity || !itemUnitPrice}
                  className="w-full bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Adicionar Item
                </button>
              </div>
            </div>

            {cartItems.length > 0 && (
              <div className="mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low">
                    <tr>
                      <th className="px-4 py-2 rounded-tl-lg">Produto</th>
                      <th className="px-4 py-2 text-center">Qtd</th>
                      <th className="px-4 py-2 text-right">Preço Unit.</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                      <th className="px-4 py-2 rounded-tr-lg text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-outline-variant/10">
                        <td className="px-4 py-2 font-medium">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-right font-bold text-primary">{formatCurrency(item.subtotal)}</td>
                        <td className="px-4 py-2 text-center">
                          <button type="button" onClick={() => handleRemoveFromCart(idx)} className="text-error hover:text-error-container">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold">Total:</td>
                      <td className="px-4 py-3 text-right font-black text-lg text-secondary">{formatCurrency(cartTotal)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Descrição</label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                placeholder={type === 'receita' ? "Ex: Venda de Produtos" : "Ex: Compra de Mercadorias / Entrada de Stock"}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Método de Pagamento</label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Numerário">Numerário</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="E-mola">E-mola</option>
                <option value="Transferência Bancária">Transferência Bancária</option>
                <option value="Cartão">Cartão</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Status de Pagamento</label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'pago' | 'pendente')}
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
            <div className="space-y-2 lg:col-span-4">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Valor Total (MZN)</label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim font-bold text-primary"
                placeholder="0,00"
                type="number"
                step="0.01"
                value={cartItems.length > 0 ? cartTotal : value}
                onChange={(e) => setValue(e.target.value)}
                required={cartItems.length === 0}
                disabled={cartItems.length > 0 || (quantity !== '' && itemUnitPrice !== '')}
              />
            </div>
          </div>

          <div className="flex gap-2 w-full justify-end pt-4 border-t border-outline-variant/10">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-full md:w-auto bg-surface-variant text-on-surface-variant px-6 py-3 rounded-lg font-bold text-sm hover:bg-outline-variant transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" className="w-full md:w-auto bg-primary text-on-primary px-8 py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors">
              {editingId ? 'Atualizar' : 'Confirmar Lançamento'}
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
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recibo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Data</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Itens/Produto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Qtd</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 print:divide-outline-variant/20">
              {transactions.map((t) => {
                const isMultiItem = t.items && t.items.length > 0;
                const product = !isMultiItem && t.productId ? products.find(p => p.id === t.productId) : null;
                const customer = t.customerId ? customers.find(c => c.id === t.customerId) : null;
                const supplier = t.supplierId ? suppliers.find(s => s.id === t.supplierId) : null;
                
                return (
                <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors group print:hover:bg-transparent">
                  <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                    {t.receiptNumber ? String(t.receiptNumber).padStart(3, '0') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{formatDate(t.date)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">
                    {t.description}
                    <div className="text-xs font-normal text-on-surface-variant mt-1">
                      {t.category} 
                      {customer && ` • Cliente: ${customer.name}`}
                      {supplier && ` • Fornecedor: ${supplier.name}`}
                    </div>
                    {(t.paymentMethod || t.paymentStatus) && (
                      <div className="text-xs font-normal text-on-surface-variant mt-1 flex gap-2 items-center">
                        {t.paymentMethod && <span className="bg-surface-container px-2 py-0.5 rounded-md">{t.paymentMethod}</span>}
                        {t.paymentStatus && (
                          <span className={`px-2 py-0.5 rounded-md font-bold ${t.paymentStatus === 'pago' ? 'bg-secondary-container/50 text-secondary' : 'bg-error-container/50 text-error'}`}>
                            {t.paymentStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {isMultiItem ? `${t.items!.length} itens` : (product ? product.name : '-')}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-mono">
                    {isMultiItem ? t.items!.reduce((acc, i) => acc + i.quantity, 0) : (t.quantity || '-')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full print:border print:border-outline-variant/20 print:bg-transparent print:text-on-surface ${t.type === 'receita' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-headline font-bold print:text-on-surface ${t.type === 'receita' ? 'text-secondary' : 'text-error'}`}>
                    {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.value)}
                  </td>
                  <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedReceiptTransaction(t)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary-container/20 transition-all" title="Ver Recibo">
                        <span className="material-symbols-outlined text-lg">receipt_long</span>
                      </button>
                      <button onClick={() => handleEdit(t)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all" title="Editar">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteTransaction(t.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all" title="Excluir">
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
      
      <ReceiptModal 
        isOpen={!!selectedReceiptTransaction} 
        onClose={() => setSelectedReceiptTransaction(null)} 
        transaction={selectedReceiptTransaction} 
      />
    </div>
  );
};

export default Transactions;
