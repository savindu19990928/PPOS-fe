import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import { UnitOfMeasure, Product } from '../../types';
import {
  PackageIcon,
  SearchIcon,
  Loader2,
  AlertCircleIcon,
  TagIcon,
  DollarSignIcon,
  BoxesIcon,
  Building2Icon,
  ExternalLinkIcon
} from 'lucide-react';

interface UnitProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitOfMeasure | null;
  onSelectProduct?: (product: Product) => void;
}

export function UnitProductsModal({
  isOpen,
  onClose,
  unit,
  onSelectProduct
}: UnitProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && unit) {
      setIsLoading(true);
      setError(null);
      setSearch('');
      api.getUnitProducts(unit.id)
        .then((data) => {
          setProducts(Array.isArray(data) ? data : []);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to load products for this unit.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setProducts([]);
    }
  }, [isOpen, unit]);

  if (!unit) return null;

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Products Assigned to '${unit.name}' (${unit.abbreviation})`}
      size="2xl">
      <div className="space-y-4">
        {/* Unit Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <PackageIcon className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{unit.name}</h3>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  {unit.abbreviation}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Unit ID #{unit.id} • {products.length} registered product{products.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={products.length > 0 ? 'warning' : 'success'}>
              {products.length > 0 ? `${products.length} Active Link(s)` : 'No Products Linked'}
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter assigned products by name, barcode, or supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-white"
          />
        </div>

        {/* Products list */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600 mb-2" />
            <p className="text-xs">Loading assigned products...</p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error Loading Products</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <PackageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            {search ? (
              <p>No products match "{search}" in this unit.</p>
            ) : (
              <p>No products are currently assigned to this unit of measure.</p>
            )}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
            {filteredProducts.map((p) => {
              const currentStock = parseFloat(p.current_stock || '0');
              const minStock = parseFloat(p.minimum_stock_level || '0');
              const isLowStock = currentStock <= minStock;

              return (
                <div
                  key={p.id}
                  className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.barcode_image ? (
                      <img
                        src={p.barcode_image}
                        alt={p.barcode}
                        className="h-10 w-16 object-contain bg-white border border-slate-200 rounded p-0.5 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <PackageIcon className="h-4 w-4 text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                        {!p.is_active && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-red-100 text-red-700">
                            Deactivated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <span>Barcode: {p.barcode}</span>
                        {p.supplier_name && (
                          <>
                            <span>•</span>
                            <span className="font-sans truncate max-w-[150px]">{p.supplier_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    <div>
                      <p className="text-xs font-mono font-bold text-emerald-700">
                        Rs. {parseFloat(p.selling_price).toFixed(2)}
                      </p>
                      <p
                        className={`text-[10px] font-mono ${
                          isLowStock ? 'text-red-600 font-bold' : 'text-slate-500'
                        }`}>
                        Stock: {currentStock.toFixed(0)} {p.unit_abbreviation || unit.abbreviation}
                      </p>
                    </div>

                    {onSelectProduct && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        title="Manage product">
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Total: {products.length} product{products.length === 1 ? '' : 's'} assigned
          </span>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
