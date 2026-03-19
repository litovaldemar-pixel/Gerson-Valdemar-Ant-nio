import React, { createContext, useContext, useState } from 'react';
import { Transaction, Customer, Supplier, Product } from '../types';

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  deleteCustomer: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;

  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
}

const initialTransactions: Transaction[] = [
  {
    id: '1',
    date: '2023-10-12',
    description: 'Pagamento AWS Cloud Services',
    category: 'Infraestrutura',
    type: 'despesa',
    value: 12450.00,
  },
  {
    id: '2',
    date: '2023-10-11',
    description: 'Consultoria Enterprise - Projeto Alpha',
    category: 'Serviços',
    type: 'receita',
    value: 45000.00,
  },
  {
    id: '3',
    date: '2023-10-10',
    description: 'Assinatura Adobe Creative Cloud',
    category: 'Marketing',
    type: 'despesa',
    value: 345.90,
  },
  {
    id: '4',
    date: '2023-10-09',
    description: 'Venda Licença Anual Core',
    category: 'SaaS',
    type: 'receita',
    value: 2400.00,
  },
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
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const addCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer = { ...customer, id: Math.random().toString(36).substr(2, 9) };
    setCustomers([newCustomer, ...customers]);
  };

  const deleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: Math.random().toString(36).substr(2, 9) };
    setSuppliers([newSupplier, ...suppliers]);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    setProducts([newProduct, ...products]);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateTransaction = (id: string, updatedData: Partial<Transaction>) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, ...updatedData } : t));
  };

  const updateCustomer = (id: string, updatedData: Partial<Customer>) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const updateSupplier = (id: string, updatedData: Partial<Supplier>) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const updateProduct = (id: string, updatedData: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  return (
    <AppContext.Provider value={{ 
      transactions, addTransaction, deleteTransaction, updateTransaction,
      customers, addCustomer, deleteCustomer, updateCustomer,
      suppliers, addSupplier, deleteSupplier, updateSupplier,
      products, addProduct, deleteProduct, updateProduct
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

