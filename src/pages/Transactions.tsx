import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TransactionType, Transaction, TransactionItem } from '../types';
import ReceiptModal from '../components/ReceiptModal';
import PrintHeader from '../components/PrintHeader';
import { useTranslation } from 'react-i18next';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, products, customers, suppliers, globalSearchTerm } = useAppContext();
  const { t } = useTranslation();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<TransactionType>('receita');
  const [category, setCategory] = useState('Operacional');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    receipt: true,
    date: true,
    description: true,
    items: true,
    quantity: true,
    type: true,
    value: true,
    actions: true
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };
  
  // For single product (legacy)
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState('');
  const [itemTotal, setItemTotal] = useState('');
  const [usePurchaseUnit, setUsePurchaseUnit] = useState(false);
  
  const selectedProduct = products.find(p => p.id === productId);

  // For multiple items
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [cartItems, setCartItems] = useState<TransactionItem[]>([]);
  const [selectedReceiptTransaction, setSelectedReceiptTransaction] = useState<Transaction | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Numerário');
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente'>('pago');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Calculate total for cart
  const cartTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Calculate item total for cart
  useEffect(() => {
    if (quantity && itemUnitPrice) {
      const q = parseFloat(quantity);
      const p = parseFloat(itemUnitPrice);
      if (!isNaN(q) && !isNaN(p)) {
        setItemTotal((q * p).toFixed(2));
      }
    } else {
      setItemTotal('');
    }
  }, [quantity, itemUnitPrice]);

  // Calculate total for single item if not using cart
  useEffect(() => {
    if (cartItems.length === 0 && itemTotal) {
      setValue(itemTotal);
    }
  }, [itemTotal, cartItems.length]);

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
    if (t.productId && t.quantity && t.unitPrice) {
      setItemTotal((t.quantity * t.unitPrice).toFixed(2));
    } else {
      setItemTotal('');
    }
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
    setItemTotal('');
    setUsePurchaseUnit(false);
  };

  const handleAddToCart = () => {
    if (!productId || !quantity || !itemUnitPrice) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const qty = parseFloat(quantity);
    if (qty <= 0) return;

    const factor = usePurchaseUnit ? (product.conversionFactor || 1) : 1;
    const finalQty = qty * factor;
    const finalUnitPrice = parseFloat(itemUnitPrice) / factor;

    if (type === 'receita' && product.stock < finalQty) {
      alert(`Quantidade solicitada (${finalQty} ${product.unit || 'un'}) é maior que o stock disponível (${product.stock} ${product.unit || 'un'}).`);
      return;
    }

    const unitPrice = parseFloat(itemUnitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) return;

    const newItem: TransactionItem = {
      productId: product.id,
      name: product.name,
      quantity: finalQty,
      unitPrice: finalUnitPrice,
      subtotal: parseFloat(itemTotal),
      unit: product.unit || 'un'
    };

    setCartItems([...cartItems, newItem]);
    setProductId('');
    setQuantity('');
    setItemUnitPrice('');
    setItemTotal('');
    setUsePurchaseUnit(false);
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
        const qty = parseFloat(quantity);
        if (qty > product.stock) {
          alert(`Não é possível realizar a venda: Quantidade solicitada (${qty} ${product.unit || 'un'}) é maior que o stock disponível (${product.stock} ${product.unit || 'un'}).`);
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
      transactionData.unit = null;
    } else {
      if (productId && quantity) {
        const product = products.find(p => p.id === productId);
        const factor = usePurchaseUnit ? (product?.conversionFactor || 1) : 1;
        const finalQty = parseFloat(quantity) * factor;
        const finalUnitPrice = (itemUnitPrice ? parseFloat(itemUnitPrice) : 0) / factor;

        transactionData.productId = productId;
        transactionData.quantity = finalQty;
        transactionData.unitPrice = finalUnitPrice;
        transactionData.unit = product?.unit || 'un';
      } else {
        transactionData.productId = null;
        transactionData.quantity = null;
        transactionData.unitPrice = null;
        transactionData.unit = null;
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
    setItemTotal('');
    setUsePurchaseUnit(false);
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

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterDateStart && new Date(t.date) < new Date(filterDateStart)) return false;
    if (filterDateEnd && new Date(t.date) > new Date(filterDateEnd + 'T23:59:59')) return false;
    
    const term = (localSearchTerm || globalSearchTerm).toLowerCase();
    if (term) {
      const matchDescription = t.description.toLowerCase().includes(term);
      const matchCategory = t.category.toLowerCase().includes(term);
      const matchCustomer = t.customerId ? customers.find(c => c.id === t.customerId)?.name.toLowerCase().includes(term) : false;
      const matchSupplier = t.supplierId ? suppliers.find(s => s.id === t.supplierId)?.name.toLowerCase().includes(term) : false;
      
      if (!matchDescription && !matchCategory && !matchCustomer && !matchSupplier) return false;
    }
    
    return true;
  });

  const displayedTransactions = showAllTransactions 
    ? filteredTransactions 
    : filteredTransactions.slice(0, 10);

  const totalReceitas = filteredTransactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
  const totalDespesas = filteredTransactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);
  const saldoPrevisto = totalReceitas - totalDespesas;

  const setQuickFilter = (filter: 'hoje' | 'semana' | 'mes' | 'ano' | 'todos') => {
    const now = new Date();
    
    if (filter === 'todos') {
      setFilterDateStart('');
      setFilterDateEnd('');
      return;
    }

    const endStr = now.toISOString().split('T')[0];
    setFilterDateEnd(endStr);

    if (filter === 'hoje') {
      setFilterDateStart(endStr);
    } else if (filter === 'semana') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      setFilterDateStart(startOfWeek.toISOString().split('T')[0]);
    } else if (filter === 'mes') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilterDateStart(startOfMonth.toISOString().split('T')[0]);
    } else if (filter === 'ano') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setFilterDateStart(startOfYear.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      <PrintHeader />
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{t('sidebar.transactions')}</h2>
        <p className="text-sm text-slate-600 mt-2">Período: {filterDateStart ? new Date(filterDateStart).toLocaleDateString('pt-MZ') : 'Início'} a {filterDateEnd ? new Date(filterDateEnd).toLocaleDateString('pt-MZ') : 'Hoje'}</p>
      </div>

      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">{t('sidebar.transactions')}</h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie suas movimentações financeiras com precisão.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
            {(['hoje', 'semana', 'mes', 'ano', 'todos'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setQuickFilter(filter)}
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors text-on-surface-variant hover:bg-surface-variant/50`}
              >
                {filter === 'hoje' ? t('common.today') :
                 filter === 'semana' ? t('common.week') :
                 filter === 'mes' ? t('common.month') :
                 filter === 'ano' ? t('common.year') : t('common.all')}
              </button>
            ))}
          </div>
          <button 
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            {t('dashboard.print')}
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2.5 ${showFilters ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-primary border border-outline-variant/20'} rounded-lg font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-colors`}
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filtros Avançados
          </button>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-5 py-2.5 bg-secondary text-on-secondary rounded-lg font-bold text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            {t('header.newTransaction')}
          </button>
        </div>
      </section>

      {/* Advanced Filters Section */}
      {showFilters && (
        <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 print:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Filtros Avançados</h3>
            <button 
              onClick={() => {
                setFilterType('all');
                setFilterCategory('all');
                setFilterDateStart('');
                setFilterDateEnd('');
              }}
              className="text-xs font-bold text-primary hover:underline"
            >
              Limpar Filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
                className="w-full mt-1 bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              >
                <option value="all">Todos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full mt-1 bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              >
                <option value="all">Todas</option>
                <option value="Operacional">Operacional</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Vendas">Vendas</option>
                <option value="Impostos">Impostos</option>
                <option value="Salário">Salário</option>
                <option value="Assistência Médica">Assistência Médica</option>
                <option value="Água">Água</option>
                <option value="Energia">Energia</option>
                <option value="Renda">Renda</option>
                <option value="Combustível">Combustível</option>
                <option value="Outras Despesas">Outras Despesas</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">Data Inicial</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="w-full mt-1 bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">Data Final</label>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="w-full mt-1 bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              />
            </div>
          </div>
        </section>
      )}

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
                <option value="Salário">Salário</option>
                <option value="Assistência Médica">Assistência Médica</option>
                <option value="Infraestrutura">Infraestrutura</option>
                <option value="Água">Água</option>
                <option value="Energia">Energia</option>
                <option value="Renda">Renda</option>
                <option value="Combustível">Combustível</option>
                <option value="Estado">Estado (Impostos)</option>
                <option value="Serviços">Serviços</option>
                <option value="SaaS">SaaS</option>
                <option value="Produto">Produto</option>
                <option value="Outras Despesas">Outras Despesas</option>
              </select>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 space-y-4">
            <h4 className="text-sm font-bold text-primary">
              {type === 'receita' ? 'Produtos a Vender (Opcional)' : 'Produtos para Entrada de Stock (Opcional)'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="space-y-2 md:col-span-3">
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
                    setUsePurchaseUnit(false);
                  }}
                >
                  <option value="">Selecione um produto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} | {formatCurrency(type === 'receita' ? p.price : p.cost)})</option>
                  ))}
                </select>
                {selectedProduct?.purchaseUnit && selectedProduct.purchaseUnit !== selectedProduct.unit && (
                  <p className="text-[10px] font-bold text-on-surface-variant ml-1 mt-1">
                    Regra: 1 {selectedProduct.purchaseUnit} = {selectedProduct.conversionFactor} {selectedProduct.unit}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1 flex justify-between items-center">
                  <span>Qtd {selectedProduct && <span className="text-primary font-black">({usePurchaseUnit ? selectedProduct.purchaseUnit : selectedProduct.unit || 'un'})</span>}</span>
                  {selectedProduct?.purchaseUnit && selectedProduct.purchaseUnit !== selectedProduct.unit && (
                    <button 
                      type="button"
                      onClick={() => setUsePurchaseUnit(!usePurchaseUnit)}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-all font-black ${usePurchaseUnit ? 'bg-primary text-on-primary shadow-sm' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    >
                      {usePurchaseUnit ? 'Usando Compra' : 'Usar Compra'}
                    </button>
                  )}
                </label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="0"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                  }}
                  disabled={!productId}
                />
                {usePurchaseUnit && selectedProduct && quantity && (
                  <p className="text-[10px] font-bold text-primary ml-1">
                    = {(parseFloat(quantity) * (selectedProduct.conversionFactor || 1)).toFixed(2)} {selectedProduct.unit}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">Preço {usePurchaseUnit ? 'da Un. Compra' : 'Unit.'}</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) => {
                    setItemUnitPrice(e.target.value);
                  }}
                  disabled={!productId}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">Total Item</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim font-bold text-secondary"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemTotal}
                  onChange={(e) => {
                    const newTotal = e.target.value;
                    setItemTotal(newTotal);
                    const total = parseFloat(newTotal);
                    if (!isNaN(total) && total > 0) {
                      const p = parseFloat(itemUnitPrice);
                      const q = parseFloat(quantity);
                      if (!isNaN(p) && p > 0) {
                        setQuantity((total / p).toFixed(2));
                      } else if (!isNaN(q) && q > 0) {
                        setItemUnitPrice((total / q).toFixed(2));
                      }
                    }
                  }}
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
                        <td className="px-4 py-2 text-center">{item.quantity} {item.unit || 'un'}</td>
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
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-headline font-bold text-lg text-primary">Histórico de Movimentações</h3>
          <div className="flex items-center gap-4 w-full md:w-auto print:hidden">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder="Buscar transações..."
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container px-3 py-2 rounded-lg text-sm font-bold text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">view_column</span>
                <span className="hidden sm:inline">Colunas</span>
              </button>
              
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-10 py-2">
                  <div className="px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 mb-2">
                    Mostrar Colunas
                  </div>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.receipt} onChange={() => toggleColumn('receipt')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Recibo</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.date} onChange={() => toggleColumn('date')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Data</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.description} onChange={() => toggleColumn('description')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Descrição</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.items} onChange={() => toggleColumn('items')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Itens/Produto</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.quantity} onChange={() => toggleColumn('quantity')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Qtd</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.type} onChange={() => toggleColumn('type')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Tipo</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.value} onChange={() => toggleColumn('value')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Valor Total</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.actions} onChange={() => toggleColumn('actions')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Ações</span>
                  </label>
                </div>
              )}
            </div>
            
            <span className="text-xs text-on-surface-variant whitespace-nowrap hidden sm:inline">Mostrando {filteredTransactions.length > 0 ? 1 : 0}-{filteredTransactions.length} de {filteredTransactions.length} lançamentos</span>
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
                {visibleColumns.receipt && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recibo</th>}
                {visibleColumns.date && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Data</th>}
                {visibleColumns.description && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Descrição</th>}
                {visibleColumns.items && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Itens/Produto</th>}
                {visibleColumns.quantity && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Qtd</th>}
                {visibleColumns.type && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>}
                {visibleColumns.value && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor Total</th>}
                {visibleColumns.actions && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 print:divide-outline-variant/20">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((t) => {
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
                    {isMultiItem 
                      ? t.items!.reduce((acc, i) => acc + i.quantity, 0) 
                      : (t.quantity ? `${t.quantity} ${t.unit || 'un'}` : '-')}
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
              );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length > 10 && (
          <div className="p-6 bg-surface-container-low/20 flex justify-center print:hidden">
            <button 
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
            >
              {showAllTransactions ? 'Ver menos lançamentos' : 'Ver todos os lançamentos'}
              <span className={`material-symbols-outlined text-sm transition-transform ${showAllTransactions ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
          </div>
        )}
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
