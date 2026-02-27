import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { api } from '../lib/api';
import { CashRegister, CashTransaction, PaginatedResponse } from '../types';
import {
  Loader2,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCwIcon } from
'lucide-react';
export function RegisterPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transType, setTransType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchData = useCallback(
    async (page: number = 1, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const regs = await api.getRegisters();
        setRegisters(regs);
        if (regs.length > 0) {
          const regId = selectedRegister || regs[0].id;
          if (!selectedRegister) setSelectedRegister(regId);
          const data: PaginatedResponse<CashTransaction> =
          await api.getRegisterTransactions(regId, page);
          setTransactions(data.results);
          setTotalCount(data.count);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedRegister]
  );
  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [selectedRegister]);
  useEffect(() => {
    if (selectedRegister) {
      fetchData(currentPage);
    }
  }, [currentPage]);
  const handleRefresh = () => {
    fetchData(currentPage, true);
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegister) return;
    setIsSubmitting(true);
    try {
      await api.createCashTransaction({
        cash_register: selectedRegister,
        transaction_type: transType,
        amount: amount,
        notes: notes,
        denominations: []
      });
      setIsModalOpen(false);
      setAmount('');
      setNotes('');
      fetchData(currentPage, true);
    } catch (error) {
      console.error(error);
      alert('Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  const columns = [
  {
    header: 'Type',
    accessor: (t: CashTransaction) =>
    <span
      className={`flex items-center font-medium ${t.transaction_type === 'CASH_IN' ? 'text-emerald-600' : t.transaction_type === 'CASH_OUT' ? 'text-red-600' : 'text-blue-600'}`}>

          {t.transaction_type === 'CASH_IN' &&
      <ArrowDownIcon className="h-4 w-4 mr-1" />
      }
          {t.transaction_type === 'CASH_OUT' &&
      <ArrowUpIcon className="h-4 w-4 mr-1" />
      }
          {t.transaction_type}
        </span>

  },
  {
    header: 'Amount',
    accessor: (t: CashTransaction) => parseFloat(t.amount).toFixed(2),
    className: 'font-mono'
  },
  {
    header: 'Notes',
    accessor: 'notes' as keyof CashTransaction
  },
  {
    header: 'Date',
    accessor: (t: CashTransaction) => new Date(t.created_at).toLocaleString()
  },
  {
    header: 'User',
    accessor: 'created_by_name' as keyof CashTransaction
  }];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Cash Register Management
          </h1>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}>

              <RefreshCwIcon
                className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />

              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTransType('CASH_IN');
                setIsModalOpen(true);
              }}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">

              <ArrowDownIcon className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Cash </span>In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTransType('CASH_OUT');
                setIsModalOpen(true);
              }}
              className="text-red-600 border-red-200 hover:bg-red-50">

              <ArrowUpIcon className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Cash </span>Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {registers.map((reg) =>
          <Card
            key={reg.id}
            className={`cursor-pointer transition-all ${selectedRegister === reg.id ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:shadow-md'}`}>

              <div onClick={() => setSelectedRegister(reg.id)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-slate-900">{reg.name}</h3>
                  <span
                  className={`px-2 py-1 rounded-full text-xs ${reg.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>

                    {reg.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">Current Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  {parseFloat(reg.current_balance).toFixed(2)}
                </p>
              </div>
            </Card>
          )}
        </div>

        <Card title="Transaction History">
          {isLoading ?
          <div className="p-12 sm:p-16 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-400 mt-3">
                Loading transactions...
              </p>
            </div> :

          <>
              <div className="overflow-x-auto">
                <Table data={transactions} columns={columns} keyField="id" />
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
        transType === 'CASH_IN' ? 'Add Cash (Float)' : 'Remove Cash (Drop)'
        }>

        <form onSubmit={handleTransaction} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" />

          <Input
            label="Notes / Reason"
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Morning Float, Office Supplies" />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}>

              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>);

}