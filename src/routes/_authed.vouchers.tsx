import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDateShort } from "@/lib/format";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/_authed/vouchers")({
  head: () => ({ meta: [{ title: "Voucher — HappyMall Admin" }] }),
  component: VouchersPage,
});

function VouchersPage() {
  const q = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => apiFetch<any[]>("/vouchers"),
  });
  const list = q.data?.data ?? [];

  return (
    <div>
      <PageHeader title="Voucher" subtitle={`${list.length} voucher đang hoạt động`} />

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((v: any) => (
            <div
              key={v.id ?? v.code}
              className="relative rounded-2xl shadow-[var(--shadow-card)] overflow-hidden flex bg-card"
            >
              <div className="bg-gradient-to-br from-primary to-orange-400 text-primary-foreground w-28 p-4 flex flex-col items-center justify-center text-center">
                <Ticket className="size-7 mb-1" />
                <p className="text-xs uppercase font-semibold tracking-wide opacity-90">
                  {v.type === "freeship" ? "Freeship" : "Giảm giá"}
                </p>
              </div>
              <div className="flex-1 p-4 min-w-0">
                <p className="font-mono font-bold text-base text-secondary-foreground">
                  {v.code}
                </p>
                <p className="text-sm text-foreground mt-1 line-clamp-2">
                  {v.description ?? v.title ?? "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {v.expiryDate && <span>HSD: {formatDateShort(v.expiryDate)}</span>}
                  {v.totalLimit != null && <span>Còn: {v.remaining ?? v.totalLimit}</span>}
                  {v.minOrder != null && Number(v.minOrder) > 0 && (
                    <span>Đơn từ {Number(v.minOrder).toLocaleString("vi-VN")}₫</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}