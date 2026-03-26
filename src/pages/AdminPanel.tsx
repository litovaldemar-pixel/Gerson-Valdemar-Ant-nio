import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { CompanyInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

interface AppUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AdminPanelProps {
  embedded?: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ embedded = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    empresa: true,
    contato: true,
    status: true,
    validade: true,
    plano: true,
    acoes: true
  });

  // New User Form State
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const isAdmin = user?.email === 'litovaldemar@gmail.com';

  const fetchData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompanyInfo));
      setCompanies(companiesData);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar dados. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return;
    
    setIsCreatingUser(true);
    try {
      // Create a secondary Firebase app instance to create the user without logging out the admin
      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);
      
      let newUserId = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
        newUserId = userCredential.user.uid;
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          // If user exists, try to sign in to get their UID
          const signInCredential = await import('firebase/auth').then(({ signInWithEmailAndPassword }) => 
            signInWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword)
          );
          newUserId = signInCredential.user.uid;
        } else {
          throw createErr;
        }
      }
      
      // Add user to Firestore
      await setDoc(doc(db, 'users', newUserId), {
        email: newUserEmail,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      // Sign out and delete secondary app
      await secondaryAuth.signOut();
      
      setNewUserEmail('');
      setNewUserPassword('');
      setShowNewUserForm(false);
      fetchData();
      alert('Usuário criado/adicionado com sucesso!');
    } catch (err: any) {
      console.error('Error creating user:', err);
      alert('Erro ao criar usuário: ' + err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmDelete = window.confirm(`Tem certeza que deseja remover o acesso do usuário ${email}? Ele não poderá mais acessar o sistema.`);
    if (!confirmDelete) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Erro ao remover usuário.');
    }
  };

  const handleAction = async (companyId: string, action: 'block' | 'unblock' | '30days' | '1year' | 'lifetime' | 'delete') => {
    try {
      const companyRef = doc(db, 'companies', companyId);

      if (action === 'delete') {
        const confirmDelete = window.confirm('Tem certeza que deseja APAGAR esta empresa? Esta ação não pode ser desfeita.');
        if (!confirmDelete) return;
        
        await deleteDoc(companyRef);
        fetchData();
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

      fetchData();
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

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(u => u.email?.toLowerCase().includes(lowerSearch));
  }, [users, searchTerm]);

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
      className={`${embedded ? 'p-4 md:p-6' : 'p-4 md:p-6 lg:p-8'} flex-1 space-y-6`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className={`${embedded ? 'text-2xl' : 'text-3xl'} font-extrabold font-headline text-primary flex items-center gap-3`}>
            <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
            Painel do Administrador
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">Gerencie empresas e usuários do sistema.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder={activeTab === 'companies' ? "Pesquisar empresa..." : "Pesquisar usuário..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-fixed-dim"
            />
          </div>
          
          {activeTab === 'companies' && (
            <div className="relative">
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-lg font-bold flex items-center gap-2 hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined">view_column</span>
                <span className="hidden sm:inline">Colunas</span>
              </button>
              
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-10 py-2">
                  <div className="px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 mb-2">
                    Mostrar Colunas
                  </div>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.empresa} onChange={() => toggleColumn('empresa')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Empresa</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.contato} onChange={() => toggleColumn('contato')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Contato</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.status} onChange={() => toggleColumn('status')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Status</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.validade} onChange={() => toggleColumn('validade')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Validade</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.plano} onChange={() => toggleColumn('plano')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Plano</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.acoes} onChange={() => toggleColumn('acoes')} className="rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">Ações</span>
                  </label>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg font-bold flex items-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20">
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'companies' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          Empresas
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'users' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          Usuários
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="font-bold">{error}</p>
        </div>
      )}

      {activeTab === 'companies' ? (
        <>
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

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-sm uppercase tracking-wider">
                    {visibleColumns.empresa && <th className="p-4 font-bold">Empresa</th>}
                    {visibleColumns.contato && <th className="p-4 font-bold">Contato</th>}
                    {visibleColumns.status && <th className="p-4 font-bold">Status</th>}
                    {visibleColumns.validade && <th className="p-4 font-bold">Validade</th>}
                    {visibleColumns.plano && <th className="p-4 font-bold">Plano</th>}
                    {visibleColumns.acoes && <th className="p-4 font-bold text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredCompanies.map((company) => {
                    const isActive = company.subscription?.status === 'active' && new Date(company.subscription.validUntil) > new Date();
                    
                    return (
                      <tr key={company.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                        {visibleColumns.empresa && <td className="p-4">
                          <p className="font-bold text-on-surface">{company.name}</p>
                          <p className="text-xs text-on-surface-variant">NUIT: {company.nuit}</p>
                        </td>}
                        {visibleColumns.contato && <td className="p-4">
                          <p className="text-sm text-on-surface">{company.contact}</p>
                          {company.email && <p className="text-xs text-on-surface-variant">{company.email}</p>}
                        </td>}
                        {visibleColumns.status && <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                            {isActive ? 'Ativa' : 'Bloqueada'}
                          </span>
                        </td>}
                        {visibleColumns.validade && <td className="p-4 text-sm text-on-surface-variant">
                          {company.subscription?.validUntil ? new Date(company.subscription.validUntil).toLocaleDateString('pt-MZ') : 'N/A'}
                        </td>}
                        {visibleColumns.plano && <td className="p-4 text-sm text-on-surface-variant">
                          {company.subscription?.plan || 'N/A'}
                        </td>}
                        {visibleColumns.acoes && <td className="p-4 text-right">
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
                        </td>}
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
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-on-surface">Usuários do Sistema</h3>
            <button 
              onClick={() => setShowNewUserForm(!showNewUserForm)}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold flex items-center gap-2 hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined">{showNewUserForm ? 'close' : 'person_add'}</span>
              {showNewUserForm ? 'Cancelar' : 'Adicionar Usuário'}
            </button>
          </div>

          {showNewUserForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleCreateUser}
              className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm mb-6"
            >
              <h4 className="text-lg font-bold text-primary mb-4">Novo Usuário</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">E-mail</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-fixed-dim"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Senha Inicial</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full p-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-fixed-dim"
                    placeholder="Senha segura"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isCreatingUser}
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreatingUser ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      Salvar Usuário
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold">E-mail</th>
                    <th className="p-4 font-bold">Data de Criação</th>
                    <th className="p-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4 font-bold text-on-surface">{u.email}</td>
                      <td className="p-4 text-sm text-on-surface-variant">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-MZ') : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        {u.email !== 'litovaldemar@gmail.com' && (
                          <button 
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-2 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors"
                            title="Remover Acesso"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-on-surface-variant">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AdminPanel;
