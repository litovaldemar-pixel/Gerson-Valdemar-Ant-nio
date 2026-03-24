import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const Suppliers = () => {
  const { suppliers, addSupplier, deleteSupplier, updateSupplier, products, transactions, globalSearchTerm } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [category, setCategory] = useState('Infraestrutura');
  const [documentError, setDocumentError] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    document: true,
    category: true,
    metrics: true,
    stockValue: true,
    saleValue: true,
    actions: true
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const filteredSuppliers = useMemo(() => {
    const term = (localSearchTerm || globalSearchTerm).toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(term) || 
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.document && s.document.toLowerCase().includes(term)) ||
      (s.category && s.category.toLowerCase().includes(term))
    );
  }, [suppliers, localSearchTerm, globalSearchTerm]);

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const validateCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '') return true; // Optional field
    if (cnpj.length !== 14) return false;

    // Eliminate known invalid CNPJs
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validate DVs
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setDocument(formatted);
    if (formatted && !validateCNPJ(formatted)) {
      setDocumentError('CNPJ inválido');
    } else {
      setDocumentError('');
    }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setName(s.name);
    setEmail(s.email);
    setDocument(s.document);
    setCategory(s.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setDocument('');
    setCategory('Infraestrutura');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      updateSupplier(editingId, {
        name,
        email,
        document,
        category,
      });
      setEditingId(null);
    } else {
      addSupplier({
        name,
        email,
        document,
        category,
      });
    }

    setName('');
    setEmail('');
    setDocument('');
    setCategory('Infraestrutura');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      {/* Header Section */}
      <section className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">Fornecedores</h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie seus fornecedores e parceiros.</p>
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
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Novo Fornecedor</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Nome / Razão Social</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="Ex: Fornecedor XYZ"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">E-mail (Opcional)</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="contato@fornecedor.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">CNPJ (Opcional)</label>
            <input
              className={`w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim ${documentError ? 'ring-2 ring-error' : ''}`}
              placeholder="00.000.000/0000-00"
              type="text"
              value={document}
              onChange={handleDocumentChange}
            />
            {documentError && <p className="text-error text-[10px] font-bold ml-1">{documentError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Categoria</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim appearance-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Infraestrutura">Infraestrutura</option>
              <option value="Software">Software</option>
              <option value="Serviços">Serviços</option>
              <option value="Marketing">Marketing</option>
              <option value="Mercadorias">Mercadorias</option>
              <option value="Equipamentos">Equipamentos</option>
              <option value="Logística">Logística</option>
              <option value="Consultoria">Consultoria</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="flex gap-2 w-full">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-full bg-surface-variant text-on-surface-variant py-3 rounded-lg font-bold text-sm hover:bg-outline-variant transition-colors">
                Cancelar
              </button>
            )}
            <button 
              type="submit" 
              disabled={!!documentError}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>

      {/* Suppliers Table Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-headline font-bold text-lg text-primary">Lista de Fornecedores</h3>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder="Buscar por nome, email ou documento..."
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
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-10 py-2">
                  <div className="px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 mb-2">
                    Mostrar Colunas
                  </div>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.name} onChange={() => toggleColumn('name')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Nome</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.email} onChange={() => toggleColumn('email')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Contato</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.document} onChange={() => toggleColumn('document')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Documento</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.category} onChange={() => toggleColumn('category')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Categoria</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.metrics} onChange={() => toggleColumn('metrics')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Métricas</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.stockValue} onChange={() => toggleColumn('stockValue')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Valor (Custo)</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.saleValue} onChange={() => toggleColumn('saleValue')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Valor (Venda)</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.actions} onChange={() => toggleColumn('actions')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Ações</span>
                  </label>
                </div>
              )}
            </div>
            
            <span className="text-xs text-on-surface-variant whitespace-nowrap hidden sm:inline">Total: {filteredSuppliers.length} fornecedores</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                {visibleColumns.name && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nome</th>}
                {visibleColumns.email && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">E-mail</th>}
                {visibleColumns.document && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">CNPJ</th>}
                {visibleColumns.category && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Produtos</th>}
                {visibleColumns.metrics && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Stock Total</th>}
                {visibleColumns.stockValue && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor em Stock (Custo)</th>}
                {visibleColumns.saleValue && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor em Stock (Venda)</th>}
                {visibleColumns.actions && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">
                    {suppliers.length === 0 ? 'Nenhum fornecedor cadastrado ainda.' : 'Nenhum fornecedor encontrado na busca.'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => {
                const supplierProducts = products.filter(p => p.supplierId === s.id);
                const totalStock = supplierProducts.reduce((acc, p) => acc + p.stock, 0);
                const totalCostValue = supplierProducts.reduce((acc, p) => acc + (p.cost * p.stock), 0);
                const totalSaleValue = supplierProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
                
                // Recent purchases from this supplier
                const recentPurchases = transactions
                  .filter(t => t.supplierId === s.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 3);

                return (
                <tr key={s.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  {visibleColumns.name && <td className="px-6 py-4 text-sm font-bold text-primary">
                    {s.name}
                    <div className="text-xs font-normal text-on-surface-variant mt-1">{s.category}</div>
                    {recentPurchases.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant">Últimas Compras:</p>
                        {recentPurchases.map(rp => (
                          <div key={rp.id} className="text-[10px] flex justify-between gap-2 text-on-surface-variant border-l-2 border-primary/20 pl-2">
                            <span>{new Date(rp.date).toLocaleDateString('pt-MZ')}</span>
                            <span className="font-bold">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(rp.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>}
                  {visibleColumns.email && <td className="px-6 py-4 text-sm text-on-surface-variant">{s.email}</td>}
                  {visibleColumns.document && <td className="px-6 py-4 text-sm text-on-surface-variant">{s.document}</td>}
                  {visibleColumns.category && <td className="px-6 py-4 text-center text-sm font-bold text-on-surface-variant">{supplierProducts.length}</td>}
                  {visibleColumns.metrics && <td className="px-6 py-4 text-center text-sm font-mono">
                    <div className="flex flex-col items-center">
                      <span className="font-bold">{totalStock.toFixed(2)}</span>
                      <span className="text-[10px] text-on-surface-variant">unidades base</span>
                    </div>
                  </td>}
                  {visibleColumns.stockValue && <td className="px-6 py-4 text-sm font-mono text-right text-error">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(totalCostValue)}
                  </td>}
                  {visibleColumns.saleValue && <td className="px-6 py-4 text-sm font-mono text-right text-primary">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(totalSaleValue)}
                  </td>}
                  {visibleColumns.actions && <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(s)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteSupplier(s.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-on-surface-variant">Nenhum fornecedor cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Suppliers;
