import { Link } from "@tanstack/react-router";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  onLimitChange: (limit: 10 | 20) => void;
  fromRoute: string;
  searchKey?: string;
}

export function TablePagination({
  page,
  totalPages,
  limit,
  total,
  onLimitChange,
  fromRoute,
  searchKey = "page",
}: TablePaginationProps) {
  const pages: (number | "…")[] = [];
  const window = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="mt-0 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4 px-6 pb-4 bg-muted/10 rounded-b-2xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Hiển thị</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value) as 10 | 20)}
          className="h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
        >
          <option value={10}>10 dòng</option>
          <option value={20}>20 dòng</option>
        </select>
        <span>trong tổng số {total} dòng</span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Link
            from={fromRoute as any}
            search={(prev: any) => ({ ...prev, [searchKey]: Math.max(1, page - 1) })}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-[11px] font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50 inline-flex items-center text-muted-foreground"
            aria-disabled={page === 1}
          >
            Trước
          </Link>
          {pages.map((p, index) =>
            p === "…" ? (
              <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground text-xs">
                …
              </span>
            ) : (
              <Link
                key={p}
                from={fromRoute as any}
                search={(prev: any) => ({ ...prev, [searchKey]: p })}
                className={`grid h-8 min-w-8 place-items-center rounded-md text-[11px] font-semibold ${
                  p === page
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-input bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                {p}
              </Link>
            ),
          )}
          <Link
            from={fromRoute as any}
            search={(prev: any) => ({ ...prev, [searchKey]: Math.min(totalPages, page + 1) })}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-[11px] font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50 inline-flex items-center text-muted-foreground"
            aria-disabled={page >= totalPages}
          >
            Sau
          </Link>
        </div>
      )}
    </div>
  );
}
