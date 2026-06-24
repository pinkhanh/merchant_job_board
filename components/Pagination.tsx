'use client';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, itemLabel, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const shownCount = total === 0 ? 0 : Math.min(pageSize, total - (page - 1) * pageSize);

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-text-secondary">
        Hiển thị {shownCount} trên {total} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Trang trước"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
              p === page ? 'bg-primary text-white font-semibold' : 'border border-border text-text-secondary'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Trang sau"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}
