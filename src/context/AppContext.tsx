import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, Customer, Supplier, Product, CompanyInfo } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  
  companyInfo: CompanyInfo | null;
  updateCompanyInfo: (info: CompanyInfo) => void;

  loading: boolean;
}

const initialTransactions: Transaction[] = [
  { id: '1', date: '2023-10-12', description: 'Pagamento AWS Cloud Services', category: 'Infraestrutura', type: 'despesa', value: 12450.00 },
  { id: '2', date: '2023-10-11', description: 'Consultoria Enterprise - Projeto Alpha', category: 'Serviços', type: 'receita', value: 45000.00 },
  { id: '3', date: '2023-10-10', description: 'Assinatura Adobe Creative Cloud', category: 'Marketing', type: 'despesa', value: 345.90 },
  { id: '4', date: '2023-10-09', description: 'Venda Licença Anual Core', category: 'SaaS', type: 'receita', value: 2400.00 },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Acme Corp', email: 'contato@acme.com', document: '12.345.678/0001-90', status: 'Ativo' },
  { id: 'c2', name: 'Global Tech', email: 'financeiro@globaltech.com', document: '98.765.432/0001-10', status: 'Ativo' },
];

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'Amazon Web Services', email: 'billing@aws.com', document: '10.200.300/0001-40', category: 'Infraestrutura' },
  { id: 's2', name: 'Adobe Systems', email: 'invoices@adobe.com', document: '20.300.400/0001-50', category: 'Software' },
];

