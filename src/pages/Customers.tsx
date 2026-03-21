import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import CustomerStatementModal from '../components/CustomerStatementModal';
import { Customer } from '../types';

const Customers = () => {
  const { customers, addCustomer, deleteCustomer, updateCustomer } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email);
    setDocument(c.document);
    setStatus(c.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setDocument('');
    setStatus('Ativo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !document) return;

    if (editingId) {
      updateCustomer(editingId, {
        name,
        email,
        document,
        status,
      });
      setEditingId(null);
    } else {
      addCustomer({
        name,
        email,
        document,
        status,
      });
    }

    setName('');
    setEmail('');
    setDocument('');
    setStatus('Ativo');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 space-y-8">
      {/* Header Section */}
      <section className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">Clientes</h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie sua carteira de clientes.</p>
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
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Novo Cliente</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Nome / Razão Social</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="Ex: Empresa ABC"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">E-mail</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="contato@empresa.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">CPF/CNPJ</label>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
              placeholder="00.000.000/0000-00"
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Status</label>
            <select
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim appearance-none"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
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

      {/* Customers Table Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="font-headline font-bold text-lg text-primary">Lista de Clientes</h3>
          <div className="flex items-center gap-4">
            <span className="text-xs text-on-surface-variant">Total: {customers.length} clientes</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nome</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">E-mail</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Documento</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-primary">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{c.email}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{c.document}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${c.status === 'Ativo' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setSelectedCustomer(c); setIsStatementOpen(true); }} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary-container/20 transition-all" title="Ver Balancete">
                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                      </button>
                      <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed/20 transition-all" title="Editar">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteCustomer(c.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-all" title="Excluir">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">Nenhum cliente cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <CustomerStatementModal 
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default Customers;
