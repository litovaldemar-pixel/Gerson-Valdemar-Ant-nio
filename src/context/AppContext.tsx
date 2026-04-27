import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Transaction, Customer, Supplier, Product, CompanyInfo } from '../types';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy 
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to prevent crashing the app, but we log it clearly
}

import PinModal from '../components/PinModal';

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
  
  companies: CompanyInfo[];
  currentCompanyId: string | null;
  setCurrentCompanyId: (id: string | null) => void;
  addCompany: (company: Omit<CompanyInfo, 'id'>) => Promise<void>;
  updateCompany: (id: string, data: Partial<CompanyInfo>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  
  companyInfo: CompanyInfo | null;
  updateCompanyInfo: (info: CompanyInfo) => void;

  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;

  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(() => {
    return localStorage.getItem('@FinancialArchitect:currentCompanyId');
  });
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(() => {
    const saved = localStorage.getItem('@FinancialArchitect:companyInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string>('');
  const lastReceiptNumberRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const newRef: Record<string, number> = {};
    allTransactions.forEach(t => {
      const key = t.companyId || 'default';
      newRef[key] = Math.max(newRef[key] || 0, t.receiptNumber || 0);
    });
    lastReceiptNumberRef.current = newRef;
  }, [allTransactions]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setAllTransactions([]);
      setAllCustomers([]);
      setAllSuppliers([]);
      setAllProducts([]);
      setCompanies([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const isAdmin = user.email === 'litovaldemar@gmail.com';

    const unsubCompanies = onSnapshot(
      isAdmin ? query(collection(db, 'companies')) : query(collection(db, 'companies'), where('userId', '==', user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CompanyInfo));
        setCompanies(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'companies')
    );

    const unsubTransactions = onSnapshot(
      isAdmin ? query(collection(db, 'transactions')) : query(collection(db, 'transactions'), where('userId', '==', user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
        setAllTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'transactions')
    );

    const unsubCustomers = onSnapshot(
      isAdmin ? query(collection(db, 'customers')) : query(collection(db, 'customers'), where('userId', '==', user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
        setAllCustomers(data.sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'customers')
    );

    const unsubSuppliers = onSnapshot(
      isAdmin ? query(collection(db, 'suppliers')) : query(collection(db, 'suppliers'), where('userId', '==', user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier));
        setAllSuppliers(data.sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'suppliers')
    );

    const unsubProducts = onSnapshot(
      isAdmin ? query(collection(db, 'products')) : query(collection(db, 'products'), where('userId', '==', user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
        setAllProducts(data.sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );

    setLoading(false);

    return () => {
      unsubCompanies();
      unsubTransactions();
      unsubCustomers();
      unsubSuppliers();
      unsubProducts();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Filter data by current company
    // If no currentCompanyId, or if it's a legacy record (no companyId), we show it if we are in the "default" workspace or first company
    const showUnassigned = currentCompanyId === null || companies.length === 0 || companies[0].id === currentCompanyId;
    
    setTransactions(allTransactions.filter(t => t.companyId === currentCompanyId || (!t.companyId && showUnassigned)));
    setCustomers(allCustomers.filter(c => c.companyId === currentCompanyId || (!c.companyId && showUnassigned)));
    setSuppliers(allSuppliers.filter(s => s.companyId === currentCompanyId || (!s.companyId && showUnassigned)));
    setProducts(allProducts.filter(p => p.companyId === currentCompanyId || (!p.companyId && showUnassigned)));
    
    // Update companyInfo to match current company if it exists in DB
    if (currentCompanyId) {
      const current = companies.find(c => c.id === currentCompanyId);
      if (current) {
        setCompanyInfo(current);
      }
    }
  }, [allTransactions, allCustomers, allSuppliers, allProducts, currentCompanyId, companies]);

  const handleSetCurrentCompanyId = (id: string | null) => {
    if (id === null) {
      setCurrentCompanyId(null);
      localStorage.removeItem('@FinancialArchitect:currentCompanyId');
      return;
    }
    const targetCompany = companies.find(c => c.id === id);
    if (targetCompany && targetCompany.pin) {
      setPendingCompanyId(id);
      setPinModalOpen(true);
      setPinError('');
    } else {
      setCurrentCompanyId(id);
      localStorage.setItem('@FinancialArchitect:currentCompanyId', id);
    }
  };

  const handlePinSubmit = (pin: string) => {
    if (!pendingCompanyId) return;
    
    const targetCompany = companies.find(c => c.id === pendingCompanyId);
    if (targetCompany && targetCompany.pin === pin) {
      setCurrentCompanyId(pendingCompanyId);
      localStorage.setItem('@FinancialArchitect:currentCompanyId', pendingCompanyId);
      setPinModalOpen(false);
      setPendingCompanyId(null);
      setPinError('');
    } else {
      setPinError(t('pinModal.incorrectPin', 'PIN incorreto'));
    }
  };

  const handlePinCancel = () => {
    setPinModalOpen(false);
    setPendingCompanyId(null);
    setPinError('');
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      const companyKey = currentCompanyId || 'default';
      const nextReceiptNumber = (lastReceiptNumberRef.current[companyKey] || 0) + 1;
      lastReceiptNumberRef.current[companyKey] = nextReceiptNumber;

      const newTransaction: Omit<Transaction, 'id'> = { 
        ...transaction, 
        userId: user.uid, 
        receiptNumber: nextReceiptNumber
      };
      
      if (currentCompanyId) {
        newTransaction.companyId = currentCompanyId;
      }
      
      await addDoc(collection(db, 'transactions'), newTransaction);

      const currentStocks: Record<string, number> = {};
      const getStock = (productId: string) => {
        if (currentStocks[productId] !== undefined) return currentStocks[productId];
        const product = allProducts.find(p => p.id === productId);
        return product ? product.stock : 0;
      };

      // Synchronize stock for single product
      if (newTransaction.productId && newTransaction.quantity) {
        let stock = getStock(newTransaction.productId);
        if (newTransaction.type === 'receita') stock -= newTransaction.quantity;
        else if (newTransaction.type === 'despesa') stock += newTransaction.quantity;
        currentStocks[newTransaction.productId] = stock;
      }

      // Synchronize stock for multiple items
      if (newTransaction.items && newTransaction.items.length > 0) {
        for (const item of newTransaction.items) {
          let stock = getStock(item.productId);
          if (newTransaction.type === 'receita') stock -= item.quantity;
          else if (newTransaction.type === 'despesa') stock += item.quantity;
          currentStocks[item.productId] = stock;
        }
      }

      // Save all changes to Firestore
      for (const [productId, stock] of Object.entries(currentStocks)) {
        if (allProducts.some(p => p.id === productId)) {
          await updateProduct(productId, { stock });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const transactionToDelete = allTransactions.find(t => t.id === id);
      await deleteDoc(doc(db, 'transactions', id));

      const currentStocks: Record<string, number> = {};
      const getStock = (productId: string) => {
        if (currentStocks[productId] !== undefined) return currentStocks[productId];
        const product = allProducts.find(p => p.id === productId);
        return product ? product.stock : 0;
      };

      // Revert stock synchronization for single product
      if (transactionToDelete && transactionToDelete.productId && transactionToDelete.quantity) {
        let stock = getStock(transactionToDelete.productId);
        if (transactionToDelete.type === 'receita') stock += transactionToDelete.quantity;
        else if (transactionToDelete.type === 'despesa') stock -= transactionToDelete.quantity;
        currentStocks[transactionToDelete.productId] = stock;
      }

      // Revert stock synchronization for multiple items
      if (transactionToDelete && transactionToDelete.items && transactionToDelete.items.length > 0) {
        for (const item of transactionToDelete.items) {
          let stock = getStock(item.productId);
          if (transactionToDelete.type === 'receita') stock += item.quantity;
          else if (transactionToDelete.type === 'despesa') stock -= item.quantity;
          currentStocks[item.productId] = stock;
        }
      }

      // Save all changes to Firestore
      for (const [productId, stock] of Object.entries(currentStocks)) {
        if (allProducts.some(p => p.id === productId)) {
          await updateProduct(productId, { stock });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const updateTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    if (!user) return;
    try {
      const oldTransaction = allTransactions.find(t => t.id === id);
      await updateDoc(doc(db, 'transactions', id), updatedData);

      // Synchronize stock
      if (oldTransaction) {
        const newTransaction = { ...oldTransaction, ...updatedData };
        const currentStocks: Record<string, number> = {};
        
        const getStock = (productId: string) => {
          if (currentStocks[productId] !== undefined) return currentStocks[productId];
          const product = allProducts.find(p => p.id === productId);
          return product ? product.stock : 0;
        };

        // Revert old single product
        if (oldTransaction.productId && oldTransaction.quantity) {
          let stock = getStock(oldTransaction.productId);
          if (oldTransaction.type === 'receita') stock += oldTransaction.quantity;
          else if (oldTransaction.type === 'despesa') stock -= oldTransaction.quantity;
          currentStocks[oldTransaction.productId] = stock;
        }

        // Revert old items
        if (oldTransaction.items && oldTransaction.items.length > 0) {
          for (const item of oldTransaction.items) {
            let stock = getStock(item.productId);
            if (oldTransaction.type === 'receita') stock += item.quantity;
            else if (oldTransaction.type === 'despesa') stock -= item.quantity;
            currentStocks[item.productId] = stock;
          }
        }

        // Apply new single product
        if (newTransaction.productId && newTransaction.quantity) {
          let stock = getStock(newTransaction.productId);
          if (newTransaction.type === 'receita') stock -= newTransaction.quantity;
          else if (newTransaction.type === 'despesa') stock += newTransaction.quantity;
          currentStocks[newTransaction.productId] = stock;
        }

        // Apply new items
        if (newTransaction.items && newTransaction.items.length > 0) {
          for (const item of newTransaction.items) {
            let stock = getStock(item.productId);
            if (newTransaction.type === 'receita') stock -= item.quantity;
            else if (newTransaction.type === 'despesa') stock += item.quantity;
            currentStocks[item.productId] = stock;
          }
        }

        // Save all changes to Firestore
        for (const [productId, stock] of Object.entries(currentStocks)) {
          if (allProducts.some(p => p.id === productId)) {
            await updateProduct(productId, { stock });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    if (!user) return;
    try {
      const newCustomer = { ...customer, userId: user.uid };
      if (currentCompanyId) {
        newCustomer.companyId = currentCompanyId;
      }
      await addDoc(collection(db, 'customers'), newCustomer);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customers');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
    }
  };

  const updateCustomer = async (id: string, updatedData: Partial<Customer>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'customers', id), updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (!user) return;
    try {
      const newSupplier = { ...supplier, userId: user.uid };
      if (currentCompanyId) {
        newSupplier.companyId = currentCompanyId;
      }
      await addDoc(collection(db, 'suppliers'), newSupplier);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'suppliers');
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
    }
  };

  const updateSupplier = async (id: string, updatedData: Partial<Supplier>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'suppliers', id), updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `suppliers/${id}`);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) return;
    try {
      const newProduct = { ...product, userId: user.uid };
      if (currentCompanyId) {
        newProduct.companyId = currentCompanyId;
      }
      await addDoc(collection(db, 'products'), newProduct);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const updateProduct = async (id: string, updatedData: Partial<Product>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'products', id), updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const addCompany = async (company: Omit<CompanyInfo, 'id'>) => {
    if (!user) return;
    try {
      // Default 14 days trial
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 14);
      
      const newCompany = { 
        ...company, 
        userId: user.uid,
        createdAt: new Date().toISOString(),
        subscription: {
          status: 'active',
          validUntil: validUntil.toISOString(),
          plan: 'Trial',
          price: 0
        }
      };
      
      const docRef = await addDoc(collection(db, 'companies'), newCompany);
      if (!currentCompanyId) {
        handleSetCurrentCompanyId(docRef.id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'companies');
    }
  };

  const updateCompany = async (id: string, updatedData: Partial<CompanyInfo>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'companies', id), updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `companies/${id}`);
    }
  };

  const deleteCompany = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'companies', id));
      if (currentCompanyId === id) {
        const remaining = companies.filter(c => c.id !== id);
        if (remaining.length > 0) {
          handleSetCurrentCompanyId(remaining[0].id);
        } else {
          setCurrentCompanyId(null);
          localStorage.removeItem('@FinancialArchitect:currentCompanyId');
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `companies/${id}`);
    }
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    if (currentCompanyId) {
      updateCompany(currentCompanyId, info);
    } else {
      console.warn("Attempted to update company without currentCompanyId");
    }
  };

  return (
    <AppContext.Provider value={{ 
      transactions, addTransaction, deleteTransaction, updateTransaction,
      customers, addCustomer, deleteCustomer, updateCustomer,
      suppliers, addSupplier, deleteSupplier, updateSupplier,
      products, addProduct, deleteProduct, updateProduct,
      companies, currentCompanyId, setCurrentCompanyId: handleSetCurrentCompanyId,
      addCompany, updateCompany, deleteCompany,
      companyInfo, updateCompanyInfo,
      globalSearchTerm, setGlobalSearchTerm,
      loading
    }}>
      {children}
      
      {pinModalOpen && pendingCompanyId && (
        <PinModal
          isOpen={pinModalOpen}
          companyName={companies.find(c => c.id === pendingCompanyId)?.name || ''}
          onConfirm={handlePinSubmit}
          onCancel={handlePinCancel}
          error={pinError}
        />
      )}
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
