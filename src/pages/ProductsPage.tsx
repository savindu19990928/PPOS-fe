import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Cart } from '../components/pos/Cart';
import { PaymentModal } from '../components/pos/PaymentModal';
import { BillPreview } from '../components/pos/BillPreview';
import { api } from '../lib/api';
import { Product, CartItem, BillItem, PaginatedResponse, ProductFilterParams } from '../types';
import { CreateEditProductModal } from '../components/products/CreateEditProductModal';
import { DeleteProductModal } from '../components/products/DeleteProductModal';
import { UnitsOfMeasureTab } from '../components/units/UnitsOfMeasureTab';
import {
  Loader2,
  RefreshCwIcon,
  SearchIcon,
  PackageIcon,
  XIcon,
  PlusCircleIcon,
  ShoppingCartIcon,
  KeyboardIcon,
  PlusIcon,
  Edit2Icon,
  Trash2Icon,
  CheckCircle2Icon,
  ScaleIcon,
  AlertCircleIcon
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';

type TabType = 'pos' | 'manage' | 'units';

export function ProductsPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: Non-admins are strictly confined to POS
  const rawTab = (searchParams.get('tab') as TabType) || 'pos';
  const activeTab: TabType = !isAdmin
    ? 'pos'
    : rawTab === 'manage' || rawTab === 'units'
      ? rawTab
      : 'pos';

  const setActiveTab = (tab: TabType) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'pos') {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      return next;
    });
  };

  // Product list state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('active');

  // Product CRUD Modals State (Admin only)
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cart state (active for POS tab)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Keyboard navigation state
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bill preview state
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [billData, setBillData] = useState<{
    saleId?: number | string;
    saleNumber: string;
    createdAt: string;
    createdBy: string;
    customerName: string;
    paymentMethod: string;
    items: BillItem[];
    total: number;
    amountPaid: number;
    change: number;
  } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchProducts = useCallback(
    async (page: number, search?: string, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const filterParams: ProductFilterParams = { page };
        if (search) filterParams.search = search;
        if (statusFilter === 'active') filterParams.is_active = true;
        if (statusFilter === 'deactivated') filterParams.is_active = false;

        const data: PaginatedResponse<Product> = await api.getProductsPaginated(filterParams);
        setProducts(data.results || []);
        setTotalCount(data.count || 0);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1, debouncedSearch || undefined);
  }, [debouncedSearch, fetchProducts]);

  useEffect(() => {
    fetchProducts(currentPage, debouncedSearch || undefined);
  }, [currentPage, fetchProducts]);

  // Reset highlighted index when products change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [products]);

  // Global keyboard shortcuts (Only active in POS tab)
  useEffect(() => {
    if (activeTab !== 'pos') return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isInModal = target.closest('[role="dialog"]');
      const isOurSearch = target === searchInputRef.current;
      if (isInModal && !isOurSearch) return;

      // F1 — Focus search
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      // F2 — Toggle cart
      if (e.key === 'F2') {
        e.preventDefault();
        setIsCartOpen((prev) => !prev);
        return;
      }
      // F3 — Open payment / checkout
      if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCartOpen(false);
          setIsPaymentOpen(true);
        }
        return;
      }
      // F4 — Toggle shortcuts help
      if (e.key === 'F4') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
      // Escape — Close cart, clear search, or blur
      if (e.key === 'Escape') {
        if (isCartOpen) {
          setIsCartOpen(false);
          return;
        }
        if (isOurSearch && searchQuery) {
          setSearchQuery('');
          setHighlightedIndex(-1);
          return;
        }
        if (isOurSearch) {
          searchInputRef.current?.blur();
          return;
        }
        return;
      }
      // If not in an input, pressing a letter/number focuses search
      if (
        !isOurSearch &&
        tagName !== 'input' &&
        tagName !== 'textarea' &&
        tagName !== 'select' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1 &&
        /[a-zA-Z0-9]/.test(e.key)
      ) {
        searchInputRef.current?.focus();
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCartOpen, searchQuery, cart.length, activeTab]);

  // Search input keyboard handler for arrow navigation (POS only)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (activeTab !== 'pos') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < products.length - 1 ? prev + 1 : prev));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < products.length) {
        addToCart(products[highlightedIndex]);
        setHighlightedIndex(-1);
      } else if (searchQuery) {
        handleBarcodeLookup();
      }
      return;
    }
  };

  const handleBarcodeLookup = async () => {
    if (!searchQuery) return;
    try {
      const data = await api.getProductByBarcode(searchQuery);
      if (data && data.length > 0) {
        addToCart(data[0]);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    } catch (error) {
      console.error('Barcode lookup failed', error);
    }
  };

  const handleRefresh = () => {
    fetchProducts(currentPage, debouncedSearch || undefined, true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Cart operations
  const addToCart = (product: Product) => {
    const stock = parseFloat(product.current_stock);
    if (stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > stock) return prev;
        return prev.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * parseFloat(item.selling_price)
            }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          subtotal: parseFloat(product.selling_price)
        }
      ];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const maxStock = parseFloat(item.current_stock);
          const newQty = Math.max(1, Math.min(item.quantity + delta, maxStock));
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * parseFloat(item.selling_price)
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProcessPayment = async (
    method: string,
    amountPaid: number,
    customerName: string,
    mobile: string
  ) => {
    try {
      const payload = {
        cash_register: 1,
        payment_method: method,
        discount: '0.00',
        amount_paid: amountPaid.toFixed(2),
        customer_name: customerName,
        mobile_number: mobile,
        notes: '',
        items: cart.map((item) => ({
          product: item.id,
          quantity: item.quantity.toFixed(3),
          unit_price: item.selling_price
        })),
        denominations: []
      };
      const saleResponse = await api.createSale(payload);
      const billItems: BillItem[] = cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.selling_price),
        subtotal: item.subtotal
      }));
      const responseTotal = parseFloat(saleResponse.total || cartTotal.toString());
      const responseAmountPaid = parseFloat(saleResponse.amount_paid || amountPaid.toString());
      const responseChange = parseFloat(saleResponse.change || '0');
      setBillData({
        saleId: saleResponse.id,
        saleNumber: saleResponse.sale_number,
        createdAt: saleResponse.created_at,
        createdBy: user?.first_name || user?.username || saleResponse.created_by_name || 'Cashier',
        customerName: customerName,
        paymentMethod: method,
        items: billItems,
        total: responseTotal,
        amountPaid: responseAmountPaid,
        change: responseChange
      });
      setIsPaymentOpen(false);
      setIsCartOpen(false);
      setIsBillPreviewOpen(true);
      clearCart();
      handleRefresh();
    } catch (error) {
      console.error('Sale failed', error);
      throw error;
    }
  };

  // POS Columns (Streamlined for rapid cashier checkout)
  const posColumns = [
    {
      header: 'Product',
      accessor: (p: Product) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <PackageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 truncate text-sm sm:text-base">
                {p.name}
              </p>
              {!p.is_active && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                  Deactivated
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>
              {p.unit_abbreviation && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {p.unit_abbreviation}
                </span>
              )}
              {p.supplier_name && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {p.supplier_name}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: (p: Product) => (
        <div className="text-right">
          <span className="font-bold text-slate-900 font-mono text-sm sm:text-base">
            Rs. {parseFloat(p.selling_price).toFixed(2)}
          </span>
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'Stock',
      accessor: (p: Product) => {
        const stock = parseFloat(p.current_stock);
        const displayStock = stock > 1000 ? '1000+' : stock.toFixed(0);
        return (
          <Badge variant={stock > 20 ? 'success' : stock > 0 ? 'warning' : 'error'}>
            {displayStock} {p.unit_abbreviation}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (p: Product) => {
        const inCart = cart.find((c) => c.id === p.id);
        const stock = parseFloat(p.current_stock);
        const atStockLimit = inCart ? inCart.quantity >= stock : false;
        const canSell = p.is_active && stock > 0;

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={inCart ? 'secondary' : 'primary'}
              onClick={(e) => {
                e.stopPropagation();
                addToCart(p);
              }}
              disabled={!canSell || atStockLimit}
              className="whitespace-nowrap text-xs">
              <PlusCircleIcon className="h-3.5 w-3.5 mr-1" />
              {atStockLimit ? 'Max' : inCart ? `Add (${inCart.quantity})` : 'Add'}
            </Button>
          </div>
        );
      },
      className: 'text-right'
    }
  ];

  // Manage Products Columns (Admin detailed catalog management)
  const manageColumns = [
    {
      header: 'Product',
      accessor: (p: Product) => (
        <div className="flex items-center gap-2.5 sm:gap-3">
          {p.barcode_image ? (
            <img
              src={p.barcode_image}
              alt={p.barcode}
              className="h-9 w-16 object-contain bg-white border border-slate-200 rounded p-0.5 flex-shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
              <PackageIcon className="h-4 w-4 text-emerald-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{p.name}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Barcode: {p.barcode}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Unit of Measure',
      accessor: (p: Product) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-700 font-medium">
            {p.unit_of_measure_name || 'Unit'}
          </span>
          {p.unit_abbreviation && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {p.unit_abbreviation}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: (p: Product) => (
        <span className="text-xs text-slate-600 truncate block max-w-[140px]">
          {p.supplier_name || '—'}
        </span>
      )
    },
    {
      header: 'Pricing',
      accessor: (p: Product) => (
        <div>
          <p className="font-mono font-bold text-xs text-slate-900">
            Rs. {parseFloat(p.selling_price).toFixed(2)}
          </p>
          {p.cost_price && (
            <p className="font-mono text-[10px] text-slate-400">
              Cost: Rs. {parseFloat(p.cost_price).toFixed(2)}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Stock Level',
      accessor: (p: Product) => {
        const stock = parseFloat(p.current_stock || '0');
        const minStock = parseFloat(p.minimum_stock_level || '0');
        const isLow = stock <= minStock;

        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-slate-900">
                {stock.toFixed(0)} {p.unit_abbreviation}
              </span>
              {isLow && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-0.5">
                  <AlertCircleIcon className="h-2.5 w-2.5" /> Low
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Min: {minStock.toFixed(0)}
            </p>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: (p: Product) =>
        p.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="error">Deactivated</Badge>
        )
    },
    {
      header: 'Actions',
      accessor: (p: Product) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setProductToEdit(p);
              setIsCreateEditOpen(true);
            }}
            title="Edit Product"
            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50">
            <Edit2Icon className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setProductToDelete(p);
              setIsDeleteOpen(true);
            }}
            title="Delete / Deactivate Product"
            className="p-1.5 text-red-600 hover:bg-red-50">
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <Layout>
      <div className="flex flex-col h-auto md:h-[calc(100vh-6rem)] gap-3 sm:gap-4">
        {/* Admin Tabs Switcher */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}>
              <ShoppingCartIcon className="h-4 w-4" />
              <span>Point of Sale (POS)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'manage'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}>
              <PackageIcon className="h-4 w-4" />
              <span>Manage Products</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'units'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}>
              <ScaleIcon className="h-4 w-4" />
              <span>Units of Measure</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-emerald-500/20 text-emerald-900 border border-emerald-500/30">
                Admin
              </span>
            </button>
          </div>
        )}

        {/* TAB 1: POINT OF SALE (POS) */}
        {activeTab === 'pos' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Point of Sale</h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {totalCount} items in stock • Click product or press Enter to add to cart
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowShortcuts((prev) => !prev)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showShortcuts
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                    }`}
                  title="Toggle keyboard shortcuts (F4)">
                  <KeyboardIcon className="h-3.5 w-3.5" />
                  Shortcuts
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  isLoading={isRefreshing}>
                  <RefreshCwIcon
                    className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Keyboard shortcuts hint bar */}
            {showShortcuts && (
              <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono">
                <span className="text-slate-500 font-sans font-medium mr-1">Shortcuts:</span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold">
                    F1
                  </kbd>{' '}
                  Search
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold">
                    F2
                  </kbd>{' '}
                  Cart
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold">
                    F3
                  </kbd>{' '}
                  Checkout
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold">
                    ↑↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold">
                    Enter
                  </kbd>{' '}
                  Add to cart
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold">
                    Esc
                  </kbd>{' '}
                  Close / Clear
                </span>
              </div>
            )}

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full h-10 pl-10 pr-24 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm shadow-sm"
                  placeholder="Scan barcode or search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setHighlightedIndex(-1);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-0.5">
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-mono border border-slate-200">
                    F1
                  </kbd>
                </div>
              </div>
            </div>

            {/* POS Table */}
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-sm text-slate-400 mt-3">Loading products...</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto overflow-x-auto">
                    <Table
                      data={products}
                      columns={posColumns}
                      keyField="id"
                      onRowClick={addToCart}
                      highlightedIndex={highlightedIndex}
                      emptyMessage={
                        searchQuery
                          ? `No products found matching "${searchQuery}".`
                          : 'No products available.'
                      }
                    />
                  </div>
                  <div className="border-t border-slate-200 bg-white">
                    <Pagination
                      currentPage={currentPage}
                      totalCount={totalCount}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* TAB 2: MANAGE PRODUCTS (Admin Only) */}
        {activeTab === 'manage' && isAdmin && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Product Management</h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Manage product catalog, packaging units, pricing, suppliers, and stock levels.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setProductToEdit(null);
                    setIsCreateEditOpen(true);
                  }}>
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  New Product
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  isLoading={isRefreshing}>
                  <RefreshCwIcon
                    className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Manage Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full h-10 pl-10 pr-9 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm shadow-sm"
                  placeholder="Filter catalog by product name or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Pills */}
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}>
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('deactivated')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'deactivated'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}>
                  Deactivated
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}>
                  All
                </button>
              </div>
            </div>

            {/* Manage Table */}
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-sm text-slate-400 mt-3">Loading product catalog...</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto overflow-x-auto">
                    <Table
                      data={products}
                      columns={manageColumns}
                      keyField="id"
                      onRowClick={(p) => {
                        setProductToEdit(p);
                        setIsCreateEditOpen(true);
                      }}
                      emptyMessage={
                        searchQuery
                          ? `No products found matching "${searchQuery}".`
                          : 'No products in catalog.'
                      }
                    />
                  </div>
                  <div className="border-t border-slate-200 bg-white">
                    <Pagination
                      currentPage={currentPage}
                      totalCount={totalCount}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* TAB 3: UNITS OF MEASURE (Admin Only) */}
        {activeTab === 'units' && isAdmin && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <UnitsOfMeasureTab />
          </div>
        )}
      </div>

      {/* Floating Cart Button (FAB) — active in POS mode */}
      {activeTab === 'pos' && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-300/50 flex items-center justify-center active:scale-95 transition-transform hover:bg-emerald-700"
          aria-label="Open cart (F2)">
          <ShoppingCartIcon className="h-6 w-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </button>
      )}

      {/* Cart Drawer Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out ${isCartOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5 text-slate-700" />
            <h2 className="font-bold text-lg text-slate-900">Cart</h2>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {cartItemCount} items
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close cart">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          <div className="flex-1 overflow-y-auto p-4">
            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
            />
          </div>

          {cart.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Subtotal ({cartItemCount} items)</span>
                <span className="font-mono">{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-emerald-600 font-mono">{cartTotal.toFixed(2)}</span>
              </div>
              <Button
                className="w-full h-12 text-base font-bold shadow-lg shadow-emerald-200"
                onClick={() => {
                  setIsCartOpen(false);
                  setIsPaymentOpen(true);
                }}>
                Checkout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Drawer */}
      <div
        className={`hidden md:flex fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-white shadow-2xl border-l border-slate-200 flex-col transform transition-transform duration-300 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
        <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5" />
            <h2 className="font-bold text-lg">Cart</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {cartItemCount} items
            </span>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close cart">
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
          />
        </div>

        {cart.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Subtotal ({cartItemCount} items)</span>
              <span className="font-mono">{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-emerald-600 font-mono">{cartTotal.toFixed(2)}</span>
            </div>
            <Button
              className="w-full h-12 text-base font-bold shadow-lg shadow-emerald-200"
              onClick={() => {
                setIsCartOpen(false);
                setIsPaymentOpen(true);
              }}>
              Checkout <span className="ml-2 text-emerald-200 text-sm font-normal">F3</span>
            </Button>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={cartTotal}
        onProcessPayment={handleProcessPayment}
      />

      {billData && (
        <BillPreview
          isOpen={isBillPreviewOpen}
          onClose={() => setIsBillPreviewOpen(false)}
          saleId={billData.saleId}
          saleNumber={billData.saleNumber}
          createdAt={billData.createdAt}
          createdBy={billData.createdBy}
          customerName={billData.customerName}
          paymentMethod={billData.paymentMethod}
          items={billData.items}
          total={billData.total}
          amountPaid={billData.amountPaid}
          change={billData.change}
          canPrint={true}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl animate-in slide-in-from-top-4 duration-200 text-xs">
          <CheckCircle2Icon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Product CRUD Modals */}
      <CreateEditProductModal
        isOpen={isCreateEditOpen}
        onClose={() => {
          setIsCreateEditOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSuccess={(savedProduct, isEdit) => {
          showToast(
            isEdit
              ? `Product '${savedProduct.name}' updated successfully.`
              : `Product '${savedProduct.name}' created successfully.`
          );
          handleRefresh();
        }}
      />

      <DeleteProductModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setProductToDelete(null);
        }}
        product={productToDelete}
        onSuccess={({ message }) => {
          showToast(message);
          handleRefresh();
        }}
      />
    </Layout>
  );
}