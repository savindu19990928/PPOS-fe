export interface User {
  username: string;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  selling_price: string;
  unit_of_measure: number;
  unit_of_measure_name: string;
  unit_abbreviation: string;
  current_stock: string;
  is_active: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

export interface SaleItem {
  product: number;
  product_name?: string;
  quantity: string;
  unit_price: string;
  subtotal?: string;
  unit_abbreviation?: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  subtotal?: string;
  discount?: string;
  total: string;
  amount_paid?: string;
  change?: string;
  payment_method: string;
  customer_name: string;
  mobile_number?: string;
  notes?: string;
  is_corrected: boolean;
  correction_reason?: string | null;
  created_at: string;
  corrected_at?: string | null;
  cash_register?: number;
  created_by?: number;
  corrected_by?: number | null;
  original_sale?: number | null;
  created_by_name: string;
  cash_register_name?: string;
  corrected_by_name?: string | null;
  items_count: number;
  items?: SaleItem[];
  corrections?: any[];
}

export interface CashRegister {
  id: number;
  name: string;
  is_active: boolean;
  current_balance: string;
}

export interface CashTransaction {
  id: number;
  transaction_type: 'CASH_IN' | 'CASH_OUT' | 'SALE';
  amount: string;
  notes: string;
  created_at: string;
  created_by_name: string;
  denominations?: any[];
}

export interface LoginResponse {
  access: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BillItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Denomination {
  id: number;
  value: string;
  denomination_type: 'NOTE' | 'COIN';
  display_order: number;
}