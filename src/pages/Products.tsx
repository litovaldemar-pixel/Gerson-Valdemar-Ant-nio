import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Products = () => {
  const { products, addProduct, deleteProduct, updateProduct } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setPrice(p.price.toString());
    setCost(p.cost.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
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
      stock: parseInt(stock, 10),
      minStock: parseInt(minStock || '0', 10),
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
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      {/* Header Section */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">Mercadorias e Stock</h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie seu inventário e produtos.</p>
        </div>
      </section>

      {/* Quick Entry Form Section */}
      <section className="bg-surface-container-low rounded-xl p-6">
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
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full">
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
            <span className="text-xs text-on-surface-variant whitespace-nowrap">Total: {filteredProducts.length} produtos</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Produto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">SKU</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Preço</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Custo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Stock</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-primary">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{p.sku}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{p.category}</td>
                  <td className="px-6 py-4 text-sm font-mono text-right">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.price)}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right text-on-surface-variant">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.cost)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${p.stock <= p.minStock ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {p.stock} un
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
