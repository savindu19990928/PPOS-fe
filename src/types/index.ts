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
  minimum_stock_level?: string;
  barcode_image?: string;
  supplier?: number | null;
  supplier_name?: string | null;
  supplier_phone?: string | null;
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

// ==========================================
// Supplier Management & Supply Tracking
// ==========================================

export interface SupplierProduct {
  id: number;
  name: string;
  barcode: string;
  barcode_image?: string;
  selling_price: string;
  current_stock: string;
  minimum_stock_level?: string;
  unit_abbreviation?: string;
  unit_of_measure?: number;
  unit_of_measure_name?: string;
  supplier?: number;
  supplier_name?: string;
  supplier_phone?: string;
  is_active: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  amount_owed: string;
  payment_due_date?: string | null;
  is_payment_overdue?: boolean;
  days_until_payment_due?: number | null;
  refund_owed: string;
  refund_due_date?: string | null;
  is_refund_overdue?: boolean;
  days_until_refund_due?: number | null;
  next_supply_date?: string | null;
  next_supply_notes?: string;
  days_until_next_supply?: number | null;
  products_count?: number;
  products?: SupplierProduct[];
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierFilterParams {
  page?: number;
  search?: string;
  is_active?: boolean | string;
  has_amount_owed?: boolean | string;
  has_refund_owed?: boolean | string;
  has_next_supply?: boolean | string;
  ordering?: string;
}

export interface CreateSupplierPayload {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  amount_owed?: string;
  payment_due_date?: string | null;
  refund_owed?: string;
  refund_due_date?: string | null;
  next_supply_date?: string | null;
  next_supply_notes?: string;
  notes?: string;
  is_active?: boolean;
}

export interface MarkNextSupplyPayload {
  next_supply_date: string;
  next_supply_notes?: string;
}

export interface MarkNextSupplyResponse {
  message: string;
  supplier: Supplier;
}

export interface RecordSupplierPaymentPayload {
  amount: string | number;
  new_payment_due_date?: string | null;
  notes?: string;
}

export interface RecordSupplierPaymentResponse {
  message: string;
  amount_paid: string;
  remaining_amount_owed: string;
  payment_due_date?: string | null;
  supplier: Supplier;
}

export interface RecordSupplierRefundPayload {
  amount: string | number;
  notes?: string;
}

export interface RecordSupplierRefundResponse {
  message: string;
  amount_received: string;
  remaining_refund_owed: string;
  refund_due_date?: string | null;
  supplier: Supplier;
}

// Next Supplying Items
export interface NextSupplyingItem {
  product_id: number;
  product_name: string;
  barcode: string;
  selling_price: string;
  current_stock: string;
  minimum_stock_level: string;
  unit_abbreviation?: string;
  is_low_stock: boolean;
  supplier_id: number;
  supplier_name: string;
  supplier_phone?: string;
  supplier_contact_person?: string;
  next_supply_date: string;
  days_until_supply: number;
  supply_status: 'TODAY' | 'UPCOMING' | 'OVERDUE' | string;
  notes?: string;
}

export interface NextSupplyingItemsResponse {
  total_items: number;
  total_suppliers_scheduled: number;
  summary: {
    scheduled_today_count: number;
    scheduled_upcoming_count: number;
    scheduled_overdue_count: number;
    low_stock_items_count: number;
  };
  items: NextSupplyingItem[];
}

export interface NextSupplyingItemsParams {
  supplier_id?: number;
  date_from?: string;
  date_to?: string;
  only_low_stock?: boolean;
}

// Upcoming Supplier Payments & Refunds
export interface SupplierPayableItem {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  amount_owed: string;
  payment_due_date: string;
  days_until_due: number;
  is_overdue: boolean;
  status: 'OVERDUE' | 'UPCOMING' | string;
  notes?: string;
}

export interface SupplierRefundItem {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  refund_owed: string;
  refund_due_date: string;
  days_until_due: number;
  is_overdue: boolean;
  status: 'OVERDUE' | 'UPCOMING' | string;
  notes?: string;
}

export interface SupplierPaymentsSummaryResponse {
  summary: {
    total_amount_we_owe: string;
    total_refunds_owed_to_us: string;
    net_balance: string;
    overdue_payables_count: number;
    upcoming_payables_count: number;
    overdue_refunds_count: number;
    upcoming_refunds_count: number;
  };
  payments_to_pay: SupplierPayableItem[];
  refunds_to_receive: SupplierRefundItem[];
}

export interface SupplierPaymentsParams {
  type?: 'payables' | 'refunds' | 'all';
  is_overdue?: boolean;
  due_within_days?: number;
}

// Supplier Alerts & Notifications
export interface SupplierNotification {
  id: string;
  category: 'SUPPLIER_PAYMENT_DUE' | 'SUPPLIER_REFUND_DUE' | 'UPCOMING_SUPPLY' | 'LOW_STOCK' | string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | string;
  title: string;
  message: string;
  due_date?: string;
  days_remaining?: number;
  amount?: string;
  supplier_id?: number;
  supplier_name?: string;
  product_id?: number;
  product_name?: string;
  current_stock?: string;
  minimum_stock_level?: string;
}

export interface NotificationsResponse {
  summary: {
    total_notifications: number;
    critical_count: number;
    warning_count: number;
    info_count: number;
    supplier_payables_alert_count: number;
    supplier_refunds_alert_count: number;
    upcoming_supplies_alert_count: number;
    low_stock_alert_count: number;
  };
  notifications: SupplierNotification[];
}

// ==========================================
// Electron Native API & Auto-Updater Types
// ==========================================

export interface UpdateStatusData {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string | any;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  error?: string;
  isDev?: boolean;
}

export interface ElectronAPI {
  ping: () => string;
  isElectron: boolean;
  printReceipt: (options: { html: string; silent?: boolean; deviceName?: string }) => Promise<{ success: boolean; error?: string }>;
  getPrinters: () => Promise<Array<{ name: string; displayName: string; isDefault: boolean }>>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (callback: (data: UpdateStatusData) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}