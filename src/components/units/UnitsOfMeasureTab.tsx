import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { api } from '../../lib/api';
import { UnitOfMeasure, UnitOfMeasureFilterParams } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { CreateEditUnitModal } from './CreateEditUnitModal';
import { DeleteUnitModal } from './DeleteUnitModal';
import { UnitProductsModal } from './UnitProductsModal';
import {
  ScaleIcon,
  PlusIcon,
  SearchIcon,
  RefreshCwIcon,
  Edit2Icon,
  Trash2Icon,
  EyeIcon,
  PackageIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ArrowUpDownIcon,
  ShieldCheckIcon,
  LayersIcon,
  XIcon
} from 'lucide-react';

export function UnitsOfMeasureTab() {
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState<string>('name');
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Modals
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<UnitOfMeasure | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitOfMeasure | null>(null);

  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [unitForProducts, setUnitForProducts] = useState<UnitOfMeasure | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchUnits = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setApiError(null);

      try {
        const params: UnitOfMeasureFilterParams = {};
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (ordering) params.ordering = ordering;

        const data = await api.getUnits(params);
        setUnits(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setApiError(err.message || 'Failed to load units of measure. Please check permissions.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, ordering]
  );

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleRefresh = () => {
    fetchUnits(true);
  };

  const handleCreateSuccess = (unit: UnitOfMeasure, isEdit: boolean) => {
    showToast(
      isEdit
        ? `Unit of measure '${unit.name}' updated successfully.`
        : `Unit of measure '${unit.name}' (${unit.abbreviation}) created successfully.`
    );
    fetchUnits();
  };

  const handleDeleteSuccess = (_unitId: number, unitName: string) => {
    showToast(`Unit of measure '${unitName}' deleted successfully.`);
    fetchUnits();
  };

  // Metrics
  const totalUnits = units.length;
  const inUseUnits = units.filter((u) => (u.product_count || 0) > 0).length;
  const totalProducts = units.reduce((acc, u) => acc + (u.product_count || 0), 0);

  const columns = [
    {
      header: 'ID',
      accessor: (u: UnitOfMeasure) => (
        <span className="font-mono text-xs text-slate-400">#{u.id}</span>
      ),
      className: 'w-16'
    },
    {
      header: 'Unit Name',
      accessor: (u: UnitOfMeasure) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <ScaleIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900">{u.name}</p>
            <p className="text-[11px] text-slate-400">Packaging & dispensing metric</p>
          </div>
        </div>
      )
    },
    {
      header: 'Abbreviation',
      accessor: (u: UnitOfMeasure) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
          {u.abbreviation}
        </span>
      ),
      className: 'w-32'
    },
    {
      header: 'Assigned Products',
      accessor: (u: UnitOfMeasure) => {
        const count = u.product_count || 0;
        return (
          <button
            type="button"
            onClick={() => {
              setUnitForProducts(u);
              setIsProductsOpen(true);
            }}
            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              count > 0
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
            }`}
            title="Click to view assigned products">
            <PackageIcon className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>
              {count} {count === 1 ? 'product' : 'products'}
            </span>
            <EyeIcon className="h-3 w-3 opacity-60 ml-0.5" />
          </button>
        );
      }
    },
    {
      header: 'Integrity Status',
      accessor: (u: UnitOfMeasure) => {
        const count = u.product_count || 0;
        return count > 0 ? (
          <Badge variant="success">
            <span className="flex items-center gap-1">
              <ShieldCheckIcon className="h-3 w-3" /> In Use (Protected)
            </span>
          </Badge>
        ) : (
          <Badge variant="default">Unassigned (Safe to delete)</Badge>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (u: UnitOfMeasure) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setUnitForProducts(u);
              setIsProductsOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
            title="View products using this unit">
            <EyeIcon className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setUnitToEdit(u);
              setIsCreateEditOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50"
            title="Edit unit name or abbreviation">
            <Edit2Icon className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setUnitToDelete(u);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50"
            title="Delete unit of measure">
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2Icon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white">
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Units of Measure</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Define product packaging and dispensing metrics (Tablet, Capsule, Bottle, Vial, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setUnitToEdit(null);
              setIsCreateEditOpen(true);
            }}>
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New Unit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}>
            <RefreshCwIcon
              className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 flex items-center justify-between border-slate-200">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Units</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{totalUnits}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <ScaleIcon className="h-4 w-4 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-3.5 flex items-center justify-between border-slate-200">
          <div>
            <p className="text-xs text-slate-500 font-medium">In Active Use</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5 font-mono">{inUseUnits}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-3.5 flex items-center justify-between border-slate-200">
          <div>
            <p className="text-xs text-slate-500 font-medium">Catalog Products Linked</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{totalProducts}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <PackageIcon className="h-4 w-4 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-xs shadow-sm"
            placeholder="Search units by name or abbreviation (e.g. Tablet, cap, btl)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Ordering */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <ArrowUpDownIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="h-10 pl-8 pr-8 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="name">Sort: Name (A-Z)</option>
              <option value="-name">Sort: Name (Z-A)</option>
              <option value="abbreviation">Sort: Abbr (A-Z)</option>
              <option value="-abbreviation">Sort: Abbr (Z-A)</option>
              <option value="id">Sort: ID (Ascending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {apiError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to fetch units</p>
            <p className="mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <RefreshCwIcon className="h-7 w-7 animate-spin text-emerald-600 mb-2" />
            <p className="text-xs">Loading units of measure...</p>
          </div>
        ) : (
          <Table
            data={units}
            columns={columns}
            keyField="id"
            emptyMessage={
              searchQuery
                ? `No units found matching "${searchQuery}".`
                : 'No units of measure registered yet. Click "New Unit" to create one.'
            }
          />
        )}
      </div>

      {/* Modals */}
      <CreateEditUnitModal
        isOpen={isCreateEditOpen}
        onClose={() => {
          setIsCreateEditOpen(false);
          setUnitToEdit(null);
        }}
        onSuccess={handleCreateSuccess}
        unitToEdit={unitToEdit}
      />

      <DeleteUnitModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setUnitToDelete(null);
        }}
        unit={unitToDelete}
        onSuccess={handleDeleteSuccess}
        onViewProducts={(u) => {
          setUnitForProducts(u);
          setIsProductsOpen(true);
        }}
      />

      <UnitProductsModal
        isOpen={isProductsOpen}
        onClose={() => {
          setIsProductsOpen(false);
          setUnitForProducts(null);
        }}
        unit={unitForProducts}
      />
    </div>
  );
}
