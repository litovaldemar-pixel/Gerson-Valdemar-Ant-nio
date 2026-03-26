import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import PrintHeader from '../components/PrintHeader';

const Products = () => {
  const { products, addProduct, deleteProduct, updateProduct, globalSearchTerm } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState<string>('un');
  const [purchaseUnit, setPurchaseUnit] = useState<string>('un');
  const [conversionFactor, setConversionFactor] = useState<string>('1');
  const [supplierId, setSupplierId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    product: true,
    supplier: true,
    price: true,
    cost: true,
    stock: true,
    totalCost: true,
    actions: true
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const { suppliers } = useAppContext();

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setPrice(p.price.toString());
    setCost(p.cost.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setUnit(p.unit || 'un');
    setPurchaseUnit(p.purchaseUnit || 'un');
    setConversionFactor(p.conversionFactor?.toString() || '1');
    setSupplierId(p.supplierId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setSku('');
    setCategory('');
    setPrice('');
    setCost('');
    setStock('');
    setMinStock('');
    setUnit('un');
    setPurchaseUnit('un');
    setConversionFactor('1');
    setSupplierId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price || !cost || !stock) return;

    const productData = {
      name,
      sku,
      category,
      price: parseFloat(price),
      cost: parseFloat(cost),
      stock: parseFloat(stock),
      minStock: parseFloat(minStock || '0'),
      unit,
      purchaseUnit,
      conversionFactor: parseFloat(conversionFactor || '1'),
      supplierId: supplierId || null,
    };

    if (editingId) {
      updateProduct(editingId, productData);
      setEditingId(null);
    } else {
      addProduct(productData);
    }

    setName('');
    setSku('');
    setCategory('');
    setPrice('');
    setCost('');
    setStock('');
    setMinStock('');
    setUnit('un');
    setPurchaseUnit('un');
    setConversionFactor('1');
    setSupplierId('');
  };

  const filteredProducts = products.filter(p => {
    const term = (searchTerm || globalSearchTerm).toLowerCase();
    if (!term) return true;
    return p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term);
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      <PrintHeader />
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Relatório de Produtos e Stock</h2>
      </div>

      {/* Header Section */}
      <section className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">Mercadorias e Stock</h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie seu inventário e produtos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Imprimir
          </button>
        </div>
      </section>

      {/* Quick Entry Form Section */}
      <section className="bg-surface-container-low rounded-xl p-6 print:hidden">
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Novo Produto</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Nome do Produto</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="Ex: Notebook Pro"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">SKU / Código</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="Ex: NB-PRO-01"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Categoria</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="Ex: Eletrônicos"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Preço de Venda (MZN)</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="0.00"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Custo (MZN)</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="0.00"
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Quantidade em Stock</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="0"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Stock Mínimo</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="0"
              type="number"
              step="0.01"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Unidade de Venda</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="un">Unidade (un)</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="lt">Litro (lt)</option>
              <option value="mt">Metro (mt)</option>
              <option value="cx">Caixa (cx)</option>
              <option value="pct">Pacote (pct)</option>
              <option value="par">Par (par)</option>
              <option value="saco">Saco (saco)</option>
              <option value="fardo">Fardo (fardo)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Unidade de Compra</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              value={purchaseUnit}
              onChange={(e) => setPurchaseUnit(e.target.value)}
            >
              <option value="un">Unidade (un)</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="lt">Litro (lt)</option>
              <option value="mt">Metro (mt)</option>
              <option value="cx">Caixa (cx)</option>
              <option value="pct">Pacote (pct)</option>
              <option value="par">Par (par)</option>
              <option value="saco">Saco (saco)</option>
              <option value="fardo">Fardo (fardo)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Fator de Conversão</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="Ex: 25"
              type="number"
              step="0.01"
              value={conversionFactor}
              onChange={(e) => setConversionFactor(e.target.value)}
            />
            {purchaseUnit !== unit && conversionFactor && parseFloat(conversionFactor) > 1 && (
              <p className="text-[10px] font-bold text-primary ml-1 animate-pulse">
                Regra: 1 {purchaseUnit} = {conversionFactor} {unit}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Fornecedor</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full md:col-span-2 lg:col-span-4">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-full bg-surface-variant text-on-surface-variant py-3 rounded-lg font-bold text-sm hover:bg-outline-variant transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors">
              {editingId ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>

      {/* Products Table Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-headline font-bold text-lg text-primary">Lista de Mercadorias</h3>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder="Buscar por nome, SKU ou categoria..."
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    <input type="checkbox" checked={visibleColumns.product} onChange={() => toggleColumn('product')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Produto</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.supplier} onChange={() => toggleColumn('supplier')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Fornecedor</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.price} onChange={() => toggleColumn('price')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Preço Venda</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.cost} onChange={() => toggleColumn('cost')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Custo</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.stock} onChange={() => toggleColumn('stock')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Stock</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.totalCost} onChange={() => toggleColumn('totalCost')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Total (Custo)</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.actions} onChange={() => toggleColumn('actions')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Ações</span>
                  </label>
                </div>
              )}
            </div>
            
            <span className="text-xs text-on-surface-variant whitespace-nowrap hidden sm:inline">Total: {filteredProducts.length} produtos</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                {visibleColumns.product && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Produto</th>}
                {visibleColumns.supplier && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Fornecedor</th>}
                {visibleColumns.price && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Preço Venda</th>}
                {visibleColumns.cost && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Custo</th>}
                {visibleColumns.stock && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Stock</th>}
                {visibleColumns.totalCost && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Total (Custo)</th>}
                {visibleColumns.actions && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredProducts.map((p) => {
                const supplier = suppliers.find(s => s.id === p.supplierId);
                return (
                <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  {visibleColumns.product && <td className="px-6 py-4 text-sm font-bold text-primary">
                    {p.name}
                    <div className="text-xs font-normal text-on-surface-variant mt-1">{p.sku} | {p.category}</div>
                    {p.purchaseUnit && p.purchaseUnit !== p.unit && (
                      <div className="text-[10px] font-bold text-primary mt-1">
                        1 {p.purchaseUnit} = {p.conversionFactor} {p.unit}
                      </div>
                    )}
                  </td>}
                  {visibleColumns.supplier && <td className="px-6 py-4 text-sm text-on-surface-variant">{supplier ? supplier.name : '-'}</td>}
                  {visibleColumns.price && <td className="px-6 py-4 text-sm font-mono text-right text-primary">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.price)}
                  </td>}
                  {visibleColumns.cost && <td className="px-6 py-4 text-sm font-mono text-right text-error">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.cost)}
                  </td>}
                  {visibleColumns.stock && <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${p.stock <= p.minStock ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {p.stock} {p.unit || 'un'}
                    </span>
                  </td>}
                  {visibleColumns.totalCost && <td className="px-6 py-4 text-sm font-mono text-right text-error">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.cost * p.stock)}
                  </td>}
                  {visibleColumns.actions && <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>}
                </tr>
              )})}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-on-surface-variant">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Products;
