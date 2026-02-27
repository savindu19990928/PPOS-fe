import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Table } from '../components/ui/Table';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { BillPreview } from '../components/pos/BillPreview';
import { api } from '../lib/api';
import { Sale, SaleItem, BillItem, PaginatedResponse } from '../types';
import {
  Loader2,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
  EyeIcon } from
'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isLoadingBill, setIsLoadingBill] = useState(false);
  const [billData, setBillData] = useState<{
    saleNumber: string;
    createdAt: string;
    createdBy: string;
    customerName: string;
    paymentMethod: string;
    items: BillItem[];
    total: number;
    amountPaid: number;
    change: number;
  } | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const fetchSales = useCallback(
    async (page: number, search?: string, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const data: PaginatedResponse<Sale> = await api.getSales(page, search);
        setSales(data.results);
        setTotalCount(data.count);
      } catch (error) {
        console.error('Failed to fetch sales', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );
  useEffect(() => {
    setCurrentPage(1);
    fetchSales(1, debouncedSearch || undefined);
  }, [debouncedSearch, fetchSales]);
  useEffect(() => {
    fetchSales(currentPage, debouncedSearch || undefined);
  }, [currentPage, fetchSales]);
  const handleRefresh = () => {
    fetchSales(currentPage, debouncedSearch || undefined, true);
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleViewBill = async (sale: Sale) => {
    setIsLoadingBill(true);
    try {
      const detail = await api.getSaleDetails(sale.id);
      const saleItems: SaleItem[] = detail.items || [];
      const billItems: BillItem[] = saleItems.map(
        (item: SaleItem, idx: number) => ({
          id: item.product || idx,
          name: item.product_name || 'Product #' + item.product,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unit_price),
          subtotal: parseFloat(item.quantity) * parseFloat(item.unit_price)
        })
      );
      const saleTotal = parseFloat(detail.total || sale.total);
      const saleAmountPaid = parseFloat(
        detail.amount_paid || detail.total || sale.total
      );
      const saleChange = parseFloat(detail.change || '0');
      setBillData({
        saleNumber: detail.sale_number || sale.sale_number,
        createdAt: detail.created_at || sale.created_at,
        createdBy: detail.created_by_name || sale.created_by_name,
        customerName: detail.customer_name || sale.customer_name || '',
        paymentMethod: detail.payment_method || sale.payment_method,
        items: billItems,
        total: saleTotal,
        amountPaid: saleAmountPaid,
        change: saleChange
      });
      setIsBillOpen(true);
    } catch (error) {
      console.error('Failed to load sale details', error);
      alert('Failed to load bill details.');
    } finally {
      setIsLoadingBill(false);
    }
  };
  const columns = [
  {
    header: 'Sale #',
    accessor: 'sale_number' as keyof Sale,
    className: 'font-medium text-slate-900 font-mono'
  },
  {
    header: 'Date',
    accessor: (sale: Sale) => new Date(sale.created_at).toLocaleString()
  },
  {
    header: 'Customer',
    accessor: (sale: Sale) => sale.customer_name || 'Walk-in'
  },
  {
    header: 'Items',
    accessor: 'items_count' as keyof Sale
  },
  {
    header: 'Total',
    accessor: (sale: Sale) =>
    <span className="font-bold font-mono">
          {parseFloat(sale.total).toFixed(2)}
        </span>,

    className: 'text-right'
  },
  {
    header: 'Method',
    accessor: (sale: Sale) =>
    <Badge variant={sale.payment_method === 'CASH' ? 'success' : 'default'}>
          {sale.payment_method}
        </Badge>

  },
  {
    header: 'Status',
    accessor: (sale: Sale) =>
    sale.is_corrected ?
    <Badge variant="warning">Corrected</Badge> :

    <Badge variant="success">Completed</Badge>

  },
  {
    header: '',
    accessor: (sale: Sale) =>
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => {
        e.stopPropagation();
        handleViewBill(sale);
      }}
      disabled={isLoadingBill}>

          <EyeIcon className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">View Bill</span>
        </Button>,

    className: 'text-right w-24 sm:w-32'
  }];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Sales History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {totalCount} sales total
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}>

            <RefreshCwIcon
              className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />

            Refresh
          </Button>
        </div>

        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm shadow-sm"
            placeholder="Search by sale number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />

          {searchQuery &&
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">

              <XIcon className="h-4 w-4" />
            </button>
          }
        </div>

        <Card className="overflow-hidden">
          {isLoading ?
          <div className="p-12 sm:p-16 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-400 mt-3">Loading sales...</p>
            </div> :

          <>
              <div className="overflow-x-auto">
                <Table
                data={sales}
                columns={columns}
                keyField="id"
                emptyMessage={
                searchQuery ?
                `No sales found for "${searchQuery}"` :
                'No sales records found.'
                } />

              </div>
              <div className="border-t border-slate-200">
                <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                onPageChange={handlePageChange} />

              </div>
            </>
          }
        </Card>
      </div>

      {billData &&
      <BillPreview
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        saleNumber={billData.saleNumber}
        createdAt={billData.createdAt}
        createdBy={billData.createdBy}
        customerName={billData.customerName}
        paymentMethod={billData.paymentMethod}
        items={billData.items}
        total={billData.total}
        amountPaid={billData.amountPaid}
        change={billData.change} />

      }
    </Layout>);

}