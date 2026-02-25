import React, { useState, useRef, Component } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Layout } from '../components/Layout';
import { ProductSearch } from '../components/pos/ProductSearch';
import { Cart } from '../components/pos/Cart';
import { PaymentModal } from '../components/pos/PaymentModal';
import { Receipt } from '../components/pos/Receipt';
import { Product, CartItem, Sale, SaleItem } from '../types';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
export function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{
    sale: Sale;
    items: SaleItem[];
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef
  });
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
        item.id === product.id ?
        {
          ...item,
          quantity: item.quantity + 1,
          subtotal: (item.quantity + 1) * parseFloat(item.selling_price)
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
        const newQty = Math.max(1, item.quantity + delta);
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
  const handleProcessPayment = async (
  method: string,
  amountPaid: number,
  customerName: string,
  mobile: string) =>
  {
    try {
      // 1. Create Sale Payload
      const payload = {
        cash_register: 1,
        payment_method: method,
        discount: '0.00',
        amount_paid: amountPaid.toFixed(2),
        customer_name: customerName,
        mobile_number: mobile,
        notes: 'POS Sale',
        items: cart.map((item) => ({
          product: item.id,
          quantity: item.quantity.toFixed(3),
          unit_price: item.selling_price
        })),
        denominations: [] // Optional for now
      };
      // 2. Call API
      const saleResponse = await api.createSale(payload);
      // 3. Prepare Receipt Data
      const saleItems: SaleItem[] = cart.map((item) => ({
        product: item.id,
        product_name: item.name,
        quantity: item.quantity.toFixed(3),
        unit_price: item.selling_price
      }));
      setLastSale({
        sale: saleResponse,
        items: saleItems
      });
      // 4. Close Modal & Clear Cart
      setIsPaymentModalOpen(false);
      clearCart();
      // 5. Trigger Print (with a small delay to ensure state updates)
      setTimeout(() => {
        handlePrint();
      }, 100);
    } catch (error) {
      console.error('Sale failed', error);
      alert('Failed to process sale. Please try again.');
      throw error; // Re-throw to keep modal open/loading state
    }
  };
  return (
    <Layout>
      <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
        {/* Left: Product Search & Grid (Future expansion) */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Product Search
            </h2>
            <ProductSearch onProductSelect={addToCart} />
          </div>

          {/* Placeholder for Quick Access / Categories if needed */}
          <div className="flex-1 bg-slate-100 rounded-lg border border-slate-200 border-dashed flex items-center justify-center text-slate-400">
            <p>Quick Access Items (Coming Soon)</p>
          </div>
        </div>

        {/* Right: Cart & Checkout */}
        <div className="w-full md:w-[400px] flex flex-col bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="font-bold text-lg">Current Sale</h2>
            <span className="bg-emerald-600 px-2 py-0.5 rounded text-xs font-bold">
              {cart.length} Items
            </span>
          </div>

          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart} />


          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal</span>
              <span>{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tax (0%)</span>
              <span>0.00</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-slate-900 pt-4 border-t border-slate-200">
              <span>Total</span>
              <span>{cartTotal.toFixed(2)}</span>
            </div>

            <Button
              className="w-full h-14 text-lg font-bold shadow-lg shadow-emerald-200"
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}>

              Proceed to Payment
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={cartTotal}
        onProcessPayment={handleProcessPayment} />


      {/* Hidden Receipt Component for Printing */}
      <div
        style={{
          display: 'none'
        }}>

        {lastSale &&
        <Receipt
          ref={receiptRef}
          sale={lastSale.sale}
          items={lastSale.items} />

        }
      </div>
    </Layout>);

}