import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { CompanyInfo } from '../types';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = 
    user?.email?.toLowerCase().includes('litovaldemar') || 
    user?.email?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase().includes('gerson') ||
    user?.email?.toLowerCase() === 'teste@teste.com';

  const fetchCompanies = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'companies'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompanyInfo));
      setCompanies(data);
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      setError('Erro ao carregar empresas. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAction = async (companyId: string, action: 'block' | 'unblock' | '30days' | '1year' | 'lifetime' | 'delete') => {
    try {
      const companyRef = doc(db, 'companies', companyId);

      if (action === 'delete') {
        const confirmDelete = window.confirm('Tem certeza que deseja APAGAR esta empresa? Esta ação não pode ser desfeita.');
        if (!confirmDelete) return;
        
        await deleteDoc(companyRef);
        fetchCompanies();
        return;
      }

      const newDate = new Date();
      let plan = 'Manual';
      let status: 'active' | 'inactive' = 'active';

      if (action === 'block') {
        newDate.setDate(newDate.getDate() - 1); // Expired yesterday
        status = 'inactive';
        plan = 'Bloqueado (Admin)';
      } else if (action === 'unblock' || action === '30days') {
        newDate.setDate(newDate.getDate() + 30);
        plan = 'Manual (30 Dias)';
      } else if (action === '1year') {
        newDate.setFullYear(newDate.getFullYear() + 1);
        plan = 'Manual (1 Ano)';
      } else if (action === 'lifetime') {
        newDate.setFullYear(newDate.getFullYear() + 99);
        plan = 'Vitalício (Dev)';
      }

      await updateDoc(companyRef, {
        subscription: {
          status,
          validUntil: newDate.toISOString(),
          plan,
          price: 0
        }
      });

      // Refresh list
      fetchCompanies();
    } catch (err) {
      console.error('Error updating company:', err);
      alert('Erro ao processar a ação na empresa.');
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    const lowerSearch = searchTerm.toLowerCase();
    return companies.filter(company => 
      company.name?.toLowerCase().includes(lowerSearch) ||
      company.nuit?.toLowerCase().includes(lowerSearch) ||
      company.contact?.toLowerCase().includes(lowerSearch) ||
      company.email?.toLowerCase().includes(lowerSearch)
    );
  }, [companies, searchTerm]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-full text-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">gpp_bad</span>
        <h2 className="text-2xl font-bold text-on-surface mb-2">Acesso Negado</h2>
        <p className="text-on-surface-variant">Você não tem permissão para acessar o painel de administrador.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 lg:p-8 flex-1 space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
            Painel do Administrador
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie todas as empresas registradas no sistema.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Pesquisar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-fixed-dim"
            />
          </div>
          <button 
            onClick={fetchCompanies}
            className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg font-bold flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
            Atualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">business</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Total de Empresas</p>
            <p className="text-2xl font-black text-on-surface">{companies.length}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Empresas Ativas</p>
            <p className="text-2xl font-black text-on-surface">
              {companies.filter(c => c.subscription?.status === 'active' && new Date(c.subscription.validUntil) > new Date()).length}
            </p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
            <span className="material-symbols-outlined">block</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Empresas Bloqueadas</p>
            <p className="text-2xl font-black text-on-surface">
              {companies.filter(c => c.subscription?.status !== 'active' || new Date(c.subscription.validUntil) <= new Date()).length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="font-bold">{error}</p>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">Empresa</th>
                <th className="p-4 font-bold">Contato</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Validade</th>
                <th className="p-4 font-bold">Plano</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredCompanies.map((company) => {
                const isActive = company.subscription?.status === 'active' && new Date(company.subscription.validUntil) > new Date();
                
                return (
                  <tr key={company.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-on-surface">{company.name}</p>
                      <p className="text-xs text-on-surface-variant">NUIT: {company.nuit}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-on-surface">{company.contact}</p>
                      {company.email && <p className="text-xs text-on-surface-variant">{company.email}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                        {isActive ? 'Ativa' : 'Bloqueada'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {company.subscription?.validUntil ? new Date(company.subscription.validUntil).toLocaleDateString('pt-MZ') : 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {company.subscription?.plan || 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isActive ? (
                          <button 
                            onClick={() => handleAction(company.id, 'block')}
                            className="p-2 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors"
                            title="Bloquear Empresa"
                          >
                            <span className="material-symbols-outlined text-sm">block</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAction(company.id, 'unblock')}
                            className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                            title="Desbloquear (+30 Dias)"
                          >
                            <span className="material-symbols-outlined text-sm">lock_open</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleAction(company.id, '1year')}
                          className="p-2 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg transition-colors text-xs font-bold"
                          title="Estender 1 Ano"
                        >
                          +1A
                        </button>
                        <button 
                          onClick={() => handleAction(company.id, 'lifetime')}
                          className="p-2 bg-tertiary-container text-on-tertiary-container hover:brightness-110 rounded-lg transition-colors text-xs font-bold"
                          title="Acesso Vitalício"
                        >
                          VIT
                        </button>
                        <div className="w-px h-6 bg-outline-variant/30 mx-1"></div>
                        <button 
                          onClick={() => handleAction(company.id, 'delete')}
                          className="p-2 bg-error text-on-error hover:brightness-110 rounded-lg transition-colors"
                          title="Apagar Empresa"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
