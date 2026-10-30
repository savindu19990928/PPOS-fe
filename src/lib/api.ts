import {
  Sale,
  SaleFilterParams,
  CancelSalePayload,
  CancelSaleResponse,
  ReprintSalePayload,
  PaginatedResponse,
  Product,
  UnitOfMeasure,
  CreateUnitPayload,
  UpdateUnitPayload,
  UnitOfMeasureFilterParams,
  Denomination,
  LoginResponse,
  User,
  StockMovement,
  StockMovementFilterParams,
  CreateStockMovementPayload,
  BulkCreateStockMovementsPayload,
  StockMovementSummary,
  CustomerCreditProfile,
  CreditProfileFilterParams,
  CollectPaymentPayload,
  CollectPaymentResponse,
  CreateCreditProfilePayload,
  BulkCreateStockMovementsResponse,
  Supplier,
  SupplierProduct,
  SupplierFilterParams,
  CreateSupplierPayload,
  MarkNextSupplyPayload,
  MarkNextSupplyResponse,
  RecordSupplierPaymentPayload,
  RecordSupplierPaymentResponse,
  RecordSupplierRefundPayload,
  RecordSupplierRefundResponse,
  NextSupplyingItemsResponse,
  NextSupplyingItemsParams,
  NotificationsResponse,
  CreateProductPayload,
  UpdateProductPayload,
  ProductFilterParams,
  DeleteProductResponse,
  CreateUserPayload,
  UserFilterParams,
  BlockUserResponse,
  UserHistoryResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
  SupplierPaymentsSummaryResponse,
  SupplierPaymentsParams
} from '../types';

const BASE_URL = 'https://ppos.devrious.lk';

