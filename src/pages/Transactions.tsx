import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TransactionType, Transaction, TransactionItem, getCategoryTranslationKey } from '../types';
import ReceiptModal from '../components/ReceiptModal';
import PrintHeader from '../components/PrintHeader';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { exportToCSV } from '../lib/exportUtils';

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
    iva: true,
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
  const [ivaRate, setIvaRate] = useState<number>(0);
  const [ivaAmount, setIvaAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Calculate total for cart
  const cartTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Calculate IVA
  useEffect(() => {
    if (cartItems.length > 0) {
      setIvaAmount(cartTotal * (ivaRate / 100));
    } else {
      const totalValue = parseFloat(value) || 0;
      if (ivaRate > 0 && totalValue > 0) {
        const base = totalValue / (1 + ivaRate / 100);
        setIvaAmount(totalValue - base);
      } else {
        setIvaAmount(0);
      }
    }
  }, [cartTotal, value, ivaRate, cartItems.length]);

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
      const baseValue = parseFloat(itemTotal) || 0;
      const totalValue = baseValue * (1 + ivaRate / 100);
      setValue(totalValue.toFixed(2));
    }
  }, [itemTotal, cartItems.length, ivaRate]);

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
    setIvaRate(t.ivaRate || 0);
    setIvaAmount(t.ivaAmount || 0);
    setDiscount(t.discount?.toString() || '');
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
    setIvaRate(0);
    setIvaAmount(0);
    setDiscount('');
    setCartItems([]);
    setItemTotal('');
    setUsePurchaseUnit(false);
    setAmountPaid('');
    setChange(0);
  };

  useEffect(() => {
    const parsedDiscount = parseFloat(discount) || 0;
    const total = cartItems.length > 0 ? (cartTotal + ivaAmount - parsedDiscount) : (parseFloat(value) || 0);
    const paid = parseFloat(amountPaid) || 0;
    if (paid >= total) {
      setChange(paid - total);
    } else {
      setChange(0);
    }
  }, [amountPaid, cartTotal, ivaAmount, value, discount, cartItems.length]);

  const handleAddToCart = () => {
    if (!productId || !quantity || !itemUnitPrice) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const qty = parseFloat(quantity);
    if (qty <= 0) return;

    const factor = usePurchaseUnit ? (product.conversionFactor || 1) : 1;
    const finalQty = qty * factor;
    const finalUnitPrice = parseFloat(itemUnitPrice) / factor;

    let availableStock = product.stock;
    if (editingId) {
      const oldT = transactions.find(t => t.id === editingId);
      if (oldT) {
        let oldQty = 0;
        if (oldT.productId === productId) {
          oldQty = oldT.quantity || 0;
        } else if (oldT.items) {
          const oldItem = oldT.items.find((i: any) => i.productId === productId);
          if (oldItem) oldQty = oldItem.quantity;
        }
        if (oldT.type === 'receita') availableStock += oldQty;
        else if (oldT.type === 'despesa') availableStock -= oldQty;
      }
    }

    const existingQtyInCart = cartItems
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (type === 'receita' && availableStock < (finalQty + existingQtyInCart)) {
      toast.error(t('transactions.errors.stockExceeded', { qty: finalQty + existingQtyInCart, stock: availableStock, unit: product.unit || 'un' }));
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
        let availableStock = product.stock;
        if (editingId) {
          const oldT = transactions.find(t => t.id === editingId);
          if (oldT) {
            let oldQty = 0;
            if (oldT.productId === productId) {
              oldQty = oldT.quantity || 0;
            } else if (oldT.items) {
              const oldItem = oldT.items.find((i: any) => i.productId === productId);
              if (oldItem) oldQty = oldItem.quantity;
            }
            if (oldT.type === 'receita') availableStock += oldQty;
            else if (oldT.type === 'despesa') availableStock -= oldQty;
          }
        }
        
        const factor = usePurchaseUnit ? (product?.conversionFactor || 1) : 1;
        const qty = parseFloat(quantity) * factor;
        if (qty > availableStock) {
          toast.error(t('transactions.errors.stockExceeded', { qty, stock: availableStock, unit: product.unit || 'un' }));
          return;
        }
      }
    }

    // Validate cart items stock for revenue
    if (type === 'receita' && cartItems.length > 0) {
      const productTotals: Record<string, number> = {};
      for (const item of cartItems) {
        productTotals[item.productId] = (productTotals[item.productId] || 0) + item.quantity;
      }

      for (const [pId, totalQty] of Object.entries(productTotals)) {
        const product = products.find(p => p.id === pId);
        if (product) {
          let availableStock = product.stock;
          if (editingId) {
            const oldT = transactions.find(t => t.id === editingId);
            if (oldT) {
              let oldQty = 0;
              if (oldT.productId === pId) {
                oldQty = oldT.quantity || 0;
              } else if (oldT.items) {
                const oldItem = oldT.items.find((i: any) => i.productId === pId);
                if (oldItem) oldQty = oldItem.quantity;
              }
              if (oldT.type === 'receita') availableStock += oldQty;
              else if (oldT.type === 'despesa') availableStock -= oldQty;
            }
          }
          
          if (totalQty > availableStock) {
            toast.error(t('transactions.errors.stockExceededTotal', { name: product.name, qty: totalQty, stock: availableStock, unit: product.unit || 'un' }));
            return;
          }
        }
      }
    }

    const parsedDiscount = parseFloat(discount) || 0;
    const parsedValue = isMultiItem ? (cartTotal + ivaAmount - parsedDiscount) : parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      toast.error(t('transactions.errors.invalidValue'));
      return;
    }

    const transactionData: any = {
      description,
      value: parsedValue,
      type,
      category,
      paymentMethod,
      paymentStatus,
      ivaRate,
      ivaAmount,
      discount: parsedDiscount,
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
    setIvaRate(0);
    setIvaAmount(0);
    setDiscount('');
    setCartItems([]);
    setItemTotal('');
    setUsePurchaseUnit(false);
    setAmountPaid('');
    setChange(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: t('common.currency', 'MZN'),
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(t('common.locale', 'pt-MZ'), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  
  const filteredTransactions = transactions.filter(t => {
    const urlFilter = searchParams.get('filter');
    
    if (urlFilter === 'receber' && (t.type !== 'receita' || t.paymentStatus !== 'pendente')) return false;
    if (urlFilter === 'pagar' && (t.type !== 'despesa' || t.paymentStatus !== 'pendente')) return false;

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

  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      ID: t.id,
      Data: new Date(t.date).toLocaleDateString(t('common.locale', 'pt-MZ')),
      Descricao: t.description,
      Categoria: t.category,
      Tipo: t.type,
      Valor: t.value,
      Cliente: customers.find(c => c.id === t.customerId)?.name || '',
      Fornecedor: suppliers.find(s => s.id === t.supplierId)?.name || '',
      MetodoPagamento: t.paymentMethod || '',
      Status: t.paymentStatus || ''
    }));
    exportToCSV(exportData, 'transacoes.csv');
  };

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
        <p className="text-sm text-slate-600 mt-2">{t('statement.period', 'Período')}: {filterDateStart ? new Date(filterDateStart).toLocaleDateString(t('common.locale', 'pt-MZ')) : t('statement.start', 'Início')} {t('statement.to', 'a')} {filterDateEnd ? new Date(filterDateEnd).toLocaleDateString(t('common.locale', 'pt-MZ')) : t('statement.today', 'Hoje')}</p>
      </div>

      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">{t('sidebar.transactions')}</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-on-surface-variant font-medium">{t('transactions.subtitle', 'Gerencie suas movimentações financeiras com precisão.')}</p>
            {searchParams.get('filter') && (
              <button 
                onClick={() => {
                  window.history.replaceState({}, '', '/transacoes');
                  setSearchParams(new URLSearchParams());
                }}
                className="text-xs font-bold bg-error-container text-on-error-container px-2 py-1 rounded-full flex items-center gap-1 hover:bg-error hover:text-on-error transition-colors"
              >
                Limpar Filtro
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
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
            onClick={handleExport}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar CSV
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2.5 ${showFilters ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-primary border border-outline-variant/20'} rounded-lg font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-colors`}
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            {t('transactions.advancedFilters', 'Filtros Avançados')}
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
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">{t('transactions.advancedFilters')}</h3>
            <button 
              onClick={() => {
                setFilterType('all');
                setFilterCategory('all');
                setFilterDateStart('');
                setFilterDateEnd('');
              }}
              className="text-xs font-bold text-primary hover:underline"
            >
              {t('transactions.clearFilters')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.type')}</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
                className="w-full mt-1 bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              >
                <option value="all">{t('transactions.all')}</option>
                <option value="receita">{t('transactions.revenue')}</option>
                <option value="despesa">{t('transactions.expense')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.category')}</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full mt-1 bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              >
                <option value="all">{t('transactions.allCategories')}</option>
                <option value="Operacional">{t('transactions.categories.operational')}</option>
                <option value="Marketing">{t('transactions.categories.marketing')}</option>
                <option value="Pessoal">{t('transactions.categories.personnel')}</option>
                <option value="Salário">{t('transactions.categories.salary')}</option>
                <option value="Assistência Médica">{t('transactions.categories.medicalAssistance')}</option>
                <option value="Infraestrutura">{t('transactions.categories.infrastructure')}</option>
                <option value="Água">{t('transactions.categories.water')}</option>
                <option value="Energia">{t('transactions.categories.energy')}</option>
                <option value="Renda">{t('transactions.categories.rent')}</option>
                <option value="Combustível">{t('transactions.categories.fuel')}</option>
                <option value="Estado">{t('transactions.categories.stateTaxes')}</option>
                <option value="Serviços">{t('transactions.categories.services')}</option>
                <option value="SaaS">{t('transactions.categories.saas')}</option>
                <option value="Produto">{t('transactions.categories.product')}</option>
                <option value="Outras Despesas">{t('transactions.categories.otherExpenses')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.startDate')}</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="w-full mt-1 bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.endDate')}</label>
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
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">{t('transactions.quickEntry')}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 items-end">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.type')}</label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim appearance-none"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TransactionType);
                  setCartItems([]);
                }}
              >
                <option value="receita">{t('transactions.revenueSale')}</option>
                <option value="despesa">{t('transactions.expensePurchase')}</option>
              </select>
            </div>
            
            {type === 'receita' ? (
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.customerOptional')}</label>
                <select
                  className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">{t('transactions.finalConsumer')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.supplierOptional')}</label>
                <select
                  className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">{t('transactions.diverseSupplier')}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2 lg:col-span-3">
              <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.category')}</label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Operacional">{t('transactions.categories.operational')}</option>
                <option value="Marketing">{t('transactions.categories.marketing')}</option>
                <option value="Pessoal">{t('transactions.categories.personnel')}</option>
                <option value="Salário">{t('transactions.categories.salary')}</option>
                <option value="Assistência Médica">{t('transactions.categories.medicalAssistance')}</option>
                <option value="Infraestrutura">{t('transactions.categories.infrastructure')}</option>
                <option value="Água">{t('transactions.categories.water')}</option>
                <option value="Energia">{t('transactions.categories.energy')}</option>
                <option value="Renda">{t('transactions.categories.rent')}</option>
                <option value="Combustível">{t('transactions.categories.fuel')}</option>
                <option value="Estado">{t('transactions.categories.stateTaxes')}</option>
                <option value="Serviços">{t('transactions.categories.services')}</option>
                <option value="SaaS">{t('transactions.categories.saas')}</option>
                <option value="Produto">{t('transactions.categories.product')}</option>
                <option value="Outras Despesas">{t('transactions.categories.otherExpenses')}</option>
              </select>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 space-y-4">
            <h4 className="text-sm font-bold text-primary">
              {type === 'receita' ? t('transactions.productsToSell') : t('transactions.productsToStock')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.product')}</label>
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
                  <option value="">{t('transactions.selectProduct')}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({t('transactions.stock')}: {p.stock} | {formatCurrency(type === 'receita' ? p.price : p.cost)})</option>
                  ))}
                </select>
                {selectedProduct?.purchaseUnit && selectedProduct.purchaseUnit !== selectedProduct.unit && (
                  <p className="text-[10px] font-bold text-on-surface-variant ml-1 mt-1">
                    {t('transactions.rule')}: 1 {selectedProduct.purchaseUnit} = {selectedProduct.conversionFactor} {selectedProduct.unit}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1 flex justify-between items-center">
                  <span>{t('transactions.qty')} {selectedProduct && <span className="text-primary font-black">({usePurchaseUnit ? selectedProduct.purchaseUnit : selectedProduct.unit || 'un'})</span>}</span>
                  {selectedProduct?.purchaseUnit && selectedProduct.purchaseUnit !== selectedProduct.unit && (
                    <button 
                      type="button"
                      onClick={() => setUsePurchaseUnit(!usePurchaseUnit)}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-all font-black ${usePurchaseUnit ? 'bg-primary text-on-primary shadow-sm' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    >
                      {usePurchaseUnit ? t('transactions.usingPurchase') : t('transactions.usePurchase')}
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
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.price')} {usePurchaseUnit ? t('transactions.ofPurchaseUnit') : t('transactions.unit')}</label>
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
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.itemTotal')}</label>
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
                  {t('transactions.addItem')}
                </button>
              </div>
            </div>

            {cartItems.length > 0 && (
              <div className="mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low">
                    <tr>
                      <th className="px-4 py-2 rounded-tl-lg">{t('transactions.product')}</th>
                      <th className="px-4 py-2 text-center">{t('transactions.qty')}</th>
                      <th className="px-4 py-2 text-right">{t('transactions.unitPrice')}</th>
                      <th className="px-4 py-2 text-right">{t('transactions.subtotal')}</th>
                      <th className="px-4 py-2 rounded-tr-lg text-center">{t('transactions.action')}</th>
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
                      <td colSpan={3} className="px-4 py-3 text-right font-bold">{t('transactions.total')}:</td>
                      <td className="px-4 py-3 text-right font-black text-lg text-secondary">{formatCurrency(cartTotal)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold">Desconto:</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="w-24 text-right bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary outline-none"
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold">Total Final:</td>
                      <td className="px-4 py-3 text-right font-black text-xl text-primary">{formatCurrency(cartTotal + ivaAmount - (parseFloat(discount) || 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.description')}</label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                placeholder={type === 'receita' ? t('transactions.revenuePlaceholder') : t('transactions.expensePlaceholder')}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">
                {type === 'receita' ? t('transactions.ivaLiquidado', 'IVA Liquidado (%)') : t('transactions.ivaDedutivel', 'IVA Dedutível (%)')}
              </label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                value={ivaRate}
                onChange={(e) => setIvaRate(Number(e.target.value))}
              >
                <option value={0}>0%</option>
                <option value={16}>16%</option>
                <option value={17}>17%</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">
                {t('transactions.ivaAmount', 'Valor do IVA (MZN)')}
              </label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim bg-surface-variant/50"
                type="number"
                value={ivaAmount.toFixed(2)}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              {t('transactions.paymentDetails', 'Detalhes de Pagamento')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.paymentMethod')}</label>
                <select
                  className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Numerário">{t('transactions.cash')}</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="E-mola">E-mola</option>
                  <option value="Transferência Bancária">{t('transactions.bankTransfer')}</option>
                  <option value="Cartão">{t('transactions.card')}</option>
                  <option value="Cheque">{t('transactions.cheque')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.paymentStatus')}</label>
                <select
                  className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as 'pago' | 'pendente')}
                >
                  <option value="pago">{t('transactions.paid')}</option>
                  <option value="pendente">{t('transactions.pending')}</option>
                </select>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.totalValueMZN')}</label>
                <input
                  className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim font-bold text-primary"
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  value={cartItems.length > 0 ? (cartTotal + ivaAmount - (parseFloat(discount) || 0)).toFixed(2) : value}
                  onChange={(e) => setValue(e.target.value)}
                  required={cartItems.length === 0}
                  disabled={cartItems.length > 0 || (quantity !== '' && itemUnitPrice !== '')}
                />
              </div>
              {cartItems.length === 0 && (
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant ml-1">Desconto</label>
                  <input
                    className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              )}

              {paymentMethod === 'Numerário' && paymentStatus === 'pago' && type === 'receita' && (
                <>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.amountPaid', 'Valor Pago (MZN)')}</label>
                    <input
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                      placeholder="0,00"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">{t('transactions.change', 'Troco (MZN)')}</label>
                    <input
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim font-bold text-secondary bg-surface-variant/50"
                      type="number"
                      value={change.toFixed(2)}
                      readOnly
                      disabled
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full justify-end pt-4 border-t border-outline-variant/10">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-full md:w-auto bg-surface-variant text-on-surface-variant px-6 py-3 rounded-lg font-bold text-sm hover:bg-outline-variant transition-colors">
                {t('transactions.cancel')}
              </button>
            )}
            <button type="submit" className="w-full md:w-auto bg-primary text-on-primary px-8 py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors">
              {editingId ? t('transactions.update') : t('transactions.confirmEntry')}
            </button>
          </div>
        </form>
      </section>

      {/* Transactions Table Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden print:shadow-none print:border print:border-outline-variant/20">
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-headline font-bold text-lg text-primary">{t('transactions.transactionHistory')}</h3>
          <div className="flex items-center gap-4 w-full md:w-auto print:hidden">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder={t('transactions.searchTransactions')}
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
                <span className="hidden sm:inline">{t('transactions.columns')}</span>
              </button>
              
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-10 py-2">
                  <div className="px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 mb-2">
                    {t('transactions.showColumns')}
                  </div>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.receipt} onChange={() => toggleColumn('receipt')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.receipt')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.date} onChange={() => toggleColumn('date')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.date')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.description} onChange={() => toggleColumn('description')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.description')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.items} onChange={() => toggleColumn('items')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.itemsProduct')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.quantity} onChange={() => toggleColumn('quantity')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.qty')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.type} onChange={() => toggleColumn('type')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.type')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.iva} onChange={() => toggleColumn('iva')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">IVA</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.value} onChange={() => toggleColumn('value')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.totalValue')}</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.actions} onChange={() => toggleColumn('actions')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{t('transactions.actions')}</span>
                  </label>
                </div>
              )}
            </div>
            
            <span className="text-xs text-on-surface-variant whitespace-nowrap hidden sm:inline">{t('transactions.showing')} {filteredTransactions.length > 0 ? 1 : 0}-{filteredTransactions.length} {t('transactions.of')} {filteredTransactions.length} {t('transactions.entries')}</span>
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
                {visibleColumns.receipt && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('transactions.receipt')}</th>}
                {visibleColumns.date && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('transactions.date')}</th>}
                {visibleColumns.description && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('transactions.description')}</th>}
                {visibleColumns.items && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('transactions.itemsProduct')}</th>}
                {visibleColumns.quantity && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">{t('transactions.qty')}</th>}
                {visibleColumns.type && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('transactions.type')}</th>}
                {visibleColumns.iva && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">IVA</th>}
                {visibleColumns.value && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Desconto</th>}
                {visibleColumns.value && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">{t('transactions.totalValue')}</th>}
                {visibleColumns.actions && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">{t('transactions.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 print:divide-outline-variant/20">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                    {t('transactions.noTransactionsFound')}
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((transaction) => {
                  const isMultiItem = transaction.items && transaction.items.length > 0;
                  const product = !isMultiItem && transaction.productId ? products.find(p => p.id === transaction.productId) : null;
                  const customer = transaction.customerId ? customers.find(c => c.id === transaction.customerId) : null;
                  const supplier = transaction.supplierId ? suppliers.find(s => s.id === transaction.supplierId) : null;
                  
                  return (
                  <tr key={transaction.id} className="hover:bg-surface-container-low/30 transition-colors group print:hover:bg-transparent">
                  {visibleColumns.receipt && (
                    <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                      {transaction.receiptNumber ? String(transaction.receiptNumber).padStart(3, '0') : '-'}
                    </td>
                  )}
                  {visibleColumns.date && (
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{formatDate(transaction.date)}</td>
                  )}
                  {visibleColumns.description && (
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      {transaction.description}
                      <div className="text-xs font-normal text-on-surface-variant mt-1">
                        {t(`transactions.categories.${getCategoryTranslationKey(transaction.category)}`, transaction.category)} 
                        {customer && ` • ${t('transactions.customerOptional').replace(' (Opcional)', '')}: ${customer.name}`}
                        {supplier && ` • ${t('transactions.supplierOptional').replace(' (Opcional)', '')}: ${supplier.name}`}
                      </div>
                      {(transaction.paymentMethod || transaction.paymentStatus) && (
                        <div className="text-xs font-normal text-on-surface-variant mt-1 flex gap-2 items-center">
                          {transaction.paymentMethod && <span className="bg-surface-container px-2 py-0.5 rounded-md">{transaction.paymentMethod}</span>}
                          {transaction.paymentStatus && (
                            <span className={`px-2 py-0.5 rounded-md font-bold ${transaction.paymentStatus === 'pago' ? 'bg-secondary-container/50 text-secondary' : 'bg-error-container/50 text-error'}`}>
                              {transaction.paymentStatus.toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                  {visibleColumns.items && (
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {isMultiItem ? `${transaction.items!.length} ${t('transactions.itemsProduct').split('/')[0].toLowerCase()}` : (product ? product.name : '-')}
                    </td>
                  )}
                  {visibleColumns.quantity && (
                    <td className="px-6 py-4 text-sm text-center font-mono">
                      {isMultiItem 
                        ? transaction.items!.reduce((acc, i) => acc + i.quantity, 0) 
                        : (transaction.quantity ? `${transaction.quantity} ${transaction.unit || 'un'}` : '-')}
                    </td>
                  )}
                  {visibleColumns.type && (
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full print:border print:border-outline-variant/20 print:bg-transparent print:text-on-surface ${transaction.type === 'receita' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                        {transaction.type === 'receita' ? t('transactions.revenueSale').split(' ')[0] : t('transactions.expensePurchase').split(' ')[0]}
                      </span>
                    </td>
                  )}
                  {visibleColumns.iva && (
                    <td className="px-6 py-4 text-sm text-right font-mono text-on-surface-variant">
                      {transaction.ivaAmount ? formatCurrency(transaction.ivaAmount) : '-'}
                      {transaction.ivaRate ? <span className="text-[10px] ml-1 opacity-70">({transaction.ivaRate}%)</span> : null}
                    </td>
                  )}
                  {visibleColumns.value && (
                    <td className="px-6 py-4 text-sm text-right font-mono text-on-surface-variant">
                      {transaction.discount ? formatCurrency(transaction.discount) : '-'}
                    </td>
                  )}
                  {visibleColumns.value && (
                    <td className={`px-6 py-4 text-right font-headline font-bold print:text-on-surface ${transaction.type === 'receita' ? 'text-secondary' : 'text-error'}`}>
                      {transaction.type === 'receita' ? '+' : '-'} {formatCurrency(transaction.value)}
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedReceiptTransaction(transaction)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary-container/20 transition-all" title={t('transactions.viewReceipt')}>
                          <span className="material-symbols-outlined text-lg">receipt_long</span>
                        </button>
                        <button onClick={() => handleEdit(transaction)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all" title={t('transactions.edit')}>
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => deleteTransaction(transaction.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all" title={t('transactions.delete')}>
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  )}
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
              {showAllTransactions ? t('transactions.viewLess') : t('transactions.viewAll')}
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
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('transactions.expectedBalance')}</p>
            <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(saldoPrevisto)}</h4>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10">account_balance</span>
        </div>
        <div className="bg-secondary-container text-on-secondary-container rounded-xl p-6 border border-secondary/10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('transactions.monthlyRevenue')}</p>
          <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(totalReceitas)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            12% {t('transactions.comparedToLastMonth')}
          </div>
        </div>
        <div className="bg-error-container text-on-error-container rounded-xl p-6 border border-error/10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('transactions.monthlyExpenses')}</p>
          <h4 className="text-3xl font-headline font-extrabold mt-1">{formatCurrency(totalDespesas)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">trending_down</span>
            -4% {t('transactions.comparedToLastMonth')}
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
