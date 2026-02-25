import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Table } from '../components/ui/Table';
import { Card } from '../components/ui/Card';
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
  ShoppingCartIcon } from
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
  // Bill preview state
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [billData, setBillData] = useState<{
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
        if (newQty > stock) return prev; // Can't exceed stock
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
      // Build bill data from cart + API response
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
        saleNumber: saleResponse.sale_number,
        createdAt: saleResponse.created_at,
        createdBy: user || saleResponse.created_by_name || 'Unknown',
        customerName: customerName,
        paymentMethod: method,
        items: billItems,
        total: responseTotal,
        amountPaid: responseAmountPaid,
        change: responseChange
      });
      setIsPaymentOpen(false);
      setIsBillPreviewOpen(true);
      clearCart();
      handleRefresh();
    } catch (error) {
      console.error('Sale failed', error);
      alert('Failed to process sale. Please try again.');
      throw error;
    }
  };
  const columns = [
  {
    header: 'Product',
    accessor: (p: Product) =>
    <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <PackageIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{p.name}</p>
            <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>
          </div>
        </div>

  },
  {
    header: 'Price',
    accessor: (p: Product) =>
    <span className="font-bold text-slate-900 font-mono">
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
          className="whitespace-nowrap">

            <PlusCircleIcon className="h-4 w-4 mr-1" />
            {atStockLimit ? 'Max' : inCart ? `Add (${inCart.quantity})` : 'Add'}
          </Button>);

    },
    className: 'text-right w-32'
  }];

  return (
    <Layout>
      <div className="h-[calc(100vh-6rem)] flex gap-6">
        {/* Left: Product List */}
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Products</h1>
              <p className="text-sm text-slate-500">{totalCount} products</p>
            </div>
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

          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm shadow-sm"
              placeholder="Search products by name or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />

            {searchQuery &&
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">

                <XIcon className="h-4 w-4" />
              </button>
            }
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ?
            <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-sm text-slate-400 mt-3">
                  Loading products...
                </p>
              </div> :

            <>
                <div className="flex-1 overflow-y-auto">
                  <Table
                  data={products}
                  columns={columns}
                  keyField="id"
                  onRowClick={addToCart}
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

        {/* Right: Cart Panel */}
        <div className="w-[380px] flex-shrink-0 flex flex-col bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5" />
              <h2 className="font-bold text-lg">Cart</h2>
            </div>
            <span className="bg-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {cartItemCount} items
            </span>
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
              onClick={() => setIsPaymentOpen(true)}>

                Checkout
              </Button>
            </div>
          }
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={cartTotal}
        onProcessPayment={handleProcessPayment} />


      {billData &&
      <BillPreview
        isOpen={isBillPreviewOpen}
        onClose={() => setIsBillPreviewOpen(false)}
        saleNumber={billData.saleNumber}
        createdAt={billData.createdAt}
        createdBy={billData.createdBy}
        customerName={billData.customerName}
        paymentMethod={billData.paymentMethod}
        items={billData.items}
        total={billData.total}
        amountPaid={billData.amountPaid}
        change={billData.change} />

      }
    </Layout>);

}