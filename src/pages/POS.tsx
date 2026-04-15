import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const POS = () => {
  const { products, customers, addTransaction, companyInfo } = useAppContext();
  const { t } = useTranslation();

  const [cart, setCart] = useState<any[]>([]);
  const [heldSales, setHeldSales] = useState<{id: string, cart: any[], customerId: string, discount: string, timestamp: Date}[]>([]);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Numerário');
  const [discount, setDiscount] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [ivaRate, setIvaRate] = useState<number>(companyInfo?.ivaRate || 0);

  useEffect(() => {
    if (companyInfo?.ivaRate !== undefined) {
      setIvaRate(companyInfo.ivaRate);
    }
  }, [companyInfo?.ivaRate]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep focus on barcode input when not interacting with other elements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCart([]);
        setBarcodeInput('');
        setSearchTerm('');
        setCustomerId('');
        setDiscount('');
        setAmountPaid('');
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customerId, paymentMethod, discount, amountPaid, ivaRate]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const product = products.find(p => p.sku === barcodeInput || p.id === barcodeInput);
    if (product) {
      addToCart(product);
    } else {
      toast.error(t('pos.productNotFound'));
    }
    setBarcodeInput('');
  };

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.error(t('pos.outOfStock'));
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(t('pos.insufficientStock'));
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        subtotal: product.price,
        unit: product.unit || 'un'
      }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    
    setCart(prev => {
      const item = prev[index];
      const product = products.find(p => p.id === item.productId);
      if (product && newQty > product.stock) {
        toast.error(t('pos.insufficientStock'));
        return prev;
      }
      
      const newCart = [...prev];
      newCart[index] = {
        ...item,
        quantity: newQty,
        subtotal: newQty * item.unitPrice
      };
      return newCart;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const parsedDiscount = parseFloat(discount) || 0;
  const taxableBase = Math.max(0, cartTotal - parsedDiscount);
  const ivaAmount = taxableBase * (ivaRate / 100);
  const finalTotal = taxableBase + ivaAmount;
  const change = (parseFloat(amountPaid) || 0) - finalTotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const transactionData = {
      description: `${t('pos.posSale')}${customerId ? ` - ${customers.find(c => c.id === customerId)?.name}` : ''}`,
      value: finalTotal,
      type: 'receita' as const,
      category: 'Vendas',
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      paymentStatus: 'pago' as const,
      ivaRate,
      ivaAmount,
      discount: parsedDiscount,
      items: cart,
      customerId: customerId || null,
    };

    addTransaction(transactionData);
    toast.success(t('pos.saleCompleted'));
    
    // Reset
    setCart([]);
    setBarcodeInput('');
    setSearchTerm('');
    setCustomerId('');
    setDiscount('');
    setAmountPaid('');
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handleHoldSale = () => {
    if (cart.length === 0) return;
    
    const newHeldSale = {
      id: Math.random().toString(36).substr(2, 9),
      cart: [...cart],
      customerId,
      discount,
      timestamp: new Date()
    };
    
    setHeldSales(prev => [...prev, newHeldSale]);
    toast.success('Venda colocada em espera');
    
    // Reset
    setCart([]);
    setCustomerId('');
    setDiscount('');
    setAmountPaid('');
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const restoreHeldSale = (heldSale: any) => {
    setCart(heldSale.cart);
    setCustomerId(heldSale.customerId);
    setDiscount(heldSale.discount);
    setHeldSales(prev => prev.filter(s => s.id !== heldSale.id));
    setShowHeldSales(false);
    toast.success('Venda restaurada');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(t('common.locale', 'pt-MZ'), {
      style: 'currency',
      currency: t('common.currency', 'MZN'),
    }).format(value);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-surface overflow-hidden">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col p-4 border-r border-outline-variant/20">
        <div className="mb-4 flex gap-4">
          <form onSubmit={handleBarcodeSubmit} className="flex-1">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">barcode_scanner</span>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder={t('pos.barcodePlaceholder')}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
              />
            </div>
          </form>
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('pos.searchPlaceholder')}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className={`bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 cursor-pointer flex flex-col h-full ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-on-surface line-clamp-2">{product.name}</h4>
                  <p className="text-[10px] text-on-surface-variant mt-1">{product.sku}</p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="font-headline font-bold text-primary">{formatCurrency(product.price)}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.stock <= product.minStock ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                    {product.stock} {product.unit || 'un'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart & Checkout */}
      <div className="w-96 bg-surface-container-low flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.05)] z-10 relative">
        <div className="p-4 border-b border-outline-variant/20 bg-surface-container-lowest flex justify-between items-center">
          <h2 className="text-xl font-headline font-extrabold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">shopping_cart</span>
            {t('pos.cart')}
          </h2>
          {heldSales.length > 0 && (
            <button 
              onClick={() => setShowHeldSales(!showHeldSales)}
              className="flex items-center gap-1 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-sm">pause_circle</span>
              {heldSales.length} em espera
            </button>
          )}
        </div>

        {/* Held Sales Dropdown */}
        {showHeldSales && heldSales.length > 0 && (
          <div className="absolute top-[72px] right-4 left-4 bg-surface-container-lowest shadow-xl rounded-xl border border-outline-variant/20 z-50 max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-outline-variant/10 bg-surface-container-low flex justify-between items-center">
              <h3 className="font-bold text-sm">Vendas em Espera</h3>
              <button onClick={() => setShowHeldSales(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-2 space-y-2">
              {heldSales.map(sale => (
                <div key={sale.id} className="p-3 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer flex justify-between items-center" onClick={() => restoreHeldSale(sale)}>
                  <div>
                    <div className="font-bold text-sm">{sale.cart.length} itens</div>
                    <div className="text-xs text-on-surface-variant">
                      {sale.timestamp.toLocaleTimeString()} {sale.customerId ? `- ${customers.find(c => c.id === sale.customerId)?.name}` : ''}
                    </div>
                  </div>
                  <div className="font-bold text-primary">
                    {formatCurrency(sale.cart.reduce((sum, item) => sum + item.subtotal, 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-50">
              <span className="material-symbols-outlined text-6xl mb-4">shopping_basket</span>
              <p>{t('pos.emptyCart')}</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/20 flex gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-on-surface line-clamp-1">{item.name}</h4>
                  <div className="text-xs text-on-surface-variant mt-1">{formatCurrency(item.unitPrice)} / {item.unit}</div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1">
                    <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                  <span className="font-bold text-primary mt-2">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 space-y-4">
          <div className="space-y-2">
            <select
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">{t('pos.finalCustomer')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Numerário">{t('pos.cash')}</option>
              <option value="M-Pesa">{t('pos.mpesa')}</option>
              <option value="E-mola">{t('pos.emola')}</option>
              <option value="Cartão">{t('pos.card')}</option>
            </select>
            <select
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={ivaRate}
              onChange={(e) => setIvaRate(Number(e.target.value))}
            >
              <option value={0}>{t('pos.iva0')}</option>
              <option value={16}>{t('pos.iva16')}</option>
              <option value={17}>{t('pos.iva17')}</option>
            </select>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('pos.subtotal')}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('pos.iva', { rate: ivaRate })}</span>
              <span>{formatCurrency(ivaAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">{t('pos.discount')}</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 text-right bg-surface-container border border-outline-variant/30 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/20">
            <div className="flex justify-between items-end mb-4">
              <span className="text-lg font-bold text-on-surface">{t('pos.total')}</span>
              <span className="text-3xl font-headline font-extrabold text-primary">{formatCurrency(finalTotal)}</span>
            </div>

            {paymentMethod === 'Numerário' && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">{t('pos.amountPaid')}</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-32 text-right bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-bold"
                    placeholder="0.00"
                  />
                </div>
                {change > 0 && (
                  <div className="flex justify-between items-center text-secondary">
                    <span className="text-sm font-bold">{t('pos.change')}</span>
                    <span className="font-bold">{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleHoldSale}
                disabled={cart.length === 0}
                className="flex-1 bg-surface-variant text-on-surface-variant py-4 rounded-xl font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined">pause</span>
                Pausar
              </button>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || (paymentMethod === 'Numerário' && (parseFloat(amountPaid) || 0) < finalTotal)}
                className="flex-[2] bg-primary text-on-primary py-4 rounded-xl font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined">payments</span>
                {t('pos.checkout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
