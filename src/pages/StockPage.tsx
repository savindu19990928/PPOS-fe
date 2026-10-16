import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { SearchableProductSelect } from '../components/ui/SearchableProductSelect';
import { CreateStockMovementModal } from '../components/stock/CreateStockMovementModal';
import { BulkStockMovementModal } from '../components/stock/BulkStockMovementModal';
import { EditStockMovementModal } from '../components/stock/EditStockMovementModal';
import { StockMovementDetailModal } from '../components/stock/StockMovementDetailModal';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  StockMovement,
  StockMovementType,
  StockMovementSummary
} from '../types';
import {
  Loader2,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
  PlusIcon,
  LayersIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  SlidersHorizontalIcon,
  BoxesIcon,
  EyeIcon,
  Edit2Icon,
  Trash2Icon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ShieldAlertIcon,
  FilterIcon,
  ReceiptIcon
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Link } from 'react-router-dom';

export function StockPage() {
  const { isAdmin } = useAuth();

  // Stock movements list & pagination
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState<StockMovementSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(search, 350);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<StockMovement | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<StockMovement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback banner
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  // Fetch summary metrics
  const fetchSummary = useCallback(async () => {
    if (!isAdmin) return;
    setIsSummaryLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedProductId > 0) params.product = selectedProductId;
      const data = await api.getStockMovementsSummary(params);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load stock movements summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [isAdmin, dateFrom, dateTo, selectedProductId]);

  // Fetch movements list
  const fetchMovements = useCallback(
    async (page: number, isRefresh = false) => {
      if (!isAdmin) return;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setApiError(null);

      try {
        const params: any = {
          page,
          ordering
        };

        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (movementType) params.movement_type = movementType;
        if (selectedProductId > 0) params.product = selectedProductId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        const response = await api.getStockMovements(params);
        setMovements(response.results || []);
        setTotalCount(response.count || 0);
      } catch (err: any) {
        console.error('Error fetching stock movements:', err);
        setApiError(err.message || 'Failed to load stock movements. Please try again.');
        setMovements([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAdmin, ordering, debouncedSearch, movementType, selectedProductId, dateFrom, dateTo]
  );

  // Initial and reactive load
  useEffect(() => {
    fetchMovements(currentPage);
  }, [fetchMovements, currentPage]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, movementType, selectedProductId, dateFrom, dateTo, ordering]);

  const handleRefresh = () => {
    fetchMovements(currentPage, true);
    fetchSummary();
  };

  const handleClearFilters = () => {
    setSearch('');
    setMovementType('');
    setSelectedProductId(0);
    setDateFrom('');
    setDateTo('');
    setOrdering('-created_at');
    setCurrentPage(1);
  };

  const activeFilterCount = [
    Boolean(debouncedSearch.trim()),
    Boolean(movementType),
    Boolean(selectedProductId > 0),
    Boolean(dateFrom),
    Boolean(dateTo),
    ordering !== '-created_at'
  ].filter(Boolean).length;

  // Handle single movement delete
  const confirmDelete = async () => {
    if (!movementToDelete) return;
    if (movementToDelete.sale) {
      showFeedback('Movements generated by sales cannot be deleted.', 'error');
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteStockMovement(movementToDelete.id);
      showFeedback(`Stock movement #${movementToDelete.id} successfully deleted.`);
      setIsDeleteModalOpen(false);
      setMovementToDelete(null);
      // Reload list and summary
      fetchMovements(currentPage);
      fetchSummary();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete stock movement.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Role Guard View if user is Cashier
  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
          <Card className="p-8 text-center bg-white border-amber-200 shadow-sm">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlertIcon className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Admin Access Required
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">
              Stock movement management and inventory audit logs are strictly restricted to
              authorized Admin accounts. Cashiers do not have access to view or record stock
              movements.
            </p>
            <Link to="/">
              <Button variant="primary">Return to Products & POS</Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  // Table Columns Definition
  const columns = [
    {
      header: 'ID / Date',
      accessor: (m: StockMovement) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-800">#{m.id}</span>
          <div className="text-[11px] text-slate-500">
            {new Date(m.created_at).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-slate-400">
            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
      className: 'w-24'
    },
    {
      header: 'Product Details',
      accessor: (m: StockMovement) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">{m.product_name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {m.product_barcode || 'No Barcode'}
            </span>
            {m.product_unit && (
              <span className="text-[11px] text-slate-400">Unit: {m.product_unit}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: (m: StockMovement) => {
        switch (m.movement_type) {
          case 'IN':
            return (
              <Badge variant="success" className="font-semibold gap-1">
                <ArrowDownLeftIcon className="h-3 w-3" />
                {m.movement_type_display || 'Stock In'}
              </Badge>
            );
          case 'OUT':
            return (
              <Badge variant="warning" className="font-semibold gap-1">
                <ArrowUpRightIcon className="h-3 w-3" />
                {m.movement_type_display || 'Stock Out'}
              </Badge>
            );
          case 'ADJUSTMENT':
            return (
              <Badge variant="purple" className="font-semibold gap-1">
                <SlidersHorizontalIcon className="h-3 w-3" />
                {m.movement_type_display || 'Adjustment'}
              </Badge>
            );
          default:
            return <Badge variant="default">{m.movement_type}</Badge>;
        }
      },
      className: 'w-36'
    },
    {
      header: 'Quantity',
      accessor: (m: StockMovement) => {
        const qtyNum = parseFloat(m.quantity) || 0;
        const isPositive = m.movement_type === 'IN';
        const isNegative = m.movement_type === 'OUT';

        return (
          <div className="text-right">
            <span
              className={`font-mono font-bold text-sm ${
                isPositive
                  ? 'text-emerald-700'
                  : isNegative
                  ? 'text-amber-700'
                  : 'text-purple-700'
              }`}>
              {isPositive ? '+' : isNegative ? '-' : '±'}
              {qtyNum.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 block ml-1">{m.product_unit}</span>
          </div>
        );
      },
      className: 'text-right w-28'
    },
    {
      header: 'Unit Cost',
      accessor: (m: StockMovement) => {
        if (!m.unit_cost) {
          return <span className="text-slate-400 text-xs italic">-</span>;
        }
        return (
          <div className="text-right font-mono text-xs text-slate-800">
            LKR {parseFloat(m.unit_cost).toFixed(2)}
          </div>
        );
      },
      className: 'text-right w-28'
    },
    {
      header: 'Reference & Notes',
      accessor: (m: StockMovement) => (
        <div className="max-w-[200px]">
          {m.reference_number ? (
            <span className="font-mono text-xs font-medium text-slate-800 block truncate">
              {m.reference_number}
            </span>
          ) : (
            <span className="text-slate-400 text-xs italic block">-</span>
          )}
          {m.notes && (
            <span className="text-[11px] text-slate-500 block truncate mt-0.5" title={m.notes}>
              {m.notes}
            </span>
          )}
          {m.sale && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-1">
              <ReceiptIcon className="h-2.5 w-2.5" />
              Sale {m.sale_number ? `#${m.sale_number}` : `ID: ${m.sale}`}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Created By',
      accessor: (m: StockMovement) => (
        <span className="text-xs text-slate-600 font-medium">
          {m.created_by_name || 'System'}
        </span>
      ),
      className: 'w-28'
    },
    {
      header: 'Actions',
      accessor: (m: StockMovement) => {
        const isSaleLinked = Boolean(m.sale);
        return (
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            {/* View Details */}
            <button
              onClick={() => {
                setSelectedMovement(m);
                setIsDetailModalOpen(true);
              }}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
              title="View Movement Details">
              <EyeIcon className="h-4 w-4" />
            </button>

            {/* Edit (Disabled if Sale Linked) */}
            <button
              onClick={() => {
                if (isSaleLinked) return;
                setMovementToEdit(m);
                setIsEditModalOpen(true);
              }}
              disabled={isSaleLinked}
              className={`p-1 rounded transition-colors ${
                isSaleLinked
                  ? 'text-slate-300 cursor-not-allowed opacity-50'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title={isSaleLinked ? 'Cannot edit movements linked to sales' : 'Edit Reference & Notes'}>
              <Edit2Icon className="h-4 w-4" />
            </button>

            {/* Delete (Disabled if Sale Linked) */}
            <button
              onClick={() => {
                if (isSaleLinked) return;
                setMovementToDelete(m);
                setIsDeleteModalOpen(true);
              }}
              disabled={isSaleLinked}
              className={`p-1 rounded transition-colors ${
                isSaleLinked
                  ? 'text-slate-300 cursor-not-allowed opacity-50'
                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title={isSaleLinked ? 'Cannot delete movements linked to sales' : 'Delete Movement'}>
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        );
      },
      className: 'text-right w-28'
    }
  ];

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-lg flex items-center justify-between text-sm shadow-sm transition-all duration-200 border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}>
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2Icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Movements</h1>
              <Badge variant="purple" className="text-[11px] uppercase tracking-wider font-bold">
                Admin Only
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              View, record, filter, and audit all inventory movements and warehouse replenishments.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-slate-600">
              <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Bulk Stock Movement */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-medium">
              <LayersIcon className="h-4 w-4 text-emerald-600" />
              <span>Bulk Inward / Shipment</span>
            </Button>

            {/* Single Stock Movement */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <PlusIcon className="h-4 w-4" />
              <span>Record Movement</span>
            </Button>
          </div>
        </div>

        {/* Aggregate Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Movements */}
          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Movements
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {isSummaryLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                  ) : (
                    summary?.total_movements ?? 0
                  )}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <BoxesIcon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Recorded inventory activities</p>
          </Card>

          {/* Stock In */}
          <Card className="p-4 bg-emerald-50/40 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Stock In (Purchases)
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-emerald-700">
                    {isSummaryLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    ) : (
                      `+${parseFloat(summary?.stock_in?.total_quantity || '0').toFixed(0)}`
                    )}
                  </h3>
                  <span className="text-xs text-emerald-700 font-medium">
                    ({summary?.stock_in?.count ?? 0} batches)
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ArrowDownLeftIcon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium mt-2">
              {summary?.stock_in?.total_cost
                ? `Cost: LKR ${parseFloat(summary.stock_in.total_cost).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}`
                : 'Warehouse additions'}
            </p>
          </Card>

          {/* Stock Out */}
          <Card className="p-4 bg-amber-50/40 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Stock Out (Sales/Damaged)
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-amber-700">
                    {isSummaryLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                    ) : (
                      `-${parseFloat(summary?.stock_out?.total_quantity || '0').toFixed(0)}`
                    )}
                  </h3>
                  <span className="text-xs text-amber-700 font-medium">
                    ({summary?.stock_out?.count ?? 0} movements)
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <ArrowUpRightIcon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-amber-700 mt-2">Sales deductions & write-offs</p>
          </Card>

          {/* Adjustments */}
          <Card className="p-4 bg-purple-50/40 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-800">
                  Stock Adjustments
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-purple-700">
                    {isSummaryLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                    ) : (
                      summary?.adjustment?.count ?? 0
                    )}
                  </h3>
                  <span className="text-xs text-purple-700 font-medium">
                    ({parseFloat(summary?.adjustment?.total_quantity || '0').toFixed(0)} units)
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                <SlidersHorizontalIcon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-purple-700 mt-2">Audit corrections & reconciled items</p>
          </Card>
        </div>

        {/* Filter Toolbar Card */}
        <Card className="p-4 bg-white border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* General keyword search */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product name, barcode, reference #, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Movement Type Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMovementType('')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  movementType === ''
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}>
                All Types
              </button>
              <button
                onClick={() => setMovementType('IN')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  movementType === 'IN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}>
                In (Purchase)
              </button>
              <button
                onClick={() => setMovementType('OUT')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  movementType === 'OUT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}>
                Out
              </button>
              <button
                onClick={() => setMovementType('ADJUSTMENT')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  movementType === 'ADJUSTMENT'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}>
                Adjustment
              </button>
            </div>

            {/* Toggle advanced filter button */}
            <div className="flex items-center gap-2">
              <Button
                variant={isFilterOpen || activeFilterCount > 0 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-1.5">
                <FilterIcon className="h-4 w-4 text-slate-500" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-slate-500 hover:text-red-600 transition-colors underline">
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filter Drawer / Section */}
          {isFilterOpen && (
            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Product filter with SearchableProductSelect */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Filter by Product
                </label>
                <SearchableProductSelect
                  value={selectedProductId}
                  onChange={(id) => setSelectedProductId(id || 0)}
                  placeholder="All Products (Search & Filter)..."
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Date From
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {dateFrom && (
                    <button
                      onClick={() => setDateFrom('')}
                      className="absolute right-8 top-2 text-slate-400 hover:text-slate-600">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Date To
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {dateTo && (
                    <button
                      onClick={() => setDateTo('')}
                      className="absolute right-8 top-2 text-slate-400 hover:text-slate-600">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Ordering */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Order By
                </label>
                <select
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="-created_at">Newest First (Default)</option>
                  <option value="created_at">Oldest First</option>
                  <option value="-quantity">Highest Quantity</option>
                  <option value="quantity">Lowest Quantity</option>
                  <option value="-unit_cost">Highest Unit Cost</option>
                  <option value="unit_cost">Lowest Unit Cost</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Stock Movements Table */}
        <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-sm font-medium">Loading stock movements...</p>
            </div>
          ) : apiError ? (
            <div className="p-8 text-center">
              <AlertCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">{apiError}</p>
              <Button variant="secondary" size="sm" onClick={handleRefresh} className="mt-4">
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table
                  data={movements}
                  columns={columns}
                  keyField="id"
                  onRowClick={(m) => {
                    setSelectedMovement(m);
                    setIsDetailModalOpen(true);
                  }}
                  emptyMessage={
                    activeFilterCount > 0
                      ? 'No stock movements match the selected filters.'
                      : 'No stock movements recorded yet. Click "Record Movement" to add inventory.'
                  }
                />
              </div>

              {/* Pagination */}
              <div className="border-t border-slate-200 px-4 py-2">
                <Pagination
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={20}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 1. Record Single Movement Modal */}
      <CreateStockMovementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(created) => {
          showFeedback(`Stock movement #${created.id} recorded successfully.`);
          fetchMovements(currentPage);
          fetchSummary();
        }}
      />

      {/* 2. Bulk Movement Modal */}
      <BulkStockMovementModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={(msg) => {
          showFeedback(msg);
          fetchMovements(currentPage);
          fetchSummary();
        }}
      />

      {/* 3. Movement Details Modal */}
      <StockMovementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMovement(null);
        }}
        movement={selectedMovement}
        onEditClick={(m) => {
          setMovementToEdit(m);
          setIsEditModalOpen(true);
        }}
      />

      {/* 4. Edit Movement Modal */}
      <EditStockMovementModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setMovementToEdit(null);
        }}
        movement={movementToEdit}
        onSuccess={(updated) => {
          showFeedback(`Movement #${updated.id} updated successfully.`);
          fetchMovements(currentPage);
          fetchSummary();
        }}
      />

      {/* 5. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMovementToDelete(null);
        }}
        title="Confirm Stock Movement Deletion"
        size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <p className="font-semibold text-red-900">Are you sure you want to delete this movement?</p>
              <p className="mt-1">
                Stock Movement #{movementToDelete?.id} for{' '}
                <strong>{movementToDelete?.product_name}</strong> ({movementToDelete?.quantity}{' '}
                {movementToDelete?.product_unit}) will be permanently deleted from the system ledger.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setMovementToDelete(null);
              }}
              disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? 'Deleting...' : 'Delete Movement'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
