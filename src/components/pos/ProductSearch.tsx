import React, { useEffect, useState, useRef } from 'react';
import { SearchIcon, BarcodeIcon, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Product } from '../../types';
import { useDebounce } from '../../hooks/useDebounce'; // We need to create this hook
interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}
export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Debounce search to avoid API spam
  const debouncedQuery = useDebounce(query, 300);
  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await api.getProducts(debouncedQuery);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsLoading(false);
      }
    };
    searchProducts();
  }, [debouncedQuery]);
  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);
  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };
  const handleBarcodeScan = async (
  e: React.KeyboardEvent<HTMLInputElement>) =>
  {
    if (e.key === 'Enter' && query) {
      // Attempt exact barcode match first if enter is pressed
      setIsLoading(true);
      try {
        const data = await api.getProductByBarcode(query);
        if (data && data.length > 0) {
          handleSelect(data[0]);
        }
      } catch (error) {
        console.error('Barcode scan failed', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm text-lg"
          placeholder="Scan barcode or search product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleBarcodeScan}
          autoFocus />

        {isLoading &&
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          </div>
        }
      </div>

      {isOpen && results.length > 0 &&
      <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-96 overflow-y-auto">
          {results.map((product) => {
          const stock = parseFloat(product.current_stock);
          const displayStock = stock > 1000 ? '1000+' : stock.toFixed(0);
          return (
            <button
              key={product.id}
              className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors"
              onClick={() => handleSelect(product)}>

                <div>
                  <p className="font-medium text-slate-900 group-hover:text-emerald-700">
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
                <div className="text-right">
                  <p className="font-bold text-emerald-600">
                    {parseFloat(product.selling_price).toFixed(2)}
                  </p>
                </div>
              </button>);

        })}
        </div>
      }
    </div>);

}