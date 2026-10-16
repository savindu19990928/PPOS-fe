export type UserRole = 'ADMIN' | 'CASHIER';

export interface User {
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_staff?: boolean;
  is_superuser?: boolean;
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
  id?: number;
  product: number;
  product_name?: string;
  quantity: string;
  unit_price: string;
  subtotal?: string;
  unit_abbreviation?: string;
}

export interface ReprintHistoryItem {
  id: number;
  reprinted_by_id: number;
  reprinted_by_username: string;
  reprinted_by_name: string;
  reprinted_at: string;
  customer_name_used?: string;
  reason?: string;
}

export interface OriginalBillData {
  printed_by_id: number;
  printed_by_username: string;
  printed_by_name: string;
  printed_at: string;
  cash_register_id?: number;
  cash_register_name?: string;
}

export interface ReprintingData {
  reprinted_by_id: number;
  reprinted_by_username: string;
  reprinted_by_name: string;
  reprinted_at: string;
  reprint_count: number;
  reprint_history: ReprintHistoryItem[];
}

export interface Sale {
  id: number;
  sale_number: string;
  status: 'COMPLETED' | 'CANCELLED' | 'REPRINTED' | string;
  subtotal?: string;
  discount?: string;
  total: string;
  amount_paid?: string;
  change?: string;
  payment_method: string;
  customer_name: string;
  mobile_number?: string;
  notes?: string;
  cash_register?: number;
  cash_register_name?: string;
  created_by?: number;
  created_by_id?: number;
  created_by_name: string;
  created_at: string;
  items_count?: number;
  items?: SaleItem[];
  denominations?: any[];

  // Cancel tracking
  cancelled_by?: number | null;
  cancelled_by_id?: number | null;
  cancelled_by_name?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;

  // Reprint tracking
  reprinted_by?: number | null;
  reprinted_by_id?: number | null;
  reprinted_by_name?: string | null;
  reprinted_at?: string | null;
  reprint_count?: number;
  reprint_history?: ReprintHistoryItem[];
  original_bill_data?: OriginalBillData;
  reprinting_data?: ReprintingData;

  // Correction fields
  is_corrected?: boolean;
  correction_reason?: string | null;
  corrected_at?: string | null;
  corrected_by?: number | null;
  corrected_by_name?: string | null;
  original_sale?: number | null;
  corrections?: any[];
}

export interface SaleFilterParams {
  page?: number;
  search?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  payment_method?: string;
  status?: string;
  customer_name?: string;
  mobile_number?: string;
  bill_id?: string;
  ordering?: string;
}

export interface CancelSalePayload {
  cancellation_reason?: string;
}

export interface CancelSaleResponse {
  message: string;
  sale: Sale;
}

export interface ReprintSalePayload {
  customer_name?: string;
  reason?: string;
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
  refresh?: string;
  user?: User;
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

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  product_barcode: string;
  product_unit: string;
  movement_type: StockMovementType;
  movement_type_display?: string;
  quantity: string;
  unit_cost?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  sale?: number | null;
  sale_number?: string | null;
}

export interface StockMovementFilterParams {
  page?: number;
  product?: number;
  barcode?: string;
  movement_type?: StockMovementType | '';
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
}

export interface CreateStockMovementPayload {
  product: number;
  movement_type: StockMovementType;
  quantity: string | number;
  unit_cost?: string | number;
  reference_number?: string;
  notes?: string;
}

export interface BulkCreateMovementItem {
  product: number;
  movement_type: StockMovementType;
  quantity: string | number;
  unit_cost?: string | number;
  notes?: string;
}

export interface BulkCreateStockMovementsPayload {
  reference_number?: string;
  notes?: string;
  movements: BulkCreateMovementItem[];
}

export interface BulkCreateStockMovementsResponse {
  message: string;
  count: number;
  movements: StockMovement[];
}

export interface StockMovementSummary {
  total_movements: number;
  stock_in: {
    count: number;
    total_quantity: string;
    total_cost?: string;
  };
  stock_out: {
    count: number;
    total_quantity: string;
  };
  adjustment: {
    count: number;
    total_quantity: string;
  };
}

// ==========================================
// Customer Credit Profile & Debt Tracking
// ==========================================

export interface CustomerCreditPayment {
  id: number;
  receipt_number: string;
  customer: number;
  customer_name: string;
  customer_mobile: string;
  sale?: number | null;
  sale_number?: string | null;
  amount: string;
  payment_method: string;
  cash_register?: number | null;
  cash_register_name?: string | null;
  notes?: string;
  collected_by_id: number;
  collected_by_name: string;
  collected_at?: string;
  created_at?: string;
}

export interface CustomerCreditSaleMini {
  id: number;
  sale_number: string;
  created_at: string;
  total: string;
  amount_paid: string;
  remaining_due: string;
  status: string;
  is_printed?: boolean;
}

export interface CustomerCreditProfile {
  id: number;
  customer_name: string;
  mobile_number: string;
  credit_limit?: string | null;
  is_banned: boolean;
  ban_reason?: string;
  notes?: string;
  total_credit: string;
  total_paid: string;
  current_balance: string;
  credit_sales_count?: number;
  sales?: CustomerCreditSaleMini[];
  payments?: CustomerCreditPayment[];
  created_at: string;
  updated_at: string;
}

export interface CreditProfileFilterParams {
  mobile_number?: string;
  customer_name?: string;
  search?: string;
  has_due?: boolean | string;
  is_banned?: boolean | string;
  ordering?: string;
  page?: number;
}

export interface CollectPaymentPayload {
  amount: string | number;
  payment_method?: 'CASH' | 'CARD' | string;
  cash_register?: number | null;
  sale?: number | null;
  notes?: string;
}

export interface CollectPaymentResponse {
  message: string;
  receipt_number: string;
  payment: CustomerCreditPayment;
  remaining_balance: string;
}

export interface CreateCreditProfilePayload {
  customer_name: string;
  mobile_number: string;
  credit_limit?: string | number | null;
  notes?: string;
  is_banned?: boolean;
  ban_reason?: string;
}