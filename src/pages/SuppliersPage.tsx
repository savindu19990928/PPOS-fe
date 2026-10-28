import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import {
  Supplier,
  SupplierFilterParams,
  RecordSupplierPaymentResponse,
  RecordSupplierRefundResponse,
  MarkNextSupplyResponse
} from '../types';
import { api } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

// Modals
import { CreateEditSupplierModal } from '../components/suppliers/CreateEditSupplierModal';
import { SupplierDetailModal } from '../components/suppliers/SupplierDetailModal';
import { RecordPaymentModal } from '../components/suppliers/RecordPaymentModal';
import { RecordRefundModal } from '../components/suppliers/RecordRefundModal';
import { MarkNextSupplyModal } from '../components/suppliers/MarkNextSupplyModal';
import { DeleteSupplierConfirmModal } from '../components/suppliers/DeleteSupplierConfirmModal';

// Tabs
import { NextSupplyingItemsTab } from '../components/suppliers/NextSupplyingItemsTab';
import { SupplierPaymentsTab } from '../components/suppliers/SupplierPaymentsTab';
import { SupplierAlertsTab } from '../components/suppliers/SupplierAlertsTab';

import {
  Building2Icon,
  PlusIcon,
  SearchIcon,
  RefreshCwIcon,
  PhoneIcon,
  MailIcon,
  DollarSignIcon,
  TruckIcon,
  CreditCardIcon,
  RotateCcwIcon,
  EyeIcon,
  Edit2Icon,
  Trash2Icon,
  CalendarIcon,
  BellIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  FilterIcon,
  LayersIcon,
  ArrowUpDownIcon,
  PackageIcon
} from 'lucide-react';

type TabType = 'directory' | 'deliveries' | 'finances' | 'alerts';

