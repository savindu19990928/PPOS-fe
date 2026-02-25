import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { SaleItem, Product } from '../../types';
import {
  Loader2,
  Trash2Icon,
  AlertTriangleIcon,
  SearchIcon,
  PlusCircleIcon,
  BarcodeIcon } from
'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
interface CorrectSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
  onSuccess: () => void;
}
interface EditableItem {
  product: number;
  product_name: string;
  quantity: string;
  unit_price: string;
  subtotal: number;
}
export function CorrectSaleModal({
  isOpen,
  onClose,
  saleId,
  onSuccess
}: CorrectSaleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleNumber, setSaleNumber] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [correctionReason, setCorrectionReason] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [error, setError] = useState('');
  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails(saleId);
    } else {
      setItems([]);
      setSaleNumber('');
      setCorrectionReason('');
      setAmountPaid('');
      setError('');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, saleId]);
  // Product search effect
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }
    const search = async () => {
      setIsSearching(true);
      try {
        const data = await api.getProducts(debouncedSearch);
        const results = Array.isArray(data) ? data : data.results || [];
        setSearchResults(results);
        setIsSearchOpen(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    };
    search();
  }, [debouncedSearch]);
  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
      searchWrapperRef.current &&
      !searchWrapperRef.current.contains(event.target as Node))
      {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const fetchSaleDetails = async (id: number) => {
    setIsLoading(true);
    setError('');
    try {
      const detail = await api.getSaleDetails(id);
      setSaleNumber(detail.sale_number);
      setAmountPaid(detail.amount_paid || detail.total);
      const editableItems: EditableItem[] = (detail.items || []).map(
        (item: SaleItem) => ({
          product: item.product,
          product_name: item.product_name || `Product #${item.product}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: parseFloat(item.quantity) * parseFloat(item.unit_price)
        })
      );
      setItems(editableItems);
    } catch (err) {
      console.error('Failed to load sale details', err);
      setError('Failed to load sale details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleQuantityChange = (index: number, value: string) => {
    const newItems = [...items];
    const item = {
      ...newItems[index],
      quantity: value
    };
    const qty = parseFloat(value) || 0;
    const price = parseFloat(item.unit_price) || 0;
    item.subtotal = qty * price;
    newItems[index] = item;
    setItems(newItems);
  };
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  const handleAddProduct = (product: Product) => {
    // Check if product already exists in items
    const existingIndex = items.findIndex((i) => i.product === product.id);
    if (existingIndex >= 0) {
      // Increment quantity
      const newItems = [...items];
      const item = {
        ...newItems[existingIndex]
      };
      const newQty = parseFloat(item.quantity) + 1;
      item.quantity = newQty.toFixed(3);
      item.subtotal = newQty * parseFloat(item.unit_price);
      newItems[existingIndex] = item;
      setItems(newItems);
    } else {
      // Add new item with the product's selling price (locked)
      const newItem: EditableItem = {
        product: product.id,
        product_name: product.name,
        quantity: '1.000',
        unit_price: product.selling_price,
        subtotal: parseFloat(product.selling_price)
      };
      setItems([...items, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleId) return;
    if (items.length === 0) {
      setError('Sale must have at least one item.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        correction_reason: correctionReason,
        amount_paid: parseFloat(amountPaid).toFixed(2),
        items: items.map((item) => ({
          product: item.product,
          quantity: parseFloat(item.quantity).toFixed(3),
          unit_price: parseFloat(item.unit_price).toFixed(2)
        }))
      };
      await api.correctSale(saleId, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Correction failed', err);
      setError(err.message || 'Failed to correct sale.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const total = calculateTotal();
  const change = Math.max(0, (parseFloat(amountPaid) || 0) - total);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Correct Sale: ${saleNumber}`}
      size="lg">

      {isLoading ?
      <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
          <p className="text-slate-500">Loading sale details...</p>
        </div> :

      <form onSubmit={handleSubmit} className="space-y-6">
          {error &&
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-3">
              <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
        }

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Items</h3>
              <span className="text-xs text-slate-500">
                {items.length} items
              </span>
            </div>

            {/* Add Product Search */}
            <div ref={searchWrapperRef} className="relative">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                type="text"
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm shadow-sm"
                placeholder="Search product to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} />

                {isSearching &&
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  </div>
              }
              </div>
              {isSearchOpen && searchResults.length > 0 &&
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {searchResults.map((product) => {
                const stock = parseFloat(product.current_stock);
                const displayStock =
                stock > 1000 ? '1000+' : stock.toFixed(0);
                return (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors"
                    onClick={() => handleAddProduct(product)}>

                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-700">
                            {product.name}
                          </p>
                          <div className="flex items-center text-xs text-slate-500 mt-0.5">
                            <BarcodeIcon className="h-3 w-3 mr-1" />
                            <span className="mr-3">{product.barcode}</span>
                            <span>
                              Stock: {displayStock} {product.unit_abbreviation}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-600">
                            {parseFloat(product.selling_price).toFixed(2)}
                          </span>
                          <PlusCircleIcon className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>);

              })}
                </div>
            }
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[40%]">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-[20%]">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-[20%]">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-[15%]">
                      Total
                    </th>
                    <th className="px-4 py-3 w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {items.map((item, index) =>
                <tr key={index}>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-2">
                        <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                      }
                      className="w-full text-right border border-slate-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 py-1 px-2" />

                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-slate-600">
                        {parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                        {item.subtotal.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove item">

                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                )}
                  {items.length === 0 &&
                <tr>
                      <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500 text-sm">

                        No items. Search and add products above.
                      </td>
                    </tr>
                }
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td
                    colSpan={3}
                    className="px-4 py-3 text-right text-sm font-medium text-slate-700">

                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {total.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correction Reason <span className="text-red-500">*</span>
              </label>
              <textarea
              required
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2"
              placeholder="Why is this sale being corrected?" />

            </div>

            <div className="space-y-4">
              <Input
              label="Amount Paid"
              type="number"
              step="0.01"
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00" />


              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium text-slate-600">
                  Change Due:
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {change.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}>

              Cancel
            </Button>
            <Button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            isLoading={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-600">

              Confirm Correction
            </Button>
          </div>
        </form>
      }
    </Modal>);

}