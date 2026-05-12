
import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
  ExpandedState,
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  enableExport?: boolean;
  onSearchChange?: (value: string) => void;
  renderSubComponent?: (props: { row: any }) => React.ReactElement;
  extraToolbarActions?: React.ReactNode;
  getRowClassName?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "بحث...",
  enableExport = true,
  onSearchChange,
  renderSubComponent,
  extraToolbarActions,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Sync search input with parent to allow relaxed filtering
  useEffect(() => {
    if (onSearchChange) onSearchChange(globalFilter);
  }, [globalFilter, onSearchChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => !!renderSubComponent,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      expanded,
    },
  });

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map(row => {
        const original: any = row.original;
        const exportRow: any = {};
        
        table.getAllColumns().forEach(col => {
            if (col.id === 'actions') return;
            let val = original[col.id];
            if (col.id === 'bayanNumber') val = original.permitNumber ? `${original.bayanNumber} (تصريح: ${original.permitNumber})` : original.bayanNumber;
            if (col.id === 'arrivalDate') val = original.arrivalDate;
            if (col.id === 'importer') val = original.importer;
            if (!val && col.id === 'itemDescription' && original.items && original.items.length > 0) {
                val = original.items[0].description;
            }
            if (!val && col.id === 'weight' && original.totalWeight) {
                val = original.totalWeight;
            }
            exportRow[col.columnDef.header as string || col.id] = val;
        });
        return exportRow;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "Exported_Data.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-10 pl-10 text-xs font-bold outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
          <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full md:w-auto">
            {extraToolbarActions}
            <div className="relative">
                <button
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <i className="fas fa-columns"></i> الأعمدة
                </button>
                
                {showColumnMenu && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 max-h-60 overflow-y-auto custom-scrollbar animate-scale-in">
                        <div className="text-[10px] font-black text-slate-400 px-2 py-1 uppercase tracking-wider mb-1">إظهار / إخفاء</div>
                        {table.getAllLeafColumns().map(column => {
                            return (
                                <label key={column.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={column.getIsVisible()}
                                        onChange={column.getToggleVisibilityHandler()}
                                        className="w-4 h-4 accent-slate-800 rounded"
                                    />
                                    <span className="text-xs font-bold text-slate-700">{column.columnDef.header as string}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {enableExport && (
                <button
                    onClick={handleExport}
                    className="bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-xl text-xs font-bold hover:bg-green-100 transition-all flex items-center gap-2"
                >
                    <i className="fas fa-file-excel"></i> تصدير
                </button>
            )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 cursor-pointer select-none ${header.column.getCanSort() ? 'hover:text-slate-800' : ''}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <i className="fas fa-sort-up"></i>,
                            desc: <i className="fas fa-sort-down"></i>,
                          }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <i className="fas fa-sort text-slate-300"></i> : null)}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <React.Fragment key={row.id}>
                    <tr className={`hover:bg-slate-50/50 transition-colors group ${getRowClassName ? getRowClassName(row.original) : ''}`}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-4 text-xs font-bold text-slate-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && renderSubComponent && (
                      <tr>
                        <td colSpan={row.getVisibleCells().length} className="p-0 border-b border-slate-100 bg-slate-50/30">
                          {renderSubComponent({ row })}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-slate-400">
                    <i className="fas fa-search text-3xl mb-3 opacity-50"></i>
                    <p className="font-bold">لا توجد بيانات مطابقة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <div className="text-[10px] font-bold text-slate-500">
                    صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()} ({table.getFilteredRowModel().rows.length} سجل)
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 transition-all text-slate-600"
                    >
                        <i className="fas fa-chevron-right text-[10px]"></i>
                    </button>
                    {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                        let pageNum = i; 
                        if (table.getPageCount() > 5) {
                            if (table.getState().pagination.pageIndex > 2) {
                                pageNum = table.getState().pagination.pageIndex - 2 + i;
                            }
                            if (pageNum >= table.getPageCount()) return null;
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => table.setPageIndex(pageNum)}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all ${
                                    table.getState().pagination.pageIndex === pageNum
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {pageNum + 1}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 transition-all text-slate-600"
                    >
                        <i className="fas fa-chevron-left text-[10px]"></i>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