const initialProducts: Product[] = [
  { id: 'p1', name: 'Notebook Pro 15', sku: 'NB-PRO-15', category: 'Eletrônicos', price: 85000.00, cost: 60000.00, stock: 12, minStock: 5 },
  { id: 'p2', name: 'Monitor 4K 27"', sku: 'MON-4K-27', category: 'Eletrônicos', price: 25000.00, cost: 18000.00, stock: 4, minStock: 10 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(() => {
    const saved = localStorage.getItem('@FinancialArchitect:companyInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    if (isAuthenticated) {
      fetchData();
    } else {
      setTransactions([]);
      setCustomers([]);
      setSuppliers([]);
      setProducts([]);
      setLoading(false);
    }
  }, [isAuthenticated, isSupabaseConfigured]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, custRes, suppRes, prodRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('products').select('*').order('name')
      ]);

      // If any of the queries fail (e.g., tables don't exist yet), fallback to mock data
      if (txRes.error || custRes.error || suppRes.error || prodRes.error) {
        console.warn('Supabase tables not found or error occurred. Falling back to mock data.', {
          txError: txRes.error,
          custError: custRes.error,
          suppError: suppRes.error,
          prodError: prodRes.error
        });
        setTransactions(initialTransactions);
        setCustomers(initialCustomers);
        setSuppliers(initialSuppliers);
        setProducts(initialProducts);
      } else {
        if (txRes.data) setTransactions(txRes.data);
        if (custRes.data) setCustomers(custRes.data);
        if (suppRes.data) setSuppliers(suppRes.data);
        if (prodRes.data) setProducts(prodRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data on unexpected error
      setTransactions(initialTransactions);
      setCustomers(initialCustomers);
      setSuppliers(initialSuppliers);
      setProducts(initialProducts);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    let newTransaction: Transaction;
    if (!isSupabaseConfigured) {
      newTransaction = { ...transaction, id: Math.random().toString(36).substr(2, 9) };
      setTransactions([newTransaction, ...transactions]);
    } else {
      const { data, error } = await supabase.from('transactions').insert([transaction]).select();
      if (error || !data) {
        console.error('Error adding transaction:', error);
        return;
      }
      newTransaction = data[0];
      setTransactions([newTransaction, ...transactions]);
    }

    // Synchronize stock
    if (newTransaction.productId && newTransaction.quantity) {
      const product = products.find(p => p.id === newTransaction.productId);
      if (product) {
        let newStock = product.stock;
        if (newTransaction.type === 'receita') {
          // Sale: decrease stock
          newStock -= newTransaction.quantity;
        } else if (newTransaction.type === 'despesa') {
          // Purchase: increase stock
          newStock += newTransaction.quantity;
        }
        await updateProduct(product.id, { stock: newStock });
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    
    if (!isSupabaseConfigured) {
      setTransactions(transactions.filter(t => t.id !== id));
    } else {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error('Error deleting transaction:', error);
        return;
      }
      setTransactions(transactions.filter(t => t.id !== id));
    }

    // Revert stock synchronization
    if (transactionToDelete && transactionToDelete.productId && transactionToDelete.quantity) {
      const product = products.find(p => p.id === transactionToDelete.productId);
      if (product) {
        let newStock = product.stock;
        if (transactionToDelete.type === 'receita') {
          // Revert sale: increase stock
          newStock += transactionToDelete.quantity;
        } else if (transactionToDelete.type === 'despesa') {
          // Revert purchase: decrease stock
          newStock -= transactionToDelete.quantity;
        }
        await updateProduct(product.id, { stock: newStock });
      }
    }
  };

  const updateTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    const oldTransaction = transactions.find(t => t.id === id);
    
    if (!isSupabaseConfigured) {
      setTransactions(transactions.map(t => t.id === id ? { ...t, ...updatedData } : t));
    } else {
      const { error } = await supabase.from('transactions').update(updatedData).eq('id', id);
      if (error) {
        console.error('Error updating transaction:', error);
        return;
      }
      setTransactions(transactions.map(t => t.id === id ? { ...t, ...updatedData } : t));
    }

    // Synchronize stock
    if (oldTransaction) {
      const newTransaction = { ...oldTransaction, ...updatedData };
      
      if (
        oldTransaction.productId !== newTransaction.productId ||
        oldTransaction.quantity !== newTransaction.quantity ||
        oldTransaction.type !== newTransaction.type
      ) {
        if (oldTransaction.productId === newTransaction.productId && newTransaction.productId) {
          const product = products.find(p => p.id === newTransaction.productId);
          if (product) {
            let currentStock = product.stock;
            // Revert old
            if (oldTransaction.type === 'receita') {
              currentStock += (oldTransaction.quantity || 0);
            } else if (oldTransaction.type === 'despesa') {
              currentStock -= (oldTransaction.quantity || 0);
            }
            // Apply new
            if (newTransaction.type === 'receita') {
              currentStock -= (newTransaction.quantity || 0);
            } else if (newTransaction.type === 'despesa') {
              currentStock += (newTransaction.quantity || 0);
            }
            await updateProduct(product.id, { stock: currentStock });
          }
        } else {
          // Revert old
          if (oldTransaction.productId && oldTransaction.quantity) {
            const oldProduct = products.find(p => p.id === oldTransaction.productId);
            if (oldProduct) {
              let revertedStock = oldProduct.stock;
              if (oldTransaction.type === 'receita') {
                revertedStock += oldTransaction.quantity;
              } else if (oldTransaction.type === 'despesa') {
                revertedStock -= oldTransaction.quantity;
              }
              await updateProduct(oldProduct.id, { stock: revertedStock });
            }
          }
          // Apply new
          if (newTransaction.productId && newTransaction.quantity) {
            const newProduct = products.find(p => p.id === newTransaction.productId);
            if (newProduct) {
              let newStock = newProduct.stock;
              if (newTransaction.type === 'receita') {
                newStock -= newTransaction.quantity;
              } else if (newTransaction.type === 'despesa') {
                newStock += newTransaction.quantity;
              }
              await updateProduct(newProduct.id, { stock: newStock });
            }
          }
        }
      }
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    if (!isSupabaseConfigured) {
      setCustomers([{ ...customer, id: Math.random().toString(36).substr(2, 9) }, ...customers]);
      return;
    }
    const { data, error } = await supabase.from('customers').insert([customer]).select();
    if (!error && data) setCustomers([data[0], ...customers]);
  };

  const deleteCustomer = async (id: string) => {
    if (!isSupabaseConfigured) {
      setCustomers(customers.filter(c => c.id !== id));
      return;
    }
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) setCustomers(customers.filter(c => c.id !== id));
  };

  const updateCustomer = async (id: string, updatedData: Partial<Customer>) => {
    if (!isSupabaseConfigured) {
      setCustomers(customers.map(c => c.id === id ? { ...c, ...updatedData } : c));
      return;
    }
    const { error } = await supabase.from('customers').update(updatedData).eq('id', id);
    if (!error) setCustomers(customers.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (!isSupabaseConfigured) {
      setSuppliers([{ ...supplier, id: Math.random().toString(36).substr(2, 9) }, ...suppliers]);
      return;
    }
    const { data, error } = await supabase.from('suppliers').insert([supplier]).select();
    if (!error && data) setSuppliers([data[0], ...suppliers]);
  };

  const deleteSupplier = async (id: string) => {
    if (!isSupabaseConfigured) {
      setSuppliers(suppliers.filter(s => s.id !== id));
      return;
    }
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const updateSupplier = async (id: string, updatedData: Partial<Supplier>) => {
    if (!isSupabaseConfigured) {
      setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...updatedData } : s));
      return;
    }
    const { error } = await supabase.from('suppliers').update(updatedData).eq('id', id);
    if (!error) setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!isSupabaseConfigured) {
      setProducts([{ ...product, id: Math.random().toString(36).substr(2, 9) }, ...products]);
      return;
    }
    const { data, error } = await supabase.from('products').insert([product]).select();
    if (!error && data) setProducts([data[0], ...products]);
  };

  const deleteProduct = async (id: string) => {
    if (!isSupabaseConfigured) {
      setProducts(products.filter(p => p.id !== id));
      return;
    }
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = async (id: string, updatedData: Partial<Product>) => {
    if (!isSupabaseConfigured) {
      setProducts(products.map(p => p.id === id ? { ...p, ...updatedData } : p));
      return;
    }
    const { error } = await supabase.from('products').update(updatedData).eq('id', id);
    if (!error) setProducts(products.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    localStorage.setItem('@FinancialArchitect:companyInfo', JSON.stringify(info));
  };

  return (
    <AppContext.Provider value={{ 
      transactions, addTransaction, deleteTransaction, updateTransaction,
      customers, addCustomer, deleteCustomer, updateCustomer,
      suppliers, addSupplier, deleteSupplier, updateSupplier,
      products, addProduct, deleteProduct, updateProduct,
      companyInfo, updateCompanyInfo,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
