import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { User, UserFilterParams, UserRole } from '../types';
import { api } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

// Modals
import { CreateUserModal } from '../components/users/CreateUserModal';
import { UserHistoryModal } from '../components/users/UserHistoryModal';
import { BlockUserConfirmModal } from '../components/users/BlockUserConfirmModal';
import { DeleteUserConfirmModal } from '../components/users/DeleteUserConfirmModal';

import {
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  RefreshCwIcon,
  ShieldIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  HistoryIcon,
  BanIcon,
  UnlockIcon,
  Trash2Icon,
  AlertCircleIcon,
  CheckCircle2Icon,
  FilterIcon,
  ClockIcon,
  CalendarIcon
} from 'lucide-react';

export function UsersPage() {
  const { user: currentUser } = useAuth();

  // Users data state
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ordering, setOrdering] = useState<string>('-date_joined');
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userForHistory, setUserForHistory] = useState<User | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userForBlock, setUserForBlock] = useState<User | null>(null);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [userForDelete, setUserForDelete] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch Users
  const fetchUsers = useCallback(
    async (page: number, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setApiError(null);

      try {
        const params: UserFilterParams = {
          page,
          ordering
        };

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        if (roleFilter !== 'all') {
          params.role = roleFilter as UserRole;
        }

        if (statusFilter === 'active') {
          params.is_active = true;
        } else if (statusFilter === 'blocked') {
          params.is_active = false;
        }

        const res = await api.getUsers(params);

        if (Array.isArray(res)) {
          setUsers(res);
          setTotalCount(res.length);
        } else if (res && Array.isArray(res.results)) {
          setUsers(res.results);
          setTotalCount(res.count);
        } else {
          setUsers([]);
          setTotalCount(0);
        }
      } catch (err: any) {
        setApiError(err.message || 'Failed to load user accounts.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, roleFilter, statusFilter, ordering]
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const handleRefresh = () => {
    fetchUsers(currentPage, true);
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Metrics
  const totalUsers = totalCount || users.length;
  const cashiersCount = users.filter((u) => u.role === 'CASHIER').length;
  const adminsCount = users.filter((u) => u.role === 'ADMIN').length;
  const blockedCount = users.filter((u) => u.is_active === false).length;

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: (u: User) => {
        const isSelf = currentUser?.id === u.id || currentUser?.username === u.username;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                u.role === 'ADMIN'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
              {u.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                </p>
                {isSelf && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">@{u.username} {u.email ? `• ${u.email}` : ''}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Role',
      accessor: (u: User) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            u.role === 'ADMIN'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
          {u.role === 'ADMIN' && <ShieldIcon className="h-3 w-3" />}
          {u.role || 'CASHIER'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (u: User) => (
        <Badge variant={u.is_active !== false ? 'success' : 'error'}>
          {u.is_active !== false ? 'Active' : 'Blocked'}
        </Badge>
      )
    },
    {
      header: 'Date Joined',
      accessor: (u: User) => (
        <span className="text-xs text-slate-600 font-mono">
          {formatDate(u.date_joined)}
        </span>
      )
    },
    {
      header: 'Last Login',
      accessor: (u: User) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDate(u.last_login)}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (u: User) => {
        const isTargetAdmin = u.role === 'ADMIN';
        const isSelf = currentUser?.id === u.id || currentUser?.username === u.username;
        const isBlocked = u.is_active === false;

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* View Operational History */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setUserForHistory(u);
                setIsHistoryOpen(true);
              }}
              title="View Operational History & Audit Trail"
              className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs px-2.5">
              <HistoryIcon className="h-3.5 w-3.5 mr-1" />
              History
            </Button>

            {/* Block / Unblock */}
            <Button
              size="sm"
              variant="outline"
              disabled={isTargetAdmin || isSelf}
              onClick={() => {
                setUserForBlock(u);
                setIsBlockOpen(true);
              }}
              title={
                isTargetAdmin
                  ? 'Admin accounts cannot be blocked'
                  : isSelf
                  ? 'Cannot block own account'
                  : isBlocked
                  ? 'Unblock user'
                  : 'Block user'
              }
              className={`text-xs px-2.5 ${
                isBlocked
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-amber-600 hover:bg-amber-50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}>
              {isBlocked ? (
                <>
                  <UnlockIcon className="h-3.5 w-3.5 mr-1" />
                  Unblock
                </>
              ) : (
                <>
                  <BanIcon className="h-3.5 w-3.5 mr-1" />
                  Block
                </>
              )}
            </Button>

            {/* Delete Account */}
            <Button
              size="sm"
              variant="outline"
              disabled={isTargetAdmin || isSelf}
              onClick={() => {
                setUserForDelete(u);
                setIsDeleteOpen(true);
              }}
              title={
                isTargetAdmin
                  ? 'Admin accounts cannot be deleted'
                  : isSelf
                  ? 'Cannot delete own account'
                  : 'Delete user account'
              }
              className="text-red-600 hover:bg-red-50 text-xs px-2 disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2Icon className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
      className: 'text-right'
    }
  ];

  return (
    <Layout>
      <div className="space-y-5">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl animate-in slide-in-from-top-4 duration-200 text-xs">
            <CheckCircle2Icon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <UsersIcon className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                User Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Admin-only control for creating employees, managing permissions, blocking access, and auditing history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}>
              <RefreshCwIcon className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}>
              <UserPlusIcon className="h-4 w-4 mr-1.5" />
              New Employee
            </Button>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5">
            <p className="text-xs text-slate-500 font-medium">Total Employees</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-1">{totalUsers}</p>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-blue-500">
            <p className="text-xs text-slate-500 font-medium">Cashiers</p>
            <p className="text-xl font-bold text-blue-700 font-mono mt-1">{cashiersCount}</p>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-emerald-500">
            <p className="text-xs text-slate-500 font-medium">Admins</p>
            <p className="text-xl font-bold text-emerald-700 font-mono mt-1">{adminsCount}</p>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-red-500">
            <p className="text-xs text-slate-500 font-medium">Blocked Accounts</p>
            <p className="text-xl font-bold text-red-700 font-mono mt-1">{blockedCount}</p>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username, full name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
            <option value="all">All Roles</option>
            <option value="CASHIER">Cashiers Only</option>
            <option value="ADMIN">Admins Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="blocked">Blocked Accounts</option>
          </select>

          {/* Ordering */}
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
            <option value="-date_joined">Joined: Newest First</option>
            <option value="date_joined">Joined: Oldest First</option>
            <option value="username">Username A-Z</option>
            <option value="-username">Username Z-A</option>
          </select>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table
            data={users}
            columns={columns}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchQuery
                ? `No users found matching "${searchQuery}".`
                : 'No employee accounts found.'
            }
          />
          <div className="border-t border-slate-200 bg-white">
            <Pagination
              currentPage={currentPage}
              totalCount={totalCount}
              pageSize={20}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>

        {/* Modals */}
        <CreateUserModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={(newUser) => {
            showNotification(`User '${newUser.username}' created successfully.`);
            handleRefresh();
          }}
        />

        <UserHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => {
            setIsHistoryOpen(false);
            setUserForHistory(null);
          }}
          user={userForHistory}
        />

        <BlockUserConfirmModal
          isOpen={isBlockOpen}
          onClose={() => {
            setIsBlockOpen(false);
            setUserForBlock(null);
          }}
          user={userForBlock}
          onSuccess={(updatedUser, message) => {
            showNotification(message);
            handleRefresh();
          }}
        />

        <DeleteUserConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setUserForDelete(null);
          }}
          user={userForDelete}
          onSuccess={(_userId, message) => {
            showNotification(message);
            handleRefresh();
          }}
        />
      </div>
    </Layout>
  );
}
