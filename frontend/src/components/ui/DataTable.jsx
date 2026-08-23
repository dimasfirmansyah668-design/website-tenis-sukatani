import { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * DataTable — komponen tabel global dengan pagination.
 *
 * Mode client (default): kirim data utuh, slicing dilakukan internal.
 *   <DataTable columns={cols} data={rows} rowKey={(r) => r.id} />
 *
 * Mode server (controlled): kirim page/pageSize/total + callback,
 * fetching dilakukan di halaman.
 *   <DataTable columns={cols} data={rows} page={page} pageSize={limit}
 *              total={total} onPageChange={setPage} onPageSizeChange={setLimit} />
 */
export default function DataTable({
  columns,
  data = [],
  rowKey = (row, i) => row?.id ?? i,
  loading = false,
  emptyText = 'Belum ada data.',
  footer,
  page: controlledPage,
  pageSize: controlledPageSize,
  total: controlledTotal,
  onPageChange,
  onPageSizeChange,
}) {
  const isServer =
    typeof controlledPage === 'number' &&
    typeof controlledPageSize === 'number' &&
    typeof controlledTotal === 'number';

  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const pageSize = isServer ? controlledPageSize : localPageSize;
  const total = isServer ? controlledTotal : data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = isServer ? controlledPage : Math.min(localPage, totalPages);

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);
  const rows = isServer ? data : data.slice((page - 1) * pageSize, page * pageSize);

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (isServer) onPageChange?.(clamped);
    else setLocalPage(clamped);
  };

  const changeSize = (size) => {
    if (isServer) onPageSizeChange?.(Number(size));
    else {
      setLocalPageSize(Number(size));
      setLocalPage(1);
    }
  };

  /* Nomor halaman + ellipsis: 1 … 4 5 6 … 12 */
  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items = [1];
    const around = [page - 1, page, page + 1].filter((p) => p > 1 && p < totalPages);
    if (around[0] > 2) items.push('…');
    items.push(...around);
    if (around[around.length - 1] < totalPages - 1) items.push('…');
    items.push(totalPages);
    return items;
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-center text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-6 py-[18px]! text-xs font-semibold uppercase tracking-wider text-slate-500 ${col.thClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600" />
                    Memuat data...
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  <span className="flex flex-col items-center gap-2">
                    <Inbox size={28} className="text-slate-300" />
                    {emptyText}
                  </span>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-primary-50/40"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-5! align-middle ${col.className || ''}`}>
                      {col.render ? col.render(row, (page - 1) * pageSize + i) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {!loading && rows.length > 0 && footer && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">{footer}</tfoot>
          )}
        </table>
      </div>

      {/* Footer pagination */}
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-5! sm:flex-row sm:items-center sm:justify-between">
        <p className="whitespace-nowrap text-xs text-slate-500">
          Menampilkan <span className="font-semibold text-slate-700">{startIdx}&ndash;{endIdx}</span> dari{' '}
          <span className="font-semibold text-slate-700">{total}</span> data
        </p>

        <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
          <label className="flex items-center gap-1.5 text-xs whitespace-nowrap text-slate-500">
            Baris
            <select
              value={pageSize}
              onChange={(e) => changeSize(e.target.value)}
              className="max-w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          {/* Pagination SELALU ditampilkan — saat cuma satu halaman / di
              ujung rentang, tombol prev/next otomatis disabled (redup +
              cursor-not-allowed), bukan dihilangkan dari layar. */}
          <nav className="flex items-center gap-1" aria-label="Pagination">
            <PageBtn disabled={page <= 1} onClick={() => goToPage(page - 1)} label="Sebelumnya">
              <ChevronLeft size={15} />
            </PageBtn>
            {getPageItems().map((item, i) =>
              item === '…' ? (
                <span key={`e${i}`} className="px-1.5 text-xs text-slate-400">&hellip;</span>
              ) : (
                <PageBtn key={item} active={item === page} onClick={() => goToPage(item)}>
                  {item}
                </PageBtn>
              )
            )}
            <PageBtn disabled={page >= totalPages} onClick={() => goToPage(page + 1)} label="Berikutnya">
              <ChevronRight size={15} />
            </PageBtn>
          </nav>
        </div>
      </div>
    </div>
  );
}

function PageBtn({ children, active = false, disabled = false, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-medium transition',
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'border border-slate-300 bg-white text-slate-600 hover:border-primary-400 hover:text-primary-600',
        disabled ? 'cursor-not-allowed opacity-40 hover:border-slate-300 hover:text-slate-600' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
