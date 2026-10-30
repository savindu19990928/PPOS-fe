import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  highlightedIndex?: number;
  isLoading?: boolean;
}

export function Table<T>({
  data,
  columns,
  keyField,
  onRowClick,
  emptyMessage = 'No data available',
  highlightedIndex,
  isLoading = false
}: TableProps<T>) {
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (
      highlightedIndex != null &&
      highlightedIndex >= 0 &&
      highlightedRowRef.current
    ) {
      highlightedRowRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-6 py-3 font-medium ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  <span className="text-xs font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length > 0 ? (
            data.map((item, rowIndex) => {
              const isHighlighted =
                highlightedIndex != null && rowIndex === highlightedIndex;
              const rowKey = keyField
                ? String(item[keyField])
                : (item as any)?.id != null
                ? String((item as any).id)
                : String(rowIndex);

              return (
                <tr
                  key={rowKey}
                  ref={isHighlighted ? highlightedRowRef : undefined}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-slate-100 transition-colors ${
                    isHighlighted
                      ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-300'
                      : 'bg-white hover:bg-slate-50'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}>
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      className={`px-6 py-4 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}