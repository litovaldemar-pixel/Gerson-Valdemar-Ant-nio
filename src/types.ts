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
  logoUrl?: string;
  subscription?: Subscription;
  pin?: string;
  sector?: 'servicos' | 'comercio' | 'misto';
  ivaRate?: number;
  description?: string;
  constitution?: string;
  nuel?: string;
  partners?: string;
  monthlySalesGoal?: number;
}

export type TransactionType = 'receita' | 'despesa' | 'cotacao';
export type MeasurementUnit = 'un' | 'kg' | 'lt' | 'mt' | 'cx' | 'pct' | 'par' | 'saco' | 'fardo';

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit?: MeasurementUnit;
  ivaRate?: number;
  ivaAmount?: number;
}

export interface Transaction {
  id: string;
  userId?: string;
  companyId?: string;
  date: string;
  dueDate?: string;
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
  ivaRate?: number;
  ivaAmount?: number;
  discount?: number;
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
  expiryDate?: string;
  batchNumber?: string;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
}

export const getCategoryTranslationKey = (category: string): string => {
  const map: Record<string, string> = {
    'Operacional': 'operational',
    'Marketing': 'marketing',
    'Pessoal': 'personnel',
    'Salário': 'salary',
    'Assistência Médica': 'medicalAssistance',
    'Infraestrutura': 'infrastructure',
    'Água': 'water',
    'Energia': 'energy',
    'Renda': 'rent',
    'Combustível': 'fuel',
    'Estado': 'stateTaxes',
    'Serviços': 'services',
    'SaaS': 'saas',
    'Produto': 'product',
    'Outras Despesas': 'otherExpenses',
    'Vendas': 'vendas'
  };
  return map[category] || category.toLowerCase().replace(/ /g, '');
};
