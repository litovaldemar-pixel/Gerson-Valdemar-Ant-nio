export interface CompanyInfo {
  name: string;
  nuit: string;
  contact: string;
  location: string;
}

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  value: number;
  productId?: string;
  quantity?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  document: string;
  status: 'Ativo' | 'Inativo';
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  document: string;
  category: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplierId?: string;
}
