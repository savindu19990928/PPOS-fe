import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Cart } from '../components/pos/Cart';
import { PaymentModal } from '../components/pos/PaymentModal';
import { BillPreview } from '../components/pos/BillPreview';
import { api } from '../lib/api';
import { Product, CartItem, BillItem, PaginatedResponse } from '../types';
import {
  Loader2,
  RefreshCwIcon,
  SearchIcon,
  PackageIcon,
  XIcon,
  PlusCircleIcon,
  ShoppingCartIcon,
  KeyboardIcon } from
'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
export function ProductsPage() {
  const { user } = useAuth();
  // Product list state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Cart state
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
        const data: PaginatedResponse<Product> = await api.getProductsPaginated(
          page,
          search
        );
        setProducts(data.results);
        setTotalCount(data.count);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
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
  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in modals or other inputs (except our search)
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
      /[a-zA-Z0-9]/.test(e.key))
      {
        searchInputRef.current?.focus();
        // Don't prevent default — let the character type into the search
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCartOpen, searchQuery, cart.length]);
  // Search input keyboard handler for arrow navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
      prev < products.length - 1 ? prev + 1 : prev
      );
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => prev > 0 ? prev - 1 : -1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < products.length) {
        // Add highlighted product to cart
        addToCart(products[highlightedIndex]);
        setHighlightedIndex(-1);
      } else if (searchQuery) {
        // Attempt barcode lookup
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
        item.id === product.id ?
        {
          ...item,
          quantity: newQty,
          subtotal: newQty * parseFloat(item.selling_price)
        } :
        item
        );
      }
      return [
      ...prev,
      {
        ...product,
        quantity: 1,
        subtotal: parseFloat(product.selling_price)
      }];

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
  mobile: string) =>
  {
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
      const responseTotal = parseFloat(
        saleResponse.total || cartTotal.toString()
      );
      const responseAmountPaid = parseFloat(
        saleResponse.amount_paid || amountPaid.toString()
      );
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
  const columns = [
  {
    header: 'Product',
    accessor: (p: Product) =>
    <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <PackageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate text-sm sm:text-base">
              {p.name}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>
              {p.supplier_name && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {p.supplier_name}
                </span>
              )}
            </div>
          </div>
        </div>

  },
  {
    header: 'Price',
    accessor: (p: Product) =>
    <span className="font-bold text-slate-900 font-mono text-sm sm:text-base">
          {parseFloat(p.selling_price).toFixed(2)}
        </span>,

    className: 'text-right'
  },
  {
    header: 'Stock',
    accessor: (p: Product) => {
      const stock = parseFloat(p.current_stock);
      const displayStock = stock > 1000 ? '1000+' : stock.toFixed(0);
      return (
        <Badge
          variant={stock > 20 ? 'success' : stock > 0 ? 'warning' : 'error'}>

            {displayStock} {p.unit_abbreviation}
          </Badge>);

    }
  },
  {
    header: '',
    accessor: (p: Product) => {
      const inCart = cart.find((c) => c.id === p.id);
      const stock = parseFloat(p.current_stock);
      const atStockLimit = inCart ? inCart.quantity >= stock : false;
      return (
        <Button
          size="sm"
          variant={inCart ? 'secondary' : 'primary'}
          onClick={(e) => {
            e.stopPropagation();
            addToCart(p);
          }}
          disabled={stock <= 0 || atStockLimit}
          className="whitespace-nowrap text-xs sm:text-sm">

            <PlusCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            {atStockLimit ? 'Max' : inCart ? `Add (${inCart.quantity})` : 'Add'}
          </Button>);

    },
    className: 'text-right w-24 sm:w-32'
  }];

  return (
    <Layout>
      {/* Product list takes full width always */}
      <div className="flex flex-col h-auto md:h-[calc(100vh-6rem)] gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Products
            </h1>
            <p className="text-sm text-slate-500">{totalCount} products</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts((prev) => !prev)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showShortcuts ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
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
                className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />

              Refresh
            </Button>
          </div>
        </div>

        {/* Keyboard shortcuts hint bar */}
        {showShortcuts &&
        <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono">
            <span className="text-slate-500 font-sans font-medium mr-1">
              Shortcuts:
            </span>
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
            <span className="text-slate-600">•</span>
            <span className="text-slate-500 font-sans">
              Type anywhere to search
            </span>
          </div>
        }

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full h-10 pl-10 pr-24 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm shadow-sm"
            placeholder="Search products by name or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown} />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery &&
            <button
              onClick={() => {
                setSearchQuery('');
                setHighlightedIndex(-1);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5">

                <XIcon className="h-4 w-4" />
              </button>
            }
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-mono border border-slate-200">
              F1
            </kbd>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ?
          <div className="flex-1 flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-400 mt-3">Loading products...</p>
            </div> :

          <>
              <div className="flex-1 overflow-y-auto overflow-x-auto">
                <Table
                data={products}
                columns={columns}
                keyField="id"
                onRowClick={addToCart}
                highlightedIndex={highlightedIndex}
                emptyMessage={
                searchQuery ?
                `No products found for "${searchQuery}"` :
                'No products available.'
                } />

              </div>
              <div className="border-t border-slate-200 bg-white">
                <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                onPageChange={handlePageChange} />

              </div>
            </>
          }
        </div>
      </div>

      {/* Floating Cart Button (FAB) — visible on ALL screen sizes */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-300/50 flex items-center justify-center active:scale-95 transition-transform hover:bg-emerald-700"
        aria-label="Open cart (F2)">

        <ShoppingCartIcon className="h-6 w-6" />
        {cartItemCount > 0 &&
        <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        }
      </button>

      {/* Cart Drawer Overlay — all screen sizes */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)} />


      {/* Mobile: bottom drawer */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out ${isCartOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          maxHeight: '85vh'
        }}>

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

        <div
          className="flex flex-col"
          style={{
            maxHeight: 'calc(85vh - 60px)'
          }}>

          <div className="flex-1 overflow-y-auto p-4">
            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart} />

          </div>

          {cart.length > 0 &&
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Subtotal ({cartItemCount} items)</span>
                <span className="font-mono">{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-emerald-600 font-mono">
                  {cartTotal.toFixed(2)}
                </span>
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
          }
        </div>
      </div>

      {/* Desktop: right side panel */}
      <div
        className={`hidden md:flex fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-white shadow-2xl border-l border-slate-200 flex-col transform transition-transform duration-300 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

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
            onClearCart={clearCart} />

        </div>

        {cart.length > 0 &&
        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Subtotal ({cartItemCount} items)</span>
              <span className="font-mono">{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-emerald-600 font-mono">
                {cartTotal.toFixed(2)}
              </span>
            </div>
            <Button
            className="w-full h-12 text-base font-bold shadow-lg shadow-emerald-200"
            onClick={() => {
              setIsCartOpen(false);
              setIsPaymentOpen(true);
            }}>

              Checkout{' '}
              <span className="ml-2 text-emerald-200 text-sm font-normal">
                F3
              </span>
            </Button>
          </div>
        }
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={cartTotal}
        onProcessPayment={handleProcessPayment} />


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
    </Layout>);

}