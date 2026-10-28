import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { NextSupplyingItem, NextSupplyingItemsResponse, Supplier } from '../../types';
import { api } from '../../lib/api';
import {
  TruckIcon,
  AlertTriangleIcon,
  CalendarIcon,
  RefreshCwIcon,
  PhoneIcon,
  FilterIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  PackageIcon,
  SearchIcon,
  SlidersHorizontalIcon
} from 'lucide-react';

interface NextSupplyingItemsTabProps {
  suppliers: Supplier[];
  onSelectSupplier?: (supplierId: number) => void;
}

export function NextSupplyingItemsTab({
  suppliers,
  onSelectSupplier
}: NextSupplyingItemsTabProps) {
  const [data, setData] = useState<NextSupplyingItemsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const fetchItems = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await api.getNextSupplyingItems({
          supplier_id: selectedSupplierId || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          only_low_stock: onlyLowStock ? true : undefined
        });
        setData(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch next supplying items.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedSupplierId, dateFrom, dateTo, onlyLowStock]
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const items = data?.items || [];
  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.product_name.toLowerCase().includes(q) ||
      item.barcode.toLowerCase().includes(q) ||
      item.supplier_name.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const summary = data?.summary || {
    scheduled_today_count: 0,
    scheduled_upcoming_count: 0,
    scheduled_overdue_count: 0,
    low_stock_items_count: 0
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Delivering Today</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {summary.scheduled_today_count}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Due for restock today</p>
        </Card>

        <Card className="p-4 bg-sky-50/60 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">Upcoming Deliveries</span>
            <ClockIcon className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700 mt-2">
            {summary.scheduled_upcoming_count}
          </div>
          <p className="text-[11px] text-sky-600/80 mt-1">Scheduled next deliveries</p>
        </Card>

        <Card className="p-4 bg-red-50/60 border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800">Overdue Deliveries</span>
            <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">
            {summary.scheduled_overdue_count}
          </div>
          <p className="text-[11px] text-red-600/80 mt-1">Past delivery date</p>
        </Card>

        <Card className="p-4 bg-amber-50/60 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Low Stock Expected</span>
            <PackageIcon className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {summary.low_stock_items_count}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-1">Critical replenishment</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search product, barcode, supplier..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Supplier Select */}
            <select
              className="w-full sm:w-56 py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedSupplierId || ''}
              onChange={(e) =>
                setSelectedSupplierId(e.target.value ? Number(e.target.value) : undefined)
              }>
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Low Stock Toggle */}
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                onlyLowStock
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => setOnlyLowStock(!onlyLowStock)}>
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              Only Low Stock ({summary.low_stock_items_count})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="date"
                className="py-1 px-2 border border-slate-300 rounded text-xs"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                className="py-1 px-2 border border-slate-300 rounded text-xs"
                placeholder="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                className="text-xs text-slate-500 hover:text-slate-800 underline"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}>
                Clear
              </button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchItems(true)}
              isLoading={isRefreshing}>
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Items Table */}
      <Card className="overflow-hidden border-slate-200">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">Loading delivery schedule...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <TruckIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No scheduled deliveries found</p>
            <p className="text-xs text-slate-500 mt-1">
              {onlyLowStock
                ? 'No low stock items are currently scheduled for delivery.'
                : 'Assign delivery dates to suppliers to see scheduled restock shipments here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Supplier & Contact</th>
                  <th className="py-3 px-4">Scheduled Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredItems.map((item) => {
                  const currentStock = parseFloat(item.current_stock || '0');
                  const minStock = parseFloat(item.minimum_stock_level || '0');

                  let statusVariant: 'success' | 'info' | 'error' = 'info';
                  if (item.supply_status === 'TODAY') statusVariant = 'success';
                  if (item.supply_status === 'OVERDUE') statusVariant = 'error';

                  return (
                    <tr key={`${item.product_id}-${item.supplier_id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.product_name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-slate-500">{item.barcode}</span>
                          <span className="text-xs text-emerald-600 font-medium">
                            Rs. {parseFloat(item.selling_price || '0').toFixed(2)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              item.is_low_stock ? 'text-red-600' : 'text-slate-800'
                            }`}>
                            {currentStock.toFixed(2)} {item.unit_abbreviation || ''}
                          </span>
                          {item.is_low_stock && (
                            <Badge variant="error" className="text-[10px]">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Min required: {minStock.toFixed(2)} {item.unit_abbreviation || ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{item.supplier_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {item.supplier_contact_person && (
                            <span>{item.supplier_contact_person}</span>
                          )}
                          {item.supplier_phone && (
                            <a
                              href={`tel:${item.supplier_phone}`}
                              className="text-emerald-600 hover:underline flex items-center gap-0.5">
                              <PhoneIcon className="h-3 w-3" />
                              {item.supplier_phone}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                          {item.next_supply_date}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.days_until_supply === 0 ? (
                            <span className="text-emerald-600 font-semibold">Today</span>
                          ) : item.days_until_supply < 0 ? (
                            <span className="text-red-600 font-semibold">
                              {Math.abs(item.days_until_supply)} days overdue
                            </span>
                          ) : (
                            <span>In {item.days_until_supply} days</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={statusVariant}>
                          {item.supply_status || 'UPCOMING'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <span className="text-xs text-slate-600 line-clamp-2">
                          {item.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
