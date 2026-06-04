import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X, Eye, Package, CreditCard, Calendar, MessageSquare } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_VALUES = [
  "",
  "placed",
  "paid",
  "shipping",
  "delivered",
  "unreviewed",
  "cancelled",
  "returned",
] as const;

const ordersSearchSchema = z.object({
  status: fallback(z.enum(STATUS_VALUES), "").default(""),
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

type OrdersSearch = {
  status: (typeof STATUS_VALUES)[number];
  q: string;
  page: number;
};

type OrderRow = {
  id: string;
  code?: string;
  payMethod?: string | null;
  note?: string | null;
  status: "placed" | "paid" | "shipping" | "delivered" | "unreviewed" | "cancelled" | "returned";
  items?: any[];
  products?: any[];
  total: number;
  createdAt: string;
};

export const Route = createFileRoute("/_authed/orders")({
  head: () => ({ meta: [{ title: "Đơn hàng Online — HappyMall Admin" }] }),
  validateSearch: zodValidator(ordersSearchSchema),
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

const STATUS_LABEL: Record<string, string> = {
  placed: "Đã đặt",
  paid: "Đã thanh toán",
  shipping: "Đang giao",
  delivered: "Đã giao",
  unreviewed: "Chờ đánh giá",
  cancelled: "Đã hủy",
  returned: "Đã trả",
};

const STATUS_TONE: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  paid: "bg-indigo-100 text-indigo-700",
  shipping: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  unreviewed: "bg-purple-100 text-purple-700",
  cancelled: "bg-rose-100 text-rose-700",
  returned: "bg-gray-200 text-gray-700",
};

const REQUEST_LIMIT = 15;
const EMPTY_ORDERS: OrderRow[] = [];

function OrdersPage() {
  const { status, q, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderRow | null>(null);

  const query = useQuery({
    queryKey: ["orders-admin", { status, page }],
    queryFn: () =>
      apiFetch<OrderRow[]>("/orders/admin/all", {
        query: {
          status: status || undefined,
          page,
          limit: REQUEST_LIMIT,
        },
      }),
  });
  const pageOrders = query.data?.data ?? EMPTY_ORDERS;
  const responsePage = Number(query.data?.meta?.page ?? page);
  const responseLimit = Number(query.data?.meta?.limit ?? REQUEST_LIMIT);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pageOrders;
    return pageOrders.filter((o) =>
      [o.code ?? o.id, o.payMethod, o.note]
        .map((v) => (v ?? "").toString().toLowerCase())
        .some((s) => s.includes(term)),
    );
  }, [pageOrders, q]);

  const total = Number(query.data?.meta?.total ?? pageOrders.length);
  const totalPages = Math.max(1, Math.ceil(total / responseLimit));
  const safePage = Math.min(responsePage, totalPages);
  const list = filtered;
  const hasFilter = status || q;

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      apiFetch(`/orders/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: (_, variables) => {
      setPendingOrderId(null);
      void queryClient.invalidateQueries({ queryKey: ["orders-admin"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      const label =
        STATUSES.find((item) => item.value === variables.nextStatus)?.label ?? variables.nextStatus;
      toast.success(`Đã cập nhật trạng thái thành ${label}`);
      
      // Update selected detail status if currently open
      if (selectedOrderDetail && selectedOrderDetail.id === variables.id) {
        setSelectedOrderDetail((prev) => prev ? { ...prev, status: variables.nextStatus as any } : null);
      }
    },
    onError: (error) => {
      setPendingOrderId(null);
      const message = error instanceof Error ? error.message : "Cập nhật trạng thái thất bại";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!query.isLoading && page > totalPages) {
      navigate({
        search: (prev: OrdersSearch) => ({ ...prev, page: totalPages }),
      });
    }
  }, [page, totalPages, query.isLoading, navigate]);

  return (
    <div>
      <PageHeader
        title="Đơn hàng Online"
        subtitle={
          q
            ? `Hiển thị ${list.length} / ${pageOrders.length} đơn online (trang ${safePage}) • Tổng ${total} đơn`
            : `Tổng ${total} đơn hàng online`
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            from={Route.fullPath}
            search={(prev: OrdersSearch) => ({ ...prev, status: s.value, page: 1 })}
            className={`h-9 px-4 rounded-full text-sm font-medium transition inline-flex items-center ${
              status === s.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "bg-card text-foreground border border-border hover:bg-muted"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) =>
              navigate({
                search: (prev: OrdersSearch) => ({
                  ...prev,
                  q: e.target.value,
                  page: 1,
                }),
              })
            }
            placeholder="Tìm theo mã đơn, phương thức, ghi chú..."
            className="pl-9 h-11 rounded-lg bg-card"
          />
        </div>
        {hasFilter && (
          <button
            onClick={() => navigate({ search: { status: "", q: "", page: 1 } })}
            className="h-11 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        )}
      </div>

      {query.isLoading || query.isError || list.length === 0 ? (
        <DataState
          loading={query.isLoading}
          error={query.error}
          empty={list.length === 0}
          emptyText="Không có đơn hàng online"
        />
      ) : (
        <>
          <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <td className="font-mono font-semibold text-sm">{o.code ?? o.id}</td>
                      <td>
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                            STATUS_TONE[o.status] ?? "bg-muted"
                          }`}
                        >
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {o.items?.length ?? o.products?.length ?? 0} món
                      </td>
                      <td className="text-right font-bold text-primary">
                        {formatVnd(o.total)}
                      </td>
                      <td>{o.payMethod ?? "—"}</td>
                      <td className="text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <select
                            value={o.status ?? ""}
                            disabled={statusMutation.isPending && pendingOrderId === o.id}
                            onChange={(event) => {
                              const nextStatus = event.target.value;
                              if (!nextStatus || nextStatus === o.status) return;
                              setPendingOrderId(o.id);
                              statusMutation.mutate({ id: o.id, nextStatus });
                            }}
                            className="h-8 min-w-[140px] rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="" disabled>
                              Chọn trạng thái
                            </option>
                            {STATUSES.filter((item) => item.value).map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                          <Button size="sm" variant="outline" onClick={() => setSelectedOrderDetail(o)}>
                            Xem
                          </Button>
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <OrdersPagination page={safePage} totalPages={totalPages} />
        </>
      )}

      {/* Online Order Detail Dialog */}
      <Dialog open={Boolean(selectedOrderDetail)} onOpenChange={(open) => !open && setSelectedOrderDetail(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {selectedOrderDetail?.code ?? selectedOrderDetail?.id}</DialogTitle>
            <DialogDescription>Giao dịch trực tuyến từ hệ thống website</DialogDescription>
          </DialogHeader>

          {selectedOrderDetail && (
            <div className="space-y-4">
              {/* Order Metadata Row */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-xl border border-border text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground font-medium">Ngày đặt hàng</p>
                    <p className="font-semibold">{formatDate(selectedOrderDetail.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground font-medium">Hình thức thanh toán</p>
                    <p className="font-semibold">{selectedOrderDetail.payMethod ?? "COD"}</p>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">Trạng thái hiện tại</p>
                  <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[selectedOrderDetail.status]}`}>
                    {STATUS_LABEL[selectedOrderDetail.status] ?? selectedOrderDetail.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="detail-status" className="text-xs font-medium">Đổi trạng thái:</Label>
                  <select
                    id="detail-status"
                    value={selectedOrderDetail.status}
                    disabled={statusMutation.isPending && pendingOrderId === selectedOrderDetail.id}
                    onChange={(event) => {
                      const nextStatus = event.target.value;
                      if (!nextStatus || nextStatus === selectedOrderDetail.status) return;
                      setPendingOrderId(selectedOrderDetail.id);
                      statusMutation.mutate({ id: selectedOrderDetail.id, nextStatus });
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {STATUSES.filter((item) => item.value).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note Section */}
              {selectedOrderDetail.note && (
                <div className="flex gap-2 p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                  <MessageSquare className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-800">Ghi chú từ khách: </span>
                    <span className="text-amber-700">{selectedOrderDetail.note}</span>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                  <Package className="size-4 text-muted-foreground" />
                  Danh sách sản phẩm
                </h4>
                <div className="rounded-xl border border-border overflow-hidden bg-muted/10">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs">Sản phẩm</TableHead>
                        <TableHead className="text-right text-xs">Đơn giá</TableHead>
                        <TableHead className="text-center text-xs">SL</TableHead>
                        <TableHead className="text-right text-xs">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((selectedOrderDetail.items || selectedOrderDetail.products || [])).map((item: any, idx: number) => (
                        <TableRow key={idx} className="text-xs hover:bg-muted/10">
                          <td className="font-medium">{item.name}</td>
                          <td className="text-right">{formatVnd(item.price)}</td>
                          <td className="text-center font-semibold">{item.quantity}</td>
                          <td className="text-right font-bold">{formatVnd(item.price * item.quantity)}</td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border mt-3 space-y-2 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tạm tính (chưa thuế):</span>
                  <span>{formatVnd(selectedOrderDetail.total - (selectedOrderDetail.vat || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Thuế GTGT (VAT):</span>
                  <span>{formatVnd(selectedOrderDetail.vat || 0)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/80 pt-2 font-semibold text-sm">
                  <span>Tổng cộng thanh toán:</span>
                  <span className="text-base font-bold text-primary">{formatVnd(selectedOrderDetail.total)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-3">
            <Button variant="outline" onClick={() => setSelectedOrderDetail(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrdersPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const window = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
      <Link
        from={Route.fullPath}
        search={(prev: OrdersSearch) => ({ ...prev, page: Math.max(1, page - 1) })}
        className="h-9 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted aria-disabled:opacity-50 aria-disabled:pointer-events-none"
        aria-disabled={page === 1}
      >
        Trước
      </Link>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            from={Route.fullPath}
            search={(prev: OrdersSearch) => ({ ...prev, page: p })}
            className={`h-9 min-w-9 px-3 rounded-lg text-sm font-medium grid place-items-center ${
              p === page
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "border border-input bg-card hover:bg-muted"
            }`}
          >
            {p}
          </Link>
        ),
      )}
      <Link
        from={Route.fullPath}
        search={(prev: OrdersSearch) => ({
          ...prev,
          page: Math.min(totalPages, page + 1),
        })}
        className="h-9 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted aria-disabled:opacity-50 aria-disabled:pointer-events-none"
        aria-disabled={page >= totalPages}
      >
        Sau
      </Link>
    </div>
  );
}
