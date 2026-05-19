interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function DataState({
  loading,
  error,
  empty,
  emptyText = "Chưa có dữ liệu",
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyText?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-10 text-center text-sm text-muted-foreground">
        Đang tải...
      </div>
    );
  }
  if (error) {
    const msg = error instanceof Error ? error.message : "Có lỗi xảy ra";
    return (
      <div className="rounded-2xl bg-destructive/10 text-destructive p-6 text-sm">
        {msg}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return null;
}