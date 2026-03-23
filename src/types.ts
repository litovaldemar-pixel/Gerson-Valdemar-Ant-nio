export interface Subscription {
  status: 'active' | 'inactive' | 'pending';
  validUntil: string;
  plan: string;
  price: number;
}

export interface CompanyInfo {
  id: string;
  name: string;
  nuit: string;
  contact: string;
  location: string;
  userId?: string;
  subscription?: Subscription;
  pin?: string;
}

export type TransactionType = 'receita' | 'despesa';
export type MeasurementUnit = 'un' | 'kg' | 'lt' | 'mt' | 'cx' | 'pct' | 'par' | 'saco' | 'fardo';

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit?: MeasurementUnit;
}

export interface Transaction {
  id: string;
  userId?: string;
  companyId?: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  value: number;
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  unit?: MeasurementUnit;
  customerId?: string;
  supplierId?: string;
  paymentMethod?: string;
  paymentStatus?: 'pago' | 'pendente';
  items?: TransactionItem[];
  receiptNumber?: number;
}

export interface Customer {
  id: string;
  companyId?: string;
  name: string;
  email: string;
  document: string;
  status: 'Ativo' | 'Inativo';
}

export interface Supplier {
  id: string;
  companyId?: string;
  name: string;
  email: string;
  document: string;
  category: string;
}

export interface Product {
  id: string;
  companyId?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit?: MeasurementUnit;
  purchaseUnit?: MeasurementUnit;
  conversionFactor?: number;
  supplierId?: string;
}