export function SuppliersPage() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const activeTab = (searchParams.get('tab') as TabType) || 'directory';
  const setActiveTab = (tab: TabType) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Directory Data State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuick, setFilterQuick] = useState<'all' | 'owed' | 'refund' | 'scheduled' | 'active'>('all');
  const [ordering, setOrdering] = useState('name');
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Notification / Alert count
  const [alertSummary, setAlertSummary] = useState<{ total: number; critical: number } | null>(null);

  // Modals state
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [supplierForPayment, setSupplierForPayment] = useState<Supplier | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [supplierForRefund, setSupplierForRefund] = useState<Supplier | null>(null);
  const [isRefundOpen, setIsRefundOpen] = useState(false);

  const [supplierForSupply, setSupplierForSupply] = useState<Supplier | null>(null);
  const [isSupplyOpen, setIsSupplyOpen] = useState(false);

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Banner feedback
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Suppliers List
  const fetchSuppliers = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setApiError(null);

      try {
        const params: SupplierFilterParams = {
          page,
          ordering
        };

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        if (filterQuick === 'owed') {
          params.has_amount_owed = true;
        } else if (filterQuick === 'refund') {
          params.has_refund_owed = true;
        } else if (filterQuick === 'scheduled') {
          params.has_next_supply = true;
        } else if (filterQuick === 'active') {
          params.is_active = true;
        }

        const res = await api.getSuppliers(params);

        if (Array.isArray(res)) {
          setSuppliers(res);
          setTotalCount(res.length);
        } else {
          setSuppliers(res.results || []);
          setTotalCount(res.count || (res.results ? res.results.length : 0));
        }
      } catch (err: any) {
        setApiError(err?.message || 'Failed to load suppliers.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, filterQuick, ordering]
  );

  // Fetch alert count for badge
  const fetchAlertBadges = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res?.summary) {
        setAlertSummary({
          total: res.summary.total_notifications,
          critical: res.summary.critical_count
        });
      }
    } catch {
      // Ignore background notification count errors
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchSuppliers(1);
  }, [fetchSuppliers]);

  useEffect(() => {
    fetchAlertBadges();
  }, [fetchAlertBadges]);

  // Handle modals callbacks
  const handleSupplierSaved = (saved: Supplier, isEdit: boolean) => {
    showFeedback(
      isEdit ? `Supplier '${saved.name}' updated successfully.` : `Supplier '${saved.name}' registered successfully.`
    );
    fetchSuppliers(currentPage, true);
    fetchAlertBadges();
  };

  const handlePaymentSuccess = (response: RecordSupplierPaymentResponse) => {
    showFeedback(response.message);
    fetchSuppliers(currentPage, true);
    fetchAlertBadges();
  };

  const handleRefundSuccess = (response: RecordSupplierRefundResponse) => {
    showFeedback(response.message);
    fetchSuppliers(currentPage, true);
    fetchAlertBadges();
  };

  const handleSupplySuccess = (response: MarkNextSupplyResponse) => {
    showFeedback(response.message);
    fetchSuppliers(currentPage, true);
    fetchAlertBadges();
  };

  const handleDeleteSuccess = () => {
    showFeedback('Supplier deleted successfully.');
    fetchSuppliers(currentPage, true);
    fetchAlertBadges();
  };

  // Open modals helper from external tabs
  const handleOpenPaymentById = (supplierId: number, name: string, amount?: string, dueDate?: string) => {
    const found = suppliers.find((s) => s.id === supplierId) || {
      id: supplierId,
      name,
      amount_owed: amount || '0.00',
      payment_due_date: dueDate || null,
      refund_owed: '0.00',
      is_active: true
    };
    setSupplierForPayment(found as Supplier);
    setIsPaymentOpen(true);
  };

  const handleOpenRefundById = (supplierId: number, name: string, amount?: string, dueDate?: string) => {
    const found = suppliers.find((s) => s.id === supplierId) || {
      id: supplierId,
      name,
      amount_owed: '0.00',
      refund_owed: amount || '0.00',
      refund_due_date: dueDate || null,
      is_active: true
    };
    setSupplierForRefund(found as Supplier);
    setIsRefundOpen(true);
  };

  const handleOpenSupplyById = (supplierId: number, name: string) => {
    const found = suppliers.find((s) => s.id === supplierId) || {
      id: supplierId,
      name,
      amount_owed: '0.00',
      refund_owed: '0.00',
      is_active: true
    };
    setSupplierForSupply(found as Supplier);
    setIsSupplyOpen(true);
  };

  // Quick statistics calculated from loaded list
  const totalAmountOwed = suppliers.reduce((acc, s) => acc + parseFloat(s.amount_owed || '0'), 0);
  const totalRefundOwed = suppliers.reduce((acc, s) => acc + parseFloat(s.refund_owed || '0'), 0);
  const suppliersWithDeliveryCount = suppliers.filter((s) => Boolean(s.next_supply_date)).length;

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <Building2Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Supplier Management
                </h1>
                <p className="text-sm text-slate-500">
                  Manage vendors, scheduled shipments, payables, and refund collections.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              onClick={() => {
                setSupplierToEdit(null);
                setIsCreateEditOpen(true);
              }}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Register Supplier
            </Button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2Icon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
              <span className="font-medium">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold hover:opacity-75">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto">
            <button
              type="button"
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'directory'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('directory')}>
              <Building2Icon className="h-4 w-4" />
              <span>Suppliers Directory</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-semibold">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'deliveries'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('deliveries')}>
              <TruckIcon className="h-4 w-4" />
              <span>Upcoming Deliveries</span>
            </button>

            <button
              type="button"
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'finances'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('finances')}>
              <DollarSignIcon className="h-4 w-4" />
              <span>Payables & Refunds</span>
            </button>

            <button
              type="button"
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'alerts'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('alerts')}>
              <BellIcon className="h-4 w-4" />
              <span>Supplier Alerts</span>
              {alertSummary && alertSummary.total > 0 && (
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                    alertSummary.critical > 0 ? 'bg-red-600' : 'bg-amber-600'
                  }`}>
                  {alertSummary.total}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab 1: Directory */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* KPI Metric Highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-4 bg-slate-50/60 border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Active Suppliers</span>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {suppliers.filter((s) => s.is_active).length}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Of {totalCount} total vendors</p>
              </Card>

              <Card className="p-4 bg-red-50/60 border-red-200">
                <span className="text-xs font-semibold text-red-800">Total Payables Owed</span>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  Rs. {totalAmountOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-red-600/80 mt-0.5">We must pay to suppliers</p>
              </Card>

              <Card className="p-4 bg-emerald-50/60 border-emerald-200">
                <span className="text-xs font-semibold text-emerald-800">Total Refunds Expected</span>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  Rs. {totalRefundOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">Suppliers owe us</p>
              </Card>

              <Card className="p-4 bg-sky-50/60 border-sky-200">
                <span className="text-xs font-semibold text-sky-800">Deliveries Scheduled</span>
                <div className="text-2xl font-bold text-sky-700 mt-2">
                  {suppliersWithDeliveryCount}
                </div>
                <p className="text-[11px] text-sky-600/80 mt-0.5">Vendors with next supply date</p>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="p-4 bg-white border-slate-200">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
                  {/* Search */}
                  <div className="relative w-full sm:w-80">
                    <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, contact, phone, email..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'owed', label: 'We Owe' },
                      { id: 'refund', label: 'Refunds' },
                      { id: 'scheduled', label: 'Scheduled Delivery' },
                      { id: 'active', label: 'Active Only' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          filterQuick === f.id
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        onClick={() => setFilterQuick(f.id as any)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Ordering */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ArrowUpDownIcon className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      className="py-1.5 px-2 text-xs border border-slate-300 rounded-lg bg-white"
                      value={ordering}
                      onChange={(e) => setOrdering(e.target.value)}>
                      <option value="name">Name (A-Z)</option>
                      <option value="-name">Name (Z-A)</option>
                      <option value="-amount_owed">Amount Owed (High to Low)</option>
                      <option value="next_supply_date">Next Supply Date (Earliest)</option>
                      <option value="-created_at">Recently Added</option>
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchSuppliers(currentPage, true)}
                    isLoading={isRefreshing}>
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Error Message */}
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Suppliers Table */}
            <Card className="overflow-hidden border-slate-200">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-3 text-sm text-slate-500">Loading suppliers directory...</p>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2Icon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-semibold text-slate-700">No suppliers found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your filters, or click "Register Supplier" to add a new vendor.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Payables (We Owe)</th>
                        <th className="py-3 px-4">Refunds (Owed to Us)</th>
                        <th className="py-3 px-4">Next Delivery</th>
                        <th className="py-3 px-4">Products</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {suppliers.map((s) => {
                        const amountOwed = parseFloat(s.amount_owed || '0');
                        const refundOwed = parseFloat(s.refund_owed || '0');

                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            {/* Supplier Name & Status */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{s.name}</span>
                                {!s.is_active && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              {s.contact_person && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Rep: {s.contact_person}
                                </p>
                              )}
                            </td>

                            {/* Phone & Email */}
                            <td className="py-3 px-4">
                              <div className="space-y-0.5 text-xs">
                                {s.phone ? (
                                  <a
                                    href={`tel:${s.phone}`}
                                    className="text-emerald-600 hover:underline flex items-center gap-1 font-medium">
                                    <PhoneIcon className="h-3 w-3" />
                                    {s.phone}
                                  </a>
                                ) : (
                                  <span className="text-slate-400">No phone</span>
                                )}
                                {s.email && (
                                  <a
                                    href={`mailto:${s.email}`}
                                    className="text-slate-500 hover:underline flex items-center gap-1 truncate max-w-[170px]">
                                    <MailIcon className="h-3 w-3" />
                                    {s.email}
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Payables */}
                            <td className="py-3 px-4">
                              <div
                                className={`font-bold ${
                                  amountOwed > 0 ? 'text-red-600' : 'text-slate-500'
                                }`}>
                                Rs. {amountOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              {amountOwed > 0 && s.payment_due_date && (
                                <div className="mt-0.5">
                                  {s.is_payment_overdue ? (
                                    <Badge variant="error" className="text-[10px]">
                                      Overdue ({Math.abs(s.days_until_payment_due || 0)}d)
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] text-slate-500">
                                      Due in {s.days_until_payment_due}d ({s.payment_due_date})
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Refunds */}
                            <td className="py-3 px-4">
                              <div
                                className={`font-bold ${
                                  refundOwed > 0 ? 'text-emerald-600' : 'text-slate-500'
                                }`}>
                                Rs. {refundOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              {refundOwed > 0 && s.refund_due_date && (
                                <div className="mt-0.5">
                                  {s.is_refund_overdue ? (
                                    <Badge variant="error" className="text-[10px]">
                                      Overdue ({Math.abs(s.days_until_refund_due || 0)}d)
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] text-slate-500">
                                      Due in {s.days_until_refund_due}d
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Next Delivery */}
                            <td className="py-3 px-4">
                              {s.next_supply_date ? (
                                <div>
                                  <div className="font-medium text-slate-800 text-xs flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3 text-slate-400" />
                                    {s.next_supply_date}
                                  </div>
                                  <div className="mt-0.5">
                                    {s.days_until_next_supply === 0 ? (
                                      <Badge variant="success" className="text-[10px]">
                                        Today
                                      </Badge>
                                    ) : (s.days_until_next_supply || 0) < 0 ? (
                                      <Badge variant="error" className="text-[10px]">
                                        {Math.abs(s.days_until_next_supply || 0)}d Overdue
                                      </Badge>
                                    ) : (
                                      <span className="text-[11px] text-slate-500">
                                        In {s.days_until_next_supply} days
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">None scheduled</span>
                              )}
                            </td>

                            {/* Products Count */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                                <PackageIcon className="h-3 w-3 text-slate-400" />
                                {s.products_count ?? (s.products ? s.products.length : 0)} items
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  title="View Details"
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                  onClick={() => {
                                    setSelectedSupplier(s);
                                    setIsDetailOpen(true);
                                  }}>
                                  <EyeIcon className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  title="Schedule Delivery"
                                  className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-md transition-colors"
                                  onClick={() => {
                                    setSupplierForSupply(s);
                                    setIsSupplyOpen(true);
                                  }}>
                                  <TruckIcon className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  title="Record Payment"
                                  className={`p-1.5 rounded-md transition-colors ${
                                    amountOwed > 0
                                      ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                      : 'text-slate-300 hover:bg-slate-100'
                                  }`}
                                  onClick={() => {
                                    setSupplierForPayment(s);
                                    setIsPaymentOpen(true);
                                  }}>
                                  <CreditCardIcon className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  title="Record Refund"
                                  className={`p-1.5 rounded-md transition-colors ${
                                    refundOwed > 0
                                      ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                                      : 'text-slate-300 hover:bg-slate-100'
                                  }`}
                                  onClick={() => {
                                    setSupplierForRefund(s);
                                    setIsRefundOpen(true);
                                  }}>
                                  <RotateCcwIcon className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  title="Edit Supplier"
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                  onClick={() => {
                                    setSupplierToEdit(s);
                                    setIsCreateEditOpen(true);
                                  }}>
                                  <Edit2Icon className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  title="Delete Supplier"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  onClick={() => {
                                    setSupplierToDelete(s);
                                    setIsDeleteOpen(true);
                                  }}>
                                  <Trash2Icon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalCount > 20 && (
                <div className="p-4 border-t border-slate-200">
                  <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      fetchSuppliers(page);
                    }}
                  />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab 2: Upcoming Deliveries & Next Supplying Items */}
        {activeTab === 'deliveries' && (
          <NextSupplyingItemsTab
            suppliers={suppliers}
            onSelectSupplier={(id) => {
              const s = suppliers.find((x) => x.id === id);
              if (s) {
                setSelectedSupplier(s);
                setIsDetailOpen(true);
              }
            }}
          />
        )}

        {/* Tab 3: Payables & Refunds Dashboard */}
        {activeTab === 'finances' && (
          <SupplierPaymentsTab
            onRecordPayment={handleOpenPaymentById}
            onRecordRefund={handleOpenRefundById}
          />
        )}

        {/* Tab 4: Supplier Alerts & Notifications */}
        {activeTab === 'alerts' && (
          <SupplierAlertsTab
            onPaySupplier={(id, name, amt) => handleOpenPaymentById(id, name, amt)}
            onReceiveRefund={(id, name, amt) => handleOpenRefundById(id, name, amt)}
            onScheduleDelivery={(id, name) => handleOpenSupplyById(id, name)}
          />
        )}

        {/* Modals */}
        <CreateEditSupplierModal
          isOpen={isCreateEditOpen}
          onClose={() => setIsCreateEditOpen(false)}
          supplierToEdit={supplierToEdit}
          onSuccess={handleSupplierSaved}
        />

        <SupplierDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          supplier={selectedSupplier}
          onRecordPayment={(s) => {
            setIsDetailOpen(false);
            setSupplierForPayment(s);
            setIsPaymentOpen(true);
          }}
          onRecordRefund={(s) => {
            setIsDetailOpen(false);
            setSupplierForRefund(s);
            setIsRefundOpen(true);
          }}
          onMarkNextSupply={(s) => {
            setIsDetailOpen(false);
            setSupplierForSupply(s);
            setIsSupplyOpen(true);
          }}
          onEdit={(s) => {
            setIsDetailOpen(false);
            setSupplierToEdit(s);
            setIsCreateEditOpen(true);
          }}
        />

        <RecordPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          supplier={supplierForPayment}
          onSuccess={handlePaymentSuccess}
        />

        <RecordRefundModal
          isOpen={isRefundOpen}
          onClose={() => setIsRefundOpen(false)}
          supplier={supplierForRefund}
          onSuccess={handleRefundSuccess}
        />

        <MarkNextSupplyModal
          isOpen={isSupplyOpen}
          onClose={() => setIsSupplyOpen(false)}
          supplier={supplierForSupply}
          onSuccess={handleSupplySuccess}
        />

        <DeleteSupplierConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          supplier={supplierToDelete}
          onSuccess={handleDeleteSuccess}
        />
      </div>
    </Layout>
  );
}
