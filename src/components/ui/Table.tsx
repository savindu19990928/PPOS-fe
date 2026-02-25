import React from 'react';
interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}
export function Table<T>({
  data,
  columns,
  keyField,
  onRowClick,
  emptyMessage = 'No data available'
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col, idx) =>
            <th
              key={idx}
              className={`px-6 py-3 font-medium ${col.className || ''}`}>

                {col.header}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ?
          data.map((item) =>
          <tr
            key={String(item[keyField])}
            onClick={() => onRowClick?.(item)}
            className={`bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>

                {columns.map((col, idx) =>
            <td key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                    {typeof col.accessor === 'function' ?
              col.accessor(item) :
              item[col.accessor] as React.ReactNode}
                  </td>
            )}
              </tr>
          ) :

          <tr>
              <td
              colSpan={columns.length}
              className="px-6 py-8 text-center text-slate-500">

                {emptyMessage}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>);

}