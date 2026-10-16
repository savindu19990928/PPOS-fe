import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import {
  CustomerCreditProfile,
  CreditProfileFilterParams
} from '../types';
import { api } from '../lib/api';
import { CollectPaymentModal } from '../components/credit/CollectPaymentModal';
import { CreditProfileDetailModal } from '../components/credit/CreditProfileDetailModal';
import { CreditCustomerModal } from '../components/credit/CreditCustomerModal';
import { BanCustomerModal } from '../components/credit/BanCustomerModal';
import {
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  PlusIcon,
  WalletIcon,
  EyeIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  EditIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ArrowUpDownIcon,
  PhoneIcon
} from 'lucide-react';

export function CreditPage() {
  const { isAdmin } = useAuth();

  // Data state
  const [profiles, setProfiles] = useState<CustomerCreditProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'banned' | 'active'>('all');
  const [ordering, setOrdering] = useState('-current_balance');

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCreditProfile | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerCreditProfile | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [customerToBan, setCustomerToBan] = useState<CustomerCreditProfile | null>(null);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProfiles = useCallback(
    async (page: number, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setApiError(null);

      try {
        const params: CreditProfileFilterParams = {
          page,
          ordering
        };

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        if (filterType === 'due') {
          params.has_due = true;
        } else if (filterType === 'banned') {
          params.is_banned = true;
        } else if (filterType === 'active') {
          params.is_banned = false;
        }

        const res = await api.getCreditProfiles(params);

        if (Array.isArray(res)) {
          setProfiles(res);
          setTotalCount(res.length);
        } else {
          setProfiles(res.results || []);
          setTotalCount(res.count || 0);
        }
      } catch (err: any) {
        console.error('Failed to fetch credit profiles:', err);
        setApiError(err?.message || 'Failed to load credit profiles. Please check server connection.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, filterType, ordering]
  );

  useEffect(() => {
    fetchProfiles(currentPage);
  }, [fetchProfiles, currentPage]);

  const handleRefresh = () => {
    fetchProfiles(currentPage, true);
  };

  const handleOpenCollectModal = (customer: CustomerCreditProfile) => {
    setSelectedCustomer(customer);
    setIsCollectModalOpen(true);
  };

  const handleOpenDetailModal = (customer: CustomerCreditProfile) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditModal = (customer: CustomerCreditProfile) => {
    setCustomerToEdit(customer);
    setIsCustomerModalOpen(true);
  };

  const handleOpenBanModal = (customer: CustomerCreditProfile) => {
    setCustomerToBan(customer);
    setIsBanModalOpen(true);
  };

  const handleUnban = async (customer: CustomerCreditProfile) => {
    if (!confirm(`Are you sure you want to unban ${customer.customer_name} from credit purchases?`)) {
      return;
    }
    try {
      await api.unbanCreditCustomer(customer.id);
      showFeedback(`Customer ${customer.customer_name} has been unbanned.`, 'success');
      handleRefresh();
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to unban customer.', 'error');
    }
  };

  // Aggregated summaries from current loaded dataset
  const totalDebtSum = profiles.reduce(
    (sum, p) => sum + Math.max(0, parseFloat(p.current_balance || '0')),
    0
  );
  const totalRepaidSum = profiles.reduce(
    (sum, p) => sum + parseFloat(p.total_paid || '0'),
    0
  );
  const bannedCount = profiles.filter((p) => p.is_banned).length;
  const customersWithDebtCount = profiles.filter(
    (p) => parseFloat(p.current_balance || '0') > 0
  ).length;

  const columns = [
    {
      header: 'Customer',
      accessor: (p: CustomerCreditProfile) => (
        <div className="flex items-center gap-2.5">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              p.is_banned
                ? 'bg-red-50 text-red-700 border border-red-200'
                : parseFloat(p.current_balance) > 0
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
            {p.customer_name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate text-sm">
              {p.customer_name}
            </p>
            <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
              <PhoneIcon className="h-3 w-3 text-slate-400" />
              {p.mobile_number}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Debt Due (LKR)',
      accessor: (p: CustomerCreditProfile) => {
        const bal = parseFloat(p.current_balance || '0');
        return (
          <span
            className={`font-mono font-bold text-sm ${
              bal > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
            {bal.toFixed(2)}
          </span>
        );
      },
      className: 'text-right'
    },
    {
      header: 'Total Credit',
      accessor: (p: CustomerCreditProfile) => (
        <span className="font-mono text-xs text-slate-700">
          {parseFloat(p.total_credit || '0').toFixed(2)}
        </span>
      ),
      className: 'text-right'
    },
    {
      header: 'Total Repaid',
      accessor: (p: CustomerCreditProfile) => (
        <span className="font-mono text-xs text-emerald-700 font-medium">
          {parseFloat(p.total_paid || '0').toFixed(2)}
        </span>
      ),
      className: 'text-right'
    },
    {
      header: 'Status',
      accessor: (p: CustomerCreditProfile) => {
        if (p.is_banned) {
          return (
            <Badge variant="error" title={p.ban_reason || 'Banned'}>
              Banned
            </Badge>
          );
        }
        if (parseFloat(p.current_balance || '0') > 0) {
          return <Badge variant="warning">Owes Debt</Badge>;
        }
        return <Badge variant="success">Settled</Badge>;
      },
      className: 'text-center'
    },
    {
      header: 'Actions',
      accessor: (p: CustomerCreditProfile) => {
        const bal = parseFloat(p.current_balance || '0');
        return (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}>
            {/* Collect Payment (Both Cashier & Admin) */}
            <Button
              size="sm"
              variant="outline"
              disabled={bal <= 0}
              title={bal <= 0 ? 'No outstanding debt to collect' : 'Collect debt payment at register'}
              className="h-8 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 disabled:opacity-40"
              onClick={() => handleOpenCollectModal(p)}>
              <WalletIcon className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Collect
            </Button>

            {/* View Details */}
            <Button
              size="sm"
              variant="outline"
              title="View full debt and payment audit"
              className="h-8 px-2 text-xs"
              onClick={() => handleOpenDetailModal(p)}>
              <EyeIcon className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Details</span>
            </Button>

            {/* Admin Actions: Ban/Unban & Edit */}
            {isAdmin && (
              <>
                {p.is_banned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    title="Unban customer"
                    className="h-8 px-2 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => handleUnban(p)}>
                    <ShieldCheckIcon className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    title="Ban from credit purchases"
                    className="h-8 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleOpenBanModal(p)}>
                    <ShieldAlertIcon className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  title="Edit profile"
                  className="h-8 px-2 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
                  onClick={() => handleOpenEditModal(p)}>
                  <EditIcon className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        );
      },
      className: 'text-right'
    }
  ];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Customer Credit Accounts
              </h1>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pay Later Debt
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage customer credit profiles, track outstanding balances, and collect debt payments at the register.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                onClick={handleOpenCreateModal}>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                New Credit Account
              </Button>
            )}

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
        {feedback && (
          <div
            className={`p-3.5 rounded-lg border text-sm flex items-center justify-between animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2Icon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 ml-4">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
              Total Debt Owed
            </span>
            <p className="text-xl sm:text-2xl font-black font-mono text-red-600 mt-1">
              LKR {totalDebtSum.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {customersWithDebtCount} customer{customersWithDebtCount !== 1 ? 's' : ''} with balance
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Debt Repaid
            </span>
            <p className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1">
              LKR {totalRepaidSum.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Collected across all accounts
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
              Total Credit Accounts
            </span>
            <p className="text-xl sm:text-2xl font-black font-mono text-indigo-600 mt-1">
              {totalCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Registered customers
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Banned Customers
            </span>
            <p className="text-xl sm:text-2xl font-black font-mono text-slate-800 mt-1">
              {bannedCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Blocked from taking credit
            </p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => {
                  setFilterType('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                All ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterType('due');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterType === 'due'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}>
                Owes Debt
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterType('active');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterType === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}>
                Active
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterType('banned');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterType === 'banned'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}>
                Banned
              </button>

              {/* Sorting */}
              <div className="ml-2 flex items-center gap-1 text-xs text-slate-500">
                <ArrowUpDownIcon className="h-3.5 w-3.5" />
                <select
                  value={ordering}
                  onChange={(e) => {
                    setOrdering(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="-current_balance">Highest Debt First</option>
                  <option value="current_balance">Lowest Debt First</option>
                  <option value="customer_name">Name (A-Z)</option>
                  <option value="-created_at">Newest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Error Loading Credit Profiles</p>
              <p className="mt-0.5">{apiError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        )}

        {/* Profiles Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <Table
            columns={columns}
            data={profiles}
            isLoading={isLoading}
            emptyMessage={
              debouncedSearch || filterType !== 'all'
                ? 'No customer credit profiles found matching your filters.'
                : 'No customer credit accounts have been recorded yet.'
            }
            onRowClick={(p) => handleOpenDetailModal(p)}
          />

          {totalCount > 10 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {profiles.length} of {totalCount} credit profiles
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / 10)}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Collect Repayment Modal */}
      <CollectPaymentModal
        isOpen={isCollectModalOpen}
        onClose={() => {
          setIsCollectModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onPaymentSuccess={(res) => {
          showFeedback(
            `Collected payment of LKR ${parseFloat(res.payment.amount).toFixed(2)} (${res.receipt_number})`,
            'success'
          );
          handleRefresh();
        }}
      />

      {/* Credit Profile Detail Modal */}
      <CreditProfileDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCustomer(null);
        }}
        customerId={selectedCustomer?.id || null}
        isAdmin={isAdmin}
        onCollectPaymentRequested={(c) => {
          setIsDetailModalOpen(false);
          handleOpenCollectModal(c);
        }}
        onBanRequested={(c) => {
          setIsDetailModalOpen(false);
          handleOpenBanModal(c);
        }}
        onEditRequested={(c) => {
          setIsDetailModalOpen(false);
          handleOpenEditModal(c);
        }}
        onProfileUpdated={handleRefresh}
      />

      {/* Create / Edit Credit Profile Modal */}
      <CreditCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customer={customerToEdit}
        onSuccess={() => {
          showFeedback(
            customerToEdit
              ? 'Customer profile updated successfully.'
              : 'Customer credit profile created successfully.',
            'success'
          );
          handleRefresh();
        }}
      />

      {/* Ban Customer Modal */}
      <BanCustomerModal
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setCustomerToBan(null);
        }}
        customer={customerToBan}
        onSuccess={() => {
          showFeedback(
            `Customer ${customerToBan?.customer_name} has been banned from credit purchases.`,
            'success'
          );
          handleRefresh();
        }}
      />
    </Layout>
  );
}