export const api = {
  getToken: () => localStorage.getItem('access_token'),
  setToken: (token: string) => localStorage.setItem('access_token', token),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setRefreshToken: (token: string) => localStorage.setItem('refresh_token', token),
  getStoredUser: (): User | null => {
    try {
      const data = localStorage.getItem('auth_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setStoredUser: (user: User) =>
    localStorage.setItem('auth_user', JSON.stringify(user)),
  removeToken: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('username');
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined)
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : String(errorData.non_field_errors);
        } else {
          // Flatten field errors if any
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const val = errorData[firstKey];
            errorMessage = `${firstKey}: ${Array.isArray(val) ? val.join(' ') : val}`;
          }
        }
      } catch {
        // Fallback to HTTP status text
        errorMessage = response.statusText || `Error ${response.status}`;
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }

    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  // Auth & Profile
  login: (credentials: { username: string; password: string }): Promise<LoginResponse> =>
    api.request<LoginResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getMe: (): Promise<User> => api.request<User>('/api/auth/me/'),

  getProfile: (): Promise<User> => api.request<User>('/api/profile/'),

  changePassword: (data: ChangePasswordPayload): Promise<ChangePasswordResponse> =>
    api.request<ChangePasswordResponse>('/api/profile/change-password/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  refreshToken: (refresh: string): Promise<{ access: string }> =>
    api.request<{ access: string }>('/api/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh })
    }),

  // Products (All Users: View/Search. Admin Only: Create, Update, Delete)
  getProducts: async (paramsOrSearch?: ProductFilterParams | string): Promise<Product[]> => {
    const q = new URLSearchParams();
    if (typeof paramsOrSearch === 'string') {
      if (paramsOrSearch) q.set('search', paramsOrSearch);
    } else if (paramsOrSearch) {
      if (paramsOrSearch.search) q.set('search', paramsOrSearch.search);
      if (paramsOrSearch.barcode) q.set('barcode', paramsOrSearch.barcode);
      if (paramsOrSearch.is_active !== undefined && paramsOrSearch.is_active !== '') {
        q.set('is_active', String(paramsOrSearch.is_active));
      }
      if (paramsOrSearch.supplier) q.set('supplier', String(paramsOrSearch.supplier));
      if (paramsOrSearch.ordering) q.set('ordering', paramsOrSearch.ordering);
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await api.request<any>(`/api/products/${qs}`);
    return Array.isArray(res) ? res : res.results || [];
  },

  getProductsPaginated: (
    pageOrParams: ProductFilterParams | number = 1,
    legacySearch?: string
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (typeof pageOrParams === 'number') {
      params.set('page', String(pageOrParams));
      if (legacySearch) params.set('search', legacySearch);
    } else {
      const f = pageOrParams;
      if (f.page) params.set('page', String(f.page));
      if (f.search) params.set('search', f.search);
      if (f.barcode) params.set('barcode', f.barcode);
      if (f.is_active !== undefined && f.is_active !== '') {
        params.set('is_active', String(f.is_active));
      }
      if (f.supplier) params.set('supplier', String(f.supplier));
      if (f.ordering) params.set('ordering', f.ordering);
    }
    return api.request<PaginatedResponse<Product>>(`/api/products/?${params.toString()}`);
  },

  getProductByBarcode: (barcode: string) =>
    api.request<Product[]>(`/api/products/?barcode=${encodeURIComponent(barcode)}`),

  getProductDetails: (id: number): Promise<Product> =>
    api.request<Product>(`/api/products/${id}/`),

  createProduct: (data: CreateProductPayload): Promise<Product> =>
    api.request<Product>('/api/products/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProduct: (id: number, data: UpdateProductPayload): Promise<Product> =>
    api.request<Product>(`/api/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  replaceProduct: (id: number, data: CreateProductPayload): Promise<Product> =>
    api.request<Product>(`/api/products/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteProduct: (id: number): Promise<DeleteProductResponse | void> =>
    api.request<DeleteProductResponse | void>(`/api/products/${id}/`, {
      method: 'DELETE'
    }),

  // Sales (Cashier & Admin: createSale. Admin only: getSales, getSaleDetails, cancelSale, reprintSale, correctSale)
  createSale: (data: any): Promise<Sale> =>
    api.request<Sale>('/api/sales/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSales: (
    filterOrPage: SaleFilterParams | number = 1,
    legacySearch?: string
  ): Promise<PaginatedResponse<Sale>> => {
    const params = new URLSearchParams();

    if (typeof filterOrPage === 'number') {
      params.set('page', String(filterOrPage));
      if (legacySearch) params.set('search', legacySearch);
    } else {
      const filters = filterOrPage;
      if (filters.page) params.set('page', String(filters.page));
      if (filters.search) params.set('search', filters.search);
      if (filters.date) params.set('date', filters.date);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      if (filters.payment_method) params.set('payment_method', filters.payment_method);
      if (filters.status) params.set('status', filters.status);
      if (filters.customer_name) params.set('customer_name', filters.customer_name);
      if (filters.mobile_number) params.set('mobile_number', filters.mobile_number);
      if (filters.bill_id) params.set('bill_id', filters.bill_id);
      if (filters.ordering) params.set('ordering', filters.ordering);
    }

    return api.request<PaginatedResponse<Sale>>(`/api/sales/?${params.toString()}`);
  },

  getTodaySales: (page = 1): Promise<PaginatedResponse<Sale>> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    return api.request<PaginatedResponse<Sale>>(`/api/sales/today/?${params.toString()}`);
  },

  getSaleDetails: (id: number): Promise<Sale> => api.request<Sale>(`/api/sales/${id}/`),

  cancelSale: (id: number, data?: CancelSalePayload): Promise<CancelSaleResponse> =>
    api.request<CancelSaleResponse>(`/api/sales/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    }),

  reprintSale: (id: number, data?: ReprintSalePayload): Promise<Sale> =>
    api.request<Sale>(`/api/sales/${id}/reprint/`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    }),

  correctSale: (id: number, data: any): Promise<any> =>
    api.request<any>(`/api/sales/${id}/correct_sale/`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Stock Movements (Admin Only)
  getStockMovements: (
    filterOrPage: StockMovementFilterParams | number = 1
  ): Promise<PaginatedResponse<StockMovement>> => {
    const params = new URLSearchParams();
    if (typeof filterOrPage === 'number') {
      params.set('page', String(filterOrPage));
    } else {
      const f = filterOrPage;
      if (f.page) params.set('page', String(f.page));
      if (f.product) params.set('product', String(f.product));
      if (f.barcode) params.set('barcode', f.barcode);
      if (f.movement_type) params.set('movement_type', f.movement_type);
      if (f.date_from) params.set('date_from', f.date_from);
      if (f.date_to) params.set('date_to', f.date_to);
      if (f.search) params.set('search', f.search);
      if (f.ordering) params.set('ordering', f.ordering);
    }
    return api.request<PaginatedResponse<StockMovement>>(`/api/stock-movements/?${params.toString()}`);
  },

  getStockMovementDetails: (id: number): Promise<StockMovement> =>
    api.request<StockMovement>(`/api/stock-movements/${id}/`),

  createStockMovement: (data: CreateStockMovementPayload): Promise<StockMovement> =>
    api.request<StockMovement>('/api/stock-movements/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateStockMovement: (
    id: number,
    data: { reference_number?: string; notes?: string }
  ): Promise<StockMovement> =>
    api.request<StockMovement>(`/api/stock-movements/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteStockMovement: (id: number): Promise<void> =>
    api.request<void>(`/api/stock-movements/${id}/`, {
      method: 'DELETE'
    }),

  bulkCreateStockMovements: (
    data: BulkCreateStockMovementsPayload
  ): Promise<BulkCreateStockMovementsResponse> =>
    api.request<BulkCreateStockMovementsResponse>('/api/stock-movements/bulk-create/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getStockMovementsSummary: (params?: {
    date_from?: string;
    date_to?: string;
    product?: number;
  }): Promise<StockMovementSummary> => {
    const q = new URLSearchParams();
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.product) q.set('product', String(params.product));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<StockMovementSummary>(`/api/stock-movements/summary/${qs}`);
  },

  getProductStockMovements: (
    productId: number,
    params?: { movement_type?: string; date_from?: string; date_to?: string; page?: number }
  ): Promise<PaginatedResponse<StockMovement>> => {
    const q = new URLSearchParams();
    if (params?.movement_type) q.set('movement_type', params.movement_type);
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.page) q.set('page', String(params.page));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<PaginatedResponse<StockMovement>>(`/api/products/${productId}/stock-movements/${qs}`);
  },

  // Units of Measure (Admin Only Management & Dropdown Usage)
  getUnits: (params?: UnitOfMeasureFilterParams): Promise<UnitOfMeasure[]> => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.ordering) q.set('ordering', params.ordering);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<UnitOfMeasure[]>(`/api/units/${qs}`);
  },

  getUnitDetails: (id: number): Promise<UnitOfMeasure> =>
    api.request<UnitOfMeasure>(`/api/units/${id}/`),

  createUnit: (data: CreateUnitPayload): Promise<UnitOfMeasure> =>
    api.request<UnitOfMeasure>('/api/units/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateUnit: (id: number, data: UpdateUnitPayload): Promise<UnitOfMeasure> =>
    api.request<UnitOfMeasure>(`/api/units/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  replaceUnit: (id: number, data: CreateUnitPayload): Promise<UnitOfMeasure> =>
    api.request<UnitOfMeasure>(`/api/units/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteUnit: (id: number): Promise<void> =>
    api.request<void>(`/api/units/${id}/`, {
      method: 'DELETE'
    }),

  getUnitProducts: (id: number): Promise<Product[]> =>
    api.request<Product[]>(`/api/units/${id}/products/`),

  // Denominations
  getDenominations: (): Promise<Denomination[]> => api.request<Denomination[]>('/api/denominations/'),

  // Customer Credit Profiles & Debt Tracking (Cashier & Admin)
  getCreditProfiles: (
    params?: CreditProfileFilterParams | number
  ): Promise<PaginatedResponse<CustomerCreditProfile> | CustomerCreditProfile[]> => {
    const q = new URLSearchParams();
    if (typeof params === 'number') {
      q.set('page', String(params));
    } else if (params) {
      if (params.page) q.set('page', String(params.page));
      if (params.mobile_number) q.set('mobile_number', params.mobile_number);
      if (params.customer_name) q.set('customer_name', params.customer_name);
      if (params.search) q.set('search', params.search);
      if (params.has_due !== undefined && params.has_due !== '') q.set('has_due', String(params.has_due));
      if (params.is_banned !== undefined && params.is_banned !== '') q.set('is_banned', String(params.is_banned));
      if (params.ordering) q.set('ordering', params.ordering);
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<PaginatedResponse<CustomerCreditProfile> | CustomerCreditProfile[]>(`/api/credit-profiles/${qs}`);
  },

  getCreditProfileDetails: (id: number): Promise<CustomerCreditProfile> =>
    api.request<CustomerCreditProfile>(`/api/credit-profiles/${id}/`),

  collectCreditPayment: (
    id: number,
    data: CollectPaymentPayload
  ): Promise<CollectPaymentResponse> =>
    api.request<CollectPaymentResponse>(`/api/credit-profiles/${id}/collect-payment/`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  banCreditCustomer: (
    id: number,
    reason?: string
  ): Promise<{ message: string; is_banned: boolean; ban_reason: string }> =>
    api.request<{ message: string; is_banned: boolean; ban_reason: string }>(`/api/credit-profiles/${id}/ban/`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || '' })
    }),

  unbanCreditCustomer: (
    id: number
  ): Promise<{ message: string; is_banned: boolean; ban_reason: string }> =>
    api.request<{ message: string; is_banned: boolean; ban_reason: string }>(`/api/credit-profiles/${id}/unban/`, {
      method: 'POST',
      body: JSON.stringify({})
    }),

  createCreditProfile: (data: CreateCreditProfilePayload): Promise<CustomerCreditProfile> =>
    api.request<CustomerCreditProfile>('/api/credit-profiles/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCreditProfile: (id: number, data: Partial<CreateCreditProfilePayload>): Promise<CustomerCreditProfile> =>
    api.request<CustomerCreditProfile>(`/api/credit-profiles/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteCreditProfile: (id: number): Promise<void> =>
    api.request<void>(`/api/credit-profiles/${id}/`, {
      method: 'DELETE'
    }),

  // ==========================================
  // Supplier Management Endpoints (Admin Only)
  // ==========================================

  getSuppliers: (
    params?: SupplierFilterParams | number
  ): Promise<PaginatedResponse<Supplier> | Supplier[]> => {
    const q = new URLSearchParams();
    if (typeof params === 'number') {
      q.set('page', String(params));
    } else if (params) {
      if (params.page) q.set('page', String(params.page));
      if (params.search) q.set('search', params.search);
      if (params.is_active !== undefined && params.is_active !== '') {
        q.set('is_active', String(params.is_active));
      }
      if (params.has_amount_owed !== undefined && params.has_amount_owed !== '') {
        q.set('has_amount_owed', String(params.has_amount_owed));
      }
      if (params.has_refund_owed !== undefined && params.has_refund_owed !== '') {
        q.set('has_refund_owed', String(params.has_refund_owed));
      }
      if (params.has_next_supply !== undefined && params.has_next_supply !== '') {
        q.set('has_next_supply', String(params.has_next_supply));
      }
      if (params.ordering) q.set('ordering', params.ordering);
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<PaginatedResponse<Supplier> | Supplier[]>(`/api/suppliers/${qs}`);
  },

  getSupplierDetails: (id: number): Promise<Supplier> =>
    api.request<Supplier>(`/api/suppliers/${id}/`),

  createSupplier: (data: CreateSupplierPayload): Promise<Supplier> =>
    api.request<Supplier>('/api/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateSupplier: (
    id: number,
    data: Partial<CreateSupplierPayload>
  ): Promise<Supplier> =>
    api.request<Supplier>(`/api/suppliers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteSupplier: (id: number): Promise<void> =>
    api.request<void>(`/api/suppliers/${id}/`, {
      method: 'DELETE'
    }),

  markNextSupplyDate: (
    id: number,
    data: MarkNextSupplyPayload
  ): Promise<MarkNextSupplyResponse> =>
    api.request<MarkNextSupplyResponse>(`/api/suppliers/${id}/mark-next-supply/`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  recordSupplierPayment: (
    id: number,
    data: RecordSupplierPaymentPayload
  ): Promise<RecordSupplierPaymentResponse> =>
    api.request<RecordSupplierPaymentResponse>(`/api/suppliers/${id}/record-payment/`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  recordSupplierRefund: (
    id: number,
    data: RecordSupplierRefundPayload
  ): Promise<RecordSupplierRefundResponse> =>
    api.request<RecordSupplierRefundResponse>(`/api/suppliers/${id}/record-refund/`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSupplierProducts: (id: number): Promise<SupplierProduct[]> =>
    api.request<SupplierProduct[]>(`/api/suppliers/${id}/products/`),

  // Next Scheduled Supplying Items (Admin Only)
  getNextSupplyingItems: (
    params?: NextSupplyingItemsParams
  ): Promise<NextSupplyingItemsResponse> => {
    const q = new URLSearchParams();
    if (params?.supplier_id) q.set('supplier_id', String(params.supplier_id));
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.only_low_stock !== undefined) {
      q.set('only_low_stock', String(params.only_low_stock));
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<NextSupplyingItemsResponse>(`/api/next-supplying-items/${qs}`);
  },

  // Upcoming Supplier Payments & Refunds (Admin Only)
  getSupplierPayments: (
    params?: SupplierPaymentsParams
  ): Promise<SupplierPaymentsSummaryResponse> => {
    const q = new URLSearchParams();
    if (params?.type && params.type !== 'all') q.set('type', params.type);
    if (params?.is_overdue !== undefined) q.set('is_overdue', String(params.is_overdue));
    if (params?.due_within_days !== undefined) q.set('due_within_days', String(params.due_within_days));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<SupplierPaymentsSummaryResponse>(`/api/supplier-payments/${qs}`);
  },

  // Supplier Alerts in Notifications (Admin Only)
  getNotifications: (): Promise<NotificationsResponse> =>
    api.request<NotificationsResponse>('/api/notifications/'),

  // ==========================================
  // User Management Endpoints (Admin Only)
  // ==========================================

  getUsers: (
    params?: UserFilterParams | number
  ): Promise<PaginatedResponse<User> | User[]> => {
    const q = new URLSearchParams();
    if (typeof params === 'number') {
      q.set('page', String(params));
    } else if (params) {
      if (params.page) q.set('page', String(params.page));
      if (params.search) q.set('search', params.search);
      if (params.role) q.set('role', params.role);
      if (params.is_active !== undefined && params.is_active !== '') {
        q.set('is_active', String(params.is_active));
      }
      if (params.ordering) q.set('ordering', params.ordering);
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.request<PaginatedResponse<User> | User[]>(`/api/users/${qs}`);
  },

  getUserDetails: (id: number): Promise<User> =>
    api.request<User>(`/api/users/${id}/`),

  createUser: (data: CreateUserPayload): Promise<User> =>
    api.request<User>('/api/users/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  blockUser: (id: number): Promise<BlockUserResponse> =>
    api.request<BlockUserResponse>(`/api/users/${id}/block/`, {
      method: 'POST'
    }),

  unblockUser: (id: number): Promise<BlockUserResponse> =>
    api.request<BlockUserResponse>(`/api/users/${id}/unblock/`, {
      method: 'POST'
    }),

  getUserHistory: (id: number, limit: number = 50): Promise<UserHistoryResponse> =>
    api.request<UserHistoryResponse>(`/api/users/${id}/history/?limit=${limit}`)
};