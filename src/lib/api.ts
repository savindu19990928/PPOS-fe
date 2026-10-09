const BASE_URL = 'https://ppos-813344430767.asia-southeast1.run.app';

export const api = {
  getToken: () => localStorage.getItem('access_token'),
  setToken: (token: string) => localStorage.setItem('access_token', token),
  removeToken: () => localStorage.removeItem('access_token'),

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.
        json().
        catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `Error ${response.status}`);
    }

    return response.json();
  },

  // Auth
  login: (credentials: any) =>
    api.request<any>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  // Products
  getProducts: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.request<any>(`/api/products/${query}`);
  },
  getProductsPaginated: (page: number = 1, search?: string) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    return api.request<any>(`/api/products/?${params.toString()}`);
  },
  getProductByBarcode: (barcode: string) =>
    api.request<any[]>(`/api/products/?barcode=${barcode}`),
  getProductDetails: (id: number) => api.request<any>(`/api/products/${id}/`),

  // Sales
  createSale: (data: any) =>
    api.request<any>('/api/sales/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getSales: (page: number = 1, search?: string) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    return api.request<any>(`/api/sales/?${params.toString()}`);
  },
  getTodaySales: (page: number = 1) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    return api.request<any>(`/api/sales/today/?${params.toString()}`);
  },
  getSaleDetails: (id: number) => api.request<any>(`/api/sales/${id}/`),
  correctSale: (id: number, data: any) =>
    api.request<any>(`/api/sales/${id}/correct_sale/`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Registers
  getRegisters: () => api.request<any[]>('/api/cash-registers/'),
  getRegisterDetails: (id: number) =>
    api.request<any>(`/api/cash-registers/${id}/`),
  getRegisterTransactions: (id: number, page: number = 1) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    return api.request<any>(
      `/api/cash-registers/${id}/transactions/?${params.toString()}`
    );
  },

  // Cash Transactions
  getCashTransactions: () => api.request<any[]>('/api/cash-transactions/'),
  createCashTransaction: (data: any) =>
    api.request<any>('/api/cash-transactions/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Units of Measure
  getUnits: () => api.request<any[]>('/api/units/'),

  // Denominations
  getDenominations: () => api.request<any[]>('/api/denominations/')
};