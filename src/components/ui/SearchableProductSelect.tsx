import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, ChevronDownIcon, XIcon, PackageIcon, CheckIcon, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../lib/api';

interface SearchableProductSelectProps {
  value: number | null | undefined;
  onChange: (productId: number, product?: Product) => void;
  products?: Product[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableProductSelect({
  value,
  onChange,
  products: initialProducts,
  placeholder = 'Select a product...',
  required = false,
  disabled = false,
  className = ''
}: SearchableProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productList, setProductList] = useState<Product[]>(initialProducts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Load products if not supplied via props
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductList(initialProducts);
    } else {
      let isMounted = true;
      setIsLoading(true);
      api
        .getProducts()
        .then((items) => {
          if (isMounted) {
            setProductList(items);
          }
        })
        .catch((err) => {
          console.error('Failed to load products for dropdown:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [initialProducts]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedProduct = productList.find((p) => p.id === value);

  // Filtered products based on search query (by name or barcode)
  const filteredProducts = productList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  const handleSelect = (product: Product) => {
    onChange(product.id, product);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0, undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
      scrollItemIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollItemIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[highlightedIndex]) {
        handleSelect(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollItemIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div className={`relative ${className} ${isOpen ? 'z-40' : ''}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Hidden input for HTML5 form validation */}
      {required && (
        <input
          type="text"
          value={value ? String(value) : ''}
          required
          readOnly
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[40px] px-3 py-2 text-left bg-white border rounded-lg text-sm flex items-center justify-between transition-colors outline-none shadow-sm ${
          disabled
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
            : isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-300 hover:border-slate-400 focus:border-emerald-500'
        }`}>
        <div className="flex items-center gap-2 truncate mr-2">
          <PackageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
          {selectedProduct ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-slate-900 truncate">
                {selectedProduct.name}
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                {selectedProduct.barcode}
              </span>
              <span className="text-xs text-slate-400">
                ({selectedProduct.current_stock} {selectedProduct.unit_abbreviation})
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedProduct && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100">
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDownIcon
            className={`h-4 w-4 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel with Search Bar */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-150 min-w-[320px]">
          {/* Integrated Search Bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search by product name or barcode..."
                className="w-full h-8 pl-8 pr-7 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Product List */}
          <ul ref={listRef} className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <li className="py-6 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <span>Loading products...</span>
              </li>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((p, idx) => {
                const isSelected = p.id === value;
                const isHighlighted = idx === highlightedIndex;
                const stockVal = parseFloat(p.current_stock || '0');

                return (
                  <li
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-medium'
                        : isHighlighted
                        ? 'bg-slate-100/80 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}>
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                        {isSelected && <CheckIcon className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono bg-slate-100 px-1 rounded border border-slate-200">
                          {p.barcode}
                        </span>
                        <span>Price: {parseFloat(p.selling_price).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          stockVal > 20
                            ? 'bg-emerald-100 text-emerald-800'
                            : stockVal > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {stockVal} {p.unit_abbreviation}
                      </span>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="py-5 text-center text-slate-400">
                No products found matching &ldquo;{searchQuery}&rdquo;
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
