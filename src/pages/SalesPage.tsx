import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Table } from '../components/ui/Table';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { BillPreview } from '../components/pos/BillPreview';
import { SingleSaleModal } from '../components/pos/SingleSaleModal';
import { CancelBillModal } from '../components/pos/CancelBillModal';
import { ReprintBillModal } from '../components/pos/ReprintBillModal';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Sale,
  SaleItem,
  BillItem,
  PaginatedResponse,
  SaleFilterParams,
  OriginalBillData,
  ReprintingData
} from '../types';
import {
  Loader2,
  RefreshCwIcon,
  PrinterIcon,
  SearchIcon,
  XIcon,
  EyeIcon,
  BanIcon,
  FilterIcon,
  SlidersHorizontalIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ShieldAlertIcon
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Link } from 'react-router-dom';
import { isFirstPrintRecorded } from '../lib/printer';

export function SalesPage() {
  const { isAdmin, isCashier } = useAuth();

  // Sales list & pagination
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter State
  const [billIdSearch, setBillIdSearch] = useState('');
  const [customerNameSearch, setCustomerNameSearch] = useState('');
  const [mobileNumberSearch, setMobileNumberSearch] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');

  const [dateFilter, setDateFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounced search queries
  const debouncedBillId = useDebounce(billIdSearch, 350);
  const debouncedCustomer = useDebounce(customerNameSearch, 350);
  const debouncedMobile = useDebounce(mobileNumberSearch, 350);
  const debouncedGeneral = useDebounce(generalSearch, 350);

  // Modals state
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [saleToReprint, setSaleToReprint] = useState<Sale | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);

  // Bill preview & print state
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [billPreviewData, setBillPreviewData] = useState<{
    saleId?: number | string;
    saleNumber: string;
    createdAt: string;
    createdBy: string;
    customerName: string;
    mobileNumber?: string;
    paymentMethod: string;
    items: BillItem[];
    total: number;
    amountPaid: number;
    change: number;
    status: string;
    canPrint?: boolean;
    cancelledBy?: string | null;
    cancelledAt?: string | null;
    cancellationReason?: string | null;
    originalBillData?: OriginalBillData | null;
    reprintedBy?: string | null;
    reprintedAt?: string | null;
    reprintCount?: number;
    reprintingData?: ReprintingData | null;
  } | null>(null);

  // Notification banner
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

  // Fetch sales callback
  const fetchSales = useCallback(
    async (page: number, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setApiError(null);

      try {
        const params: SaleFilterParams = {
          page,
          ordering
        };

        if (debouncedBillId.trim()) params.bill_id = debouncedBillId.trim();
        if (debouncedCustomer.trim()) params.customer_name = debouncedCustomer.trim();
        if (debouncedMobile.trim()) params.mobile_number = debouncedMobile.trim();
        if (debouncedGeneral.trim()) params.search = debouncedGeneral.trim();

        if (dateFilter) params.date = dateFilter;
        if (dateFromFilter) params.date_from = dateFromFilter;
        if (dateToFilter) params.date_to = dateToFilter;
        if (paymentMethodFilter) params.payment_method = paymentMethodFilter;
        if (statusFilter) params.status = statusFilter;

        const data: PaginatedResponse<Sale> = await api.getSales(params);
        setSales(data.results || []);
        setTotalCount(data.count || 0);
      } catch (error: any) {
        console.error('Failed to fetch sales', error);
        if (error?.status === 403) {
          setApiError('Access Forbidden (403): Only administrators are authorized to access sales history.');
        } else {
          setApiError(error.message || 'Failed to load sales list.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      debouncedBillId,
      debouncedCustomer,
      debouncedMobile,
      debouncedGeneral,
      dateFilter,
      dateFromFilter,
      dateToFilter,
      paymentMethodFilter,
      statusFilter,
      ordering
    ]
  );

  // Trigger fetch when any search / filter / sort parameter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchSales(1);
  }, [fetchSales]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSales(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    fetchSales(currentPage, true);
  };

  // Preset Date Range Helpers
  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFilter(today);
    setDateFromFilter('');
    setDateToFilter('');
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yest = d.toISOString().split('T')[0];
    setDateFilter(yest);
    setDateFromFilter('');
    setDateToFilter('');
  };

  const handleSetLast7Days = () => {
    const d = new Date();
    const end = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 7);
    const start = d.toISOString().split('T')[0];
    setDateFilter('');
    setDateFromFilter(start);
    setDateToFilter(end);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    setDateFilter('');
    setDateFromFilter(firstDay);
    setDateToFilter(today);
  };

  const handleClearAllFilters = () => {
    setBillIdSearch('');
    setCustomerNameSearch('');
    setMobileNumberSearch('');
    setGeneralSearch('');
    setDateFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setPaymentMethodFilter('');
    setStatusFilter('');
    setOrdering('-created_at');
  };

  const activeFilterCount = [
    Boolean(billIdSearch),
    Boolean(customerNameSearch),
    Boolean(mobileNumberSearch),
    Boolean(generalSearch),
    Boolean(dateFilter),
    Boolean(dateFromFilter),
    Boolean(dateToFilter),
    Boolean(paymentMethodFilter),
    Boolean(statusFilter),
    ordering !== '-created_at'
  ].filter(Boolean).length;

  // Modal Triggers
  const handleViewBill = (sale: Sale) => {
    setSelectedSaleId(sale.id);
    setIsDetailModalOpen(true);
  };

  const handleOpenCancelModal = (sale: Sale) => {
    if (sale.status === 'CANCELLED') {
      showFeedback(`Bill ${sale.sale_number} has already been cancelled.`, 'error');
      return;
    }
    setSaleToCancel(sale);
    setIsCancelModalOpen(true);
  };

  const handleOpenReprintModal = (sale: Sale) => {
    if (sale.status === 'CANCELLED') {
      showFeedback(`Cannot reprint cancelled bill ${sale.sale_number}.`, 'error');
      return;
    }
    setSaleToReprint(sale);
    setIsReprintModalOpen(true);
  };

  // Convert Sale to BillPreview Format
  const openPrintPreview = async (sale: Sale, forceOriginal = false) => {
    try {
      let saleDetails = sale;
      // If items are not loaded on table row, fetch complete details
      if (!sale.items || sale.items.length === 0) {
        saleDetails = await api.getSaleDetails(sale.id);
      }

      const saleItems: SaleItem[] = saleDetails.items || [];
      const billItems: BillItem[] = saleItems.map((item: SaleItem, idx: number) => ({
        id: item.product || idx,
        name: item.product_name || `Product #${item.product}`,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal || String(parseFloat(item.quantity) * parseFloat(item.unit_price)))
      }));

      const isRecorded = isFirstPrintRecorded(saleDetails);
      const isReprintAction =
        !forceOriginal &&
        (saleDetails.status === 'REPRINTED' ||
          (saleDetails.reprint_count != null && saleDetails.reprint_count > 0) ||
          Boolean(saleDetails.reprinting_data) ||
          Boolean(saleDetails.reprinted_at));

      // If 1st printing is not recorded, users can print directly without reprinting.
      // If 1st printing IS recorded, users can only print if authorized reprint was performed.
      const canPrint = !isRecorded || isReprintAction;

      setBillPreviewData({
        saleId: saleDetails.id,
        saleNumber: saleDetails.sale_number,
        createdAt: saleDetails.created_at,
        createdBy: saleDetails.created_by_name,
        customerName: saleDetails.customer_name || '',
        mobileNumber: saleDetails.mobile_number,
        paymentMethod: saleDetails.payment_method,
        items: billItems,
        total: parseFloat(saleDetails.total),
        amountPaid: parseFloat(saleDetails.amount_paid || saleDetails.total),
        change: parseFloat(saleDetails.change || '0'),
        status: isReprintAction ? 'REPRINTED' : saleDetails.status,
        canPrint,
        cancelledBy: saleDetails.cancelled_by_name,
        cancelledAt: saleDetails.cancelled_at,
        cancellationReason: saleDetails.cancellation_reason,
        originalBillData: saleDetails.original_bill_data,
        reprintedBy: isReprintAction ? saleDetails.reprinted_by_name : null,
        reprintedAt: isReprintAction ? saleDetails.reprinted_at : null,
        reprintCount: isReprintAction ? saleDetails.reprint_count : 0,
        reprintingData: isReprintAction ? saleDetails.reprinting_data : null
      });

      setIsBillPreviewOpen(true);
    } catch (err: any) {
      showFeedback('Failed to load bill items for printing', 'error');
    }
  };

  // Success Handlers for Cancel & Reprint
  const handleCancelSuccess = (updatedSale: Sale) => {
    showFeedback(`Bill ${updatedSale.sale_number} cancelled successfully. Stock & cash balance reversed.`);
    fetchSales(currentPage, true);
    if (selectedSaleId === updatedSale.id) {
      setIsDetailModalOpen(false);
    }
  };

  const handleReprintSuccess = (reprintedSale: Sale) => {
    showFeedback(`Bill ${reprintedSale.sale_number} reprinted successfully. Audit log recorded.`);
    fetchSales(currentPage, true);
    openPrintPreview(reprintedSale);
  };

  // If user is Cashier, display access denied (in addition to router protection)
  if (isCashier && !isAdmin) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
            <ShieldAlertIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Restricted Access (403 Forbidden)</h2>
          <p className="text-sm text-slate-600 max-w-md mt-2">
            Cashier accounts are restricted to POS sale creation only. Sales list inspection, cancellation, and reprinting are restricted to administrators.
          </p>
          <Link to="/" className="mt-6">
            <Button>Go to Products & POS</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const columns = [
    {
      header: 'Bill / Sale #',
      accessor: (sale: Sale) => (
        <span className="font-mono font-bold text-slate-900">{sale.sale_number}</span>
      ),
      className: 'whitespace-nowrap'
    },
    {
      header: 'Date & Time',
      accessor: (sale: Sale) => (
        <div className="text-xs">
          <p className="font-medium text-slate-900">
            {new Date(sale.created_at).toLocaleDateString()}
          </p>
          <p className="text-slate-400 font-mono">
            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
      className: 'whitespace-nowrap'
    },
    {
      header: 'Customer',
      accessor: (sale: Sale) => (
        <div className="max-w-[150px] truncate">
          <p className="font-medium text-slate-900 truncate">
            {sale.customer_name || <span className="text-slate-400 italic">Walk-in</span>}
          </p>
          {sale.mobile_number && (
            <p className="text-xs text-slate-500 font-mono">{sale.mobile_number}</p>
          )}
        </div>
      )
    },
    {
      header: 'Cashier',
      accessor: (sale: Sale) => (
        <span className="text-xs text-slate-700">{sale.created_by_name || 'Cashier'}</span>
      )
    },
    {
      header: 'Items',
      accessor: (sale: Sale) => sale.items_count ?? (sale.items?.length || '-'),
      className: 'text-center'
    },
    {
      header: 'Total',
      accessor: (sale: Sale) => (
        <span className="font-bold font-mono text-slate-900">
          {parseFloat(sale.total).toFixed(2)}
        </span>
      ),
      className: 'text-right'
    },
    {
      header: 'Payment',
      accessor: (sale: Sale) => (
        <Badge
          variant={
            sale.payment_method === 'CASH'
              ? 'success'
              : sale.payment_method === 'CARD'
              ? 'info'
              : sale.payment_method === 'CREDIT'
              ? 'warning'
              : 'secondary'
          }>
          {sale.payment_method === 'CREDIT' ? 'CREDIT' : sale.payment_method}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: (sale: Sale) => {
        if (sale.status === 'CANCELLED') {
          return <Badge variant="error">Cancelled</Badge>;
        }
        if (sale.status === 'REPRINTED' || (sale.reprint_count != null && sale.reprint_count > 0)) {
          return (
            <Badge variant="info">
              Reprinted {sale.reprint_count ? `(${sale.reprint_count}x)` : ''}
            </Badge>
          );
        }
        if (sale.is_corrected) {
          return <Badge variant="warning">Corrected</Badge>;
        }
        return <Badge variant="success">Completed</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: (sale: Sale) => {
        const isCancelled = sale.status === 'CANCELLED';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* View Details */}
            <Button
              size="sm"
              variant="outline"
              title="View full bill details"
              className="h-8 px-2 text-xs"
              onClick={() => handleViewBill(sale)}>
              <EyeIcon className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">View</span>
            </Button>

            {/* Print Button (if 1st printing not recorded) OR Reprint Button (if 1st printing already recorded) */}
            {!isFirstPrintRecorded(sale) ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isCancelled}
                title={isCancelled ? 'Cannot print cancelled bill' : 'Print original bill'}
                className="h-8 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 disabled:opacity-40"
                onClick={() => openPrintPreview(sale, true)}>
                <PrinterIcon className="h-3.5 w-3.5 sm:mr-1 text-emerald-600" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={isCancelled}
                title={isCancelled ? 'Cannot reprint cancelled bill' : 'Reprint bill with customer name & audit log'}
                className="h-8 px-2 text-xs text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-200 disabled:opacity-40"
                onClick={() => handleOpenReprintModal(sale)}>
                <RefreshCwIcon className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Reprint</span>
              </Button>
            )}

            {/* Cancel Button */}
            <Button
              size="sm"
              variant="outline"
              disabled={isCancelled}
              title={isCancelled ? 'Bill is already cancelled' : 'Cancel bill & reverse inventory/cash'}
              className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 disabled:opacity-40"
              onClick={() => handleOpenCancelModal(sale)}>
              <BanIcon className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        );
      },
      className: 'text-right w-44'
    }
  ];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sales Management</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {totalCount} total transaction{totalCount !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isFilterOpen ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <FilterIcon className="h-4 w-4 mr-1.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}>
              <RefreshCwIcon className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-lg border text-sm flex items-center justify-between animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
            <div className="flex items-center gap-2.5">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2Icon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-600">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* API Error Alert */}
        {apiError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Quick Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Bill ID / Sale # Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Bill / Sale #..."
              value={billIdSearch}
              onChange={(e) => setBillIdSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
            />
            {billIdSearch && (
              <button
                onClick={() => setBillIdSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Customer Name Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Customer Name..."
              value={customerNameSearch}
              onChange={(e) => setCustomerNameSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
            />
            {customerNameSearch && (
              <button
                onClick={() => setCustomerNameSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Customer Mobile Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Mobile Number..."
              value={mobileNumberSearch}
              onChange={(e) => setMobileNumberSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
            />
            {mobileNumberSearch && (
              <button
                onClick={() => setMobileNumberSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Unified Text Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Unified search text..."
              value={generalSearch}
              onChange={(e) => setGeneralSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
            />
            {generalSearch && (
              <button
                onClick={() => setGeneralSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {isFilterOpen && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontalIcon className="h-4 w-4 text-emerald-600" />
                Filter by Date, Payment Method & Status
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  Reset All Filters ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Quick Date Range Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Quick Date Presets
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors">
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleSetYesterday}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors">
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={handleSetLast7Days}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors">
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors">
                  This Month
                </button>
                {(dateFilter || dateFromFilter || dateToFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('');
                      setDateFromFilter('');
                      setDateToFilter('');
                    }}
                    className="px-2.5 py-1 text-xs rounded-md text-red-600 hover:bg-red-50 border border-red-200 transition-colors">
                    Clear Dates
                  </button>
                )}
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {/* Single Date */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Exact Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    if (e.target.value) {
                      setDateFromFilter('');
                      setDateToFilter('');
                    }
                  }}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date Range From
                </label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => {
                    setDateFromFilter(e.target.value);
                    if (e.target.value) setDateFilter('');
                  }}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date Range To
                </label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => {
                    setDateToFilter(e.target.value);
                    if (e.target.value) setDateFilter('');
                  }}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="">All Payment Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="CREDIT">Credit (Pay Later)</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Bill Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REPRINTED">Reprinted</option>
                </select>
              </div>
            </div>

            {/* Sort Ordering */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sort By:</span>
                <select
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  className="h-8 px-2 text-xs rounded border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="-created_at">Date: Newest First</option>
                  <option value="created_at">Date: Oldest First</option>
                  <option value="-total">Total: High to Low</option>
                  <option value="total">Total: Low to High</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <Button size="sm" variant="secondary" onClick={handleClearAllFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Sales Table Card */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 sm:p-16 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-400 mt-3">Loading sales records...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table
                  data={sales}
                  columns={columns}
                  keyField="id"
                  onRowClick={(sale) => handleViewBill(sale)}
                  emptyMessage={
                    activeFilterCount > 0
                      ? 'No sales records match the current filter and search criteria.'
                      : 'No sales records found in system.'
                  }
                />
              </div>

              <div className="border-t border-slate-200">
                <Pagination
                  currentPage={currentPage}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 1. Single Sale View Details Modal */}
      <SingleSaleModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSaleId(null);
        }}
        saleId={selectedSaleId}
        onCancelRequested={(sale) => {
          setIsDetailModalOpen(false);
          handleOpenCancelModal(sale);
        }}
        onReprintRequested={(sale) => {
          setIsDetailModalOpen(false);
          handleOpenReprintModal(sale);
        }}
        onPrintRequested={(sale) => {
          setIsDetailModalOpen(false);
          openPrintPreview(sale, true);
        }}
      />

      {/* 2. Cancel Bill Modal */}
      <CancelBillModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSaleToCancel(null);
        }}
        sale={saleToCancel}
        onSuccess={handleCancelSuccess}
      />

      {/* 3. Reprint Bill Modal */}
      <ReprintBillModal
        isOpen={isReprintModalOpen}
        onClose={() => {
          setIsReprintModalOpen(false);
          setSaleToReprint(null);
        }}
        sale={saleToReprint}
        onSuccess={handleReprintSuccess}
      />

      {/* 4. Bill Receipt Preview Modal */}
      {billPreviewData && (
        <BillPreview
          isOpen={isBillPreviewOpen}
          onClose={() => setIsBillPreviewOpen(false)}
          saleId={billPreviewData.saleId}
          saleNumber={billPreviewData.saleNumber}
          createdAt={billPreviewData.createdAt}
          createdBy={billPreviewData.createdBy}
          customerName={billPreviewData.customerName}
          mobileNumber={billPreviewData.mobileNumber}
          paymentMethod={billPreviewData.paymentMethod}
          items={billPreviewData.items}
          total={billPreviewData.total}
          amountPaid={billPreviewData.amountPaid}
          change={billPreviewData.change}
          status={billPreviewData.status}
          canPrint={billPreviewData.canPrint}
          cancelledBy={billPreviewData.cancelledBy}
          cancelledAt={billPreviewData.cancelledAt}
          cancellationReason={billPreviewData.cancellationReason}
          originalBillData={billPreviewData.originalBillData}
          reprintedBy={billPreviewData.reprintedBy}
          reprintedAt={billPreviewData.reprintedAt}
          reprintCount={billPreviewData.reprintCount}
          reprintingData={billPreviewData.reprintingData}
          onPrinted={() => fetchSales(currentPage, true)}
        />
      )}
    </Layout>
  );
}