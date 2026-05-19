import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authed/orders")({
  head: () => ({ meta: [{ title: "Đơn hàng — HappyMall Admin" }] }),
  component: OrdersPage,
});

const STATUSES = [
  { value: "", label: "Tất cả" },
  { value: "placed", label: "Đã đặt" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "shipping", label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "unreviewed", label: "Chờ đánh giá" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "returned", label: "Đã trả" },
] as const;

const STATUS_TONE: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  paid: "bg-indigo-100 text-indigo-700",
  shipping: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  unreviewed: "bg-purple-100 text-purple-700",
  cancelled: "bg-rose-100 text-rose-700",
  returned: "bg-gray-200 text-gray-700",
};

function OrdersPage() {
  const [status, setStatus] = useState("");
  const q = useQuery({
    queryKey: ["orders", status],
    queryFn: () => apiFetch<any[]>("/orders", { query: { status: status || undefined } }),
  });
  const list = q.data?.data ?? [];

  return (
    <div>
      <PageHeader title="Đơn hàng" subtitle={`${list.length} đơn`} />

      <div className="flex flex-wrap gap-2 mb-5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`h-9 px-4 rounded-full text-sm font-medium transition ${
              status === s.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "bg-card text-foreground border border-border hover:bg-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} emptyText="Không có đơn hàng" />
      ) : (
        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3">Mã đơn</th>
                  <th className="text-left px-6 py-3">Trạng thái</th>
                  <th className="text-left px-6 py-3">Sản phẩm</th>
                  <th className="text-right px-6 py-3">Tổng</th>
                  <th className="text-left px-6 py-3">Thanh toán</th>
                  <th className="text-left px-6 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o: any) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-6 py-3 font-mono font-semibold">{o.code ?? o.id}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${STATUS_TONE[o.status] ?? "bg-muted"}`}>
                        {STATUSES.find((s) => s.value === o.status)?.label ?? o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {(o.items?.length ?? 0)} món
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-primary">
                      {formatVnd(o.total)}
                    </td>
                    <td className="px-6 py-3">{o.payMethod ?? "—"}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}