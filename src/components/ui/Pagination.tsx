import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon } from
'lucide-react';
interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}
export function Pagination({
  currentPage,
  totalCount,
  pageSize = 20,
  onPageChange
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;
  const getVisiblePages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) {
      pages.push('...');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };
  const visiblePages = getVisiblePages();
  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="hidden sm:block text-sm text-slate-500">
        Showing page{' '}
        <span className="font-medium text-slate-700">{currentPage}</span> of{' '}
        <span className="font-medium text-slate-700">{totalPages}</span>
        <span className="ml-1 text-slate-400">({totalCount} total)</span>
      </p>

      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1 sm:p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="First page">

          <ChevronsLeftIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 sm:p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous page">

          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {visiblePages.map((page, idx) =>
        page === '...' ?
        <span
          key={`dots-${idx}`}
          className="px-1 sm:px-2 text-slate-400 text-sm">

              …
            </span> :

        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-1.5 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${page === currentPage ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>

              {page}
            </button>

        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 sm:p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next page">

          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1 sm:p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Last page">

          <ChevronsRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>);

}