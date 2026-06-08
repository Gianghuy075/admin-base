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
import { Search, X, Package, CreditCard, Calendar, MessageSquare, Truck, RefreshCw } from "lucide-react";
import { TablePagination } from "@/components/table-pagination";
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
  "shipping",
  "delivered",
  "cancelled",
  "returned",
] as const;

const ordersSearchSchema = z.object({
  status: fallback(z.enum(STATUS_VALUES), "").default(""),
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
  limit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
});

type OrdersSearch = {
  status: (typeof STATUS_VALUES)[number];
  q: string;
  page: number;
  limit: number;
};

type Shipment = {
  id: string;
  orderId: string;
  carrier: string;
  trackingId: string | null;
  ghtkLabel: string | null;
  ghtkStatus: string | null;
  status: "pending" | "picking" | "delivering" | "delivered" | "failed" | "returning" | "returned" | "cancelled";
  shippingFee: number | null;
  pickMoney: number | null;
  estimatedDeliverTime: string | null;
  createdAt: string;
  updatedAt: string;
};

type ShippingSummary = {
  orderId: string;
  orderStatus: string;
  shippingProvider: string;
  shippingFee: number;
  shipment: Shipment | null;
};

type OrderRow = {
  id: string;
  code?: string;
  payMethod?: string | null;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  reviewStatus?: "pending" | "reviewed";
  shippingProvider?: string | null;
  note?: string | null;
  footer?: string | null;
  status: "placed" | "shipping" | "delivered" | "cancelled" | "returned";
  items?: any[];
  products?: any[];
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  tierDiscount?: number;
  pointsUsed?: number;
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
  { value: "shipping", label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "returned", label: "Đã trả" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  placed: "Đã đặt",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  returned: "Đã trả",
};

const STATUS_TONE: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  shipping: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  returned: "bg-gray-200 text-gray-700",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ đánh giá",
  reviewed: "Đã đánh giá",
};

const GHTK_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  picking: "Đang lấy hàng",
  delivering: "Đang giao hàng",
  delivered: "Đã giao",
  failed: "Giao thất bại",
  returning: "Đang hoàn hàng",
  returned: "Đã hoàn hàng",
  cancelled: "Đã hủy",
};

const GHTK_STATUS_CODE_LABEL: Record<string, string> = {
  "-1": "Đã hủy vận đơn",
  "1": "Đã tiếp nhận, chờ lấy hàng",
  "2": "Đã tiếp nhận",
  "3": "Đã lấy hàng, đã nhập kho",
  "4": "Đang giao hàng",
  "5": "Giao hàng thành công",
  "6": "Đã đối soát",
  "7": "Không lấy được hàng",
  "8": "Delay lấy hàng",
  "9": "Giao hàng thất bại",
  "10": "Delay giao hàng / Hẹn giao lại",
  "11": "Đã đối soát hoàn",
  "12": "Đang điều phối lấy hàng",
  "13": "Đơn bồi hoàn",
  "20": "Chuyển hoàn",
  "21": "Đã hoàn hàng",
  "45": "Shipper báo giao thành công",
  "49": "Shipper báo giao thất bại",
  "123": "Shipper báo đã lấy hàng",
  "127": "Shipper báo lấy hàng thất bại",
  "128": "Shipper báo delay lấy hàng",
  "410": "Shipper báo delay giao hàng",
};

const GHTK_STATUS_CODE_GROUP: Record<string, string> = {
  "-1": "Kết thúc",
  "1": "Lấy hàng",
  "2": "Lấy hàng",
  "3": "Lấy hàng",
  "4": "Giao hàng",
  "5": "Kết thúc",
  "6": "Kết thúc",
  "7": "Lấy hàng",
  "8": "Lấy hàng",
  "9": "Giao hàng",
  "10": "Giao hàng",
  "11": "Kết thúc",
  "12": "Lấy hàng",
  "13": "Kết thúc",
  "20": "Hoàn hàng",
  "21": "Kết thúc",
  "45": "Thông tin shipper",
  "49": "Thông tin shipper",
  "123": "Thông tin shipper",
  "127": "Thông tin shipper",
  "128": "Thông tin shipper",
  "410": "Thông tin shipper",
};

const GHTK_STATUS_CODE_TONE: Record<string, string> = {
  "-1": "bg-rose-50 text-rose-600",
  "1": "bg-slate-100 text-slate-700",
  "2": "bg-slate-100 text-slate-700",
  "3": "bg-blue-100 text-blue-700",
  "4": "bg-amber-100 text-amber-700",
  "5": "bg-emerald-100 text-emerald-700",
  "6": "bg-emerald-100 text-emerald-700",
  "7": "bg-rose-100 text-rose-700",
  "8": "bg-orange-100 text-orange-700",
  "9": "bg-rose-100 text-rose-700",
  "10": "bg-orange-100 text-orange-700",
  "11": "bg-gray-200 text-gray-700",
  "12": "bg-blue-100 text-blue-700",
  "13": "bg-rose-100 text-rose-700",
  "20": "bg-orange-100 text-orange-700",
  "21": "bg-gray-200 text-gray-700",
  "45": "bg-sky-100 text-sky-700",
  "49": "bg-sky-100 text-sky-700",
  "123": "bg-sky-100 text-sky-700",
  "127": "bg-sky-100 text-sky-700",
  "128": "bg-sky-100 text-sky-700",
  "410": "bg-sky-100 text-sky-700",
};

const GHTK_STATUS_TONE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  picking: "bg-blue-100 text-blue-700",
  delivering: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  returning: "bg-orange-100 text-orange-700",
  returned: "bg-gray-200 text-gray-700",
  cancelled: "bg-rose-50 text-rose-600",
};

const SHIPPING_PROVIDER_LABEL: Record<string, string> = {
  ghtk: "Giao Hàng Tiết Kiệm",
};

const EMPTY_ORDERS: OrderRow[] = [];

function OrdersPage() {
  const { status, q, page, limit } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderRow | null>(null);

  const unwrapResponse = <T,>(response: { success: boolean; data: T; error?: string }) => {
    if (!response.success) {
      throw new Error(response.error ?? "Yêu cầu thất bại");
    }
    return response.data;
  };

  const query = useQuery({
    queryKey: ["orders-admin", { status, page, limit }],
    queryFn: () =>
      apiFetch<OrderRow[]>("/orders/admin/all", {
        query: {
          status: status || undefined,
          page,
          limit,
        },
      }),
  });
  const pageOrders = query.data?.data ?? EMPTY_ORDERS;
  const responsePage = Number(query.data?.meta?.page ?? page);
  const responseLimit = Number(query.data?.meta?.limit ?? limit);

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
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      unwrapResponse(await apiFetch(`/orders/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })),
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

  const shipmentQuery = useQuery({
    queryKey: ["shipment", selectedOrderDetail?.id],
    queryFn: () =>
      apiFetch<ShippingSummary>(`/shipping/orders/${selectedOrderDetail!.id}`),
    enabled: !!selectedOrderDetail,
  });
  const shippingSummary = shipmentQuery.data?.data ?? null;
  const shipment = shippingSummary?.shipment ?? null;

  const createShipmentMutation = useMutation({
    mutationFn: async (orderId: string) =>
      unwrapResponse(await apiFetch(`/shipping/orders/${orderId}/create`, { method: "POST" })),
    onSuccess: (_, orderId) => {
      void shipmentQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["orders-admin"] });
      if (selectedOrderDetail?.id === orderId) {
        setSelectedOrderDetail((prev) =>
          prev
            ? {
                ...prev,
                status: "shipping",
                footer: "Đã tiếp nhận, chờ lấy hàng",
              }
            : null,
        );
      }
      toast.success("Đã tạo vận đơn GHTK thành công");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Tạo vận đơn thất bại");
    },
  });

  const cancelShipmentMutation = useMutation({
    mutationFn: async (orderId: string) =>
      unwrapResponse(await apiFetch(`/shipping/orders/${orderId}/cancel`, { method: "POST" })),
    onSuccess: () => {
      void shipmentQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["orders-admin"] });
      toast.success("Đã hủy vận đơn GHTK");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Hủy vận đơn thất bại");
    },
  });

  const trackShipmentMutation = useMutation({
    mutationFn: async (orderId: string) =>
      unwrapResponse(await apiFetch(`/shipping/orders/${orderId}/track`, { method: "POST" })),
    onSuccess: () => {
      void shipmentQuery.refetch();
      toast.success("Đã cập nhật trạng thái vận đơn");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Cập nhật trạng thái thất bại");
    },
  });

  useEffect(() => {
    if (!query.isLoading && page > totalPages) {
      navigate({
        search: (prev) => ({ ...prev, page: totalPages }),
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
            search={(prev) => ({ ...prev, status: s.value, page: 1 })}
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
                search: (prev) => ({
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
                    <TableHead>ĐVVC</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-semibold text-sm">{o.code ?? o.id}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                            STATUS_TONE[o.status] ?? "bg-muted"
                          }`}
                        >
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {SHIPPING_PROVIDER_LABEL[o.shippingProvider ?? "ghtk"] ?? o.shippingProvider ?? "GHTK"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {o.items?.length ?? o.products?.length ?? 0} món
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatVnd(o.total)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium">{o.payMethod ?? "COD"}</p>
                          <p className="text-muted-foreground">
                            {PAYMENT_STATUS_LABEL[o.paymentStatus ?? "unpaid"] ?? (o.paymentStatus ?? "unpaid")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <TablePagination
            page={safePage}
            totalPages={totalPages}
            limit={limit}
            total={total}
            onLimitChange={(newLimit) =>
              navigate({
                search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }),
              })
            }
            fromRoute={Route.fullPath}
          />
        </>
      )}

      {/* Online Order Detail Dialog */}
      <Dialog open={Boolean(selectedOrderDetail)} onOpenChange={(open) => !open && setSelectedOrderDetail(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Chi tiết đơn hàng {selectedOrderDetail?.code ?? selectedOrderDetail?.id}</DialogTitle>
            <DialogDescription>Giao dịch trực tuyến từ hệ thống website</DialogDescription>
          </DialogHeader>

          {selectedOrderDetail && (
            <div className="space-y-4 overflow-y-auto px-6 py-4 max-h-[calc(90vh-132px)]">
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
                    <p className="text-muted-foreground">
                      {PAYMENT_STATUS_LABEL[selectedOrderDetail.paymentStatus ?? "unpaid"] ??
                        (selectedOrderDetail.paymentStatus ?? "unpaid")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground font-medium">Đơn vị vận chuyển</p>
                    <p className="font-semibold">
                      {SHIPPING_PROVIDER_LABEL[selectedOrderDetail.shippingProvider ?? "ghtk"] ??
                        selectedOrderDetail.shippingProvider ??
                        "GHTK"}
                    </p>
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {PAYMENT_STATUS_LABEL[selectedOrderDetail.paymentStatus ?? "unpaid"] ??
                        (selectedOrderDetail.paymentStatus ?? "unpaid")}
                    </span>
                    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {REVIEW_STATUS_LABEL[selectedOrderDetail.reviewStatus ?? "pending"] ??
                        (selectedOrderDetail.reviewStatus ?? "pending")}
                    </span>
                  </div>
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

              {/* Shipping Section */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                  <Truck className="size-4 text-muted-foreground" />
                  Vận chuyển {SHIPPING_PROVIDER_LABEL[selectedOrderDetail.shippingProvider ?? "ghtk"] ?? "GHTK"}
                </h4>
                {shipmentQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground px-1">Đang tải...</p>
                ) : shippingSummary ? (
                  <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
                      <div>
                        <span className="text-muted-foreground">Provider: </span>
                        <span className="font-semibold">
                          {SHIPPING_PROVIDER_LABEL[shippingSummary.shippingProvider] ??
                            shippingSummary.shippingProvider}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phí hiện tại: </span>
                        <span className="font-semibold text-primary">
                          {shippingSummary.shippingFee > 0 ? formatVnd(shippingSummary.shippingFee) : "Miễn phí"}
                        </span>
                      </div>
                    </div>
                    {shipment ? (
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {shipment.ghtkLabel && (
                          <p>
                            <span className="text-muted-foreground">Mã GHTK: </span>
                            <span className="font-mono font-semibold">{shipment.ghtkLabel}</span>
                          </p>
                        )}
                        {shipment.trackingId && (
                          <p>
                            <span className="text-muted-foreground">Tracking ID: </span>
                            <span className="font-mono font-semibold">{shipment.trackingId}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Trạng thái: </span>
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${GHTK_STATUS_TONE[shipment.status] ?? "bg-muted"}`}>
                            {GHTK_STATUS_LABEL[shipment.status] ?? shipment.status}
                          </span>
                        </div>
                        {shipment.ghtkStatus && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Trạng thái GHTK: </span>
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${GHTK_STATUS_CODE_TONE[shipment.ghtkStatus] ?? "bg-muted"}`}>
                              {GHTK_STATUS_CODE_LABEL[shipment.ghtkStatus] ?? `Mã ${shipment.ghtkStatus}`}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              #{shipment.ghtkStatus}
                            </span>
                          </div>
                        )}
                        {shipment.ghtkStatus && (
                          <p>
                            <span className="text-muted-foreground">Nhóm trạng thái: </span>
                            <span className="font-medium">
                              {GHTK_STATUS_CODE_GROUP[shipment.ghtkStatus] ?? "Khác"}
                            </span>
                          </p>
                        )}
                        {shipment.estimatedDeliverTime && (
                          <p>
                            <span className="text-muted-foreground">Dự kiến giao: </span>
                            <span className="font-medium">{shipment.estimatedDeliverTime}</span>
                          </p>
                        )}
                        {shipment.shippingFee != null && (
                          <p>
                            <span className="text-muted-foreground">Phí vận chuyển thực tế: </span>
                            <span className="font-semibold text-primary">{formatVnd(shipment.shippingFee)}</span>
                          </p>
                        )}
                        {shipment.ghtkLabel && (
                          <a
                            href={`https://i.ghtk.vn/${shipment.ghtkLabel}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800 inline-block"
                          >
                            Theo dõi trên GHTK ↗
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={trackShipmentMutation.isPending}
                          onClick={() => trackShipmentMutation.mutate(selectedOrderDetail.id)}
                        >
                          <RefreshCw className="size-3 mr-1" />
                          Làm mới
                        </Button>
                        {!["delivered", "returned", "cancelled"].includes(shipment.status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            disabled={cancelShipmentMutation.isPending}
                            onClick={() => cancelShipmentMutation.mutate(selectedOrderDetail.id)}
                          >
                            Hủy vận đơn
                          </Button>
                        )}
                      </div>
                    </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-2">Chưa có vận đơn được tạo cho đơn này</p>
                        {["placed", "shipping"].includes(selectedOrderDetail.status) && (
                          <Button
                            size="sm"
                            disabled={createShipmentMutation.isPending}
                            onClick={() => createShipmentMutation.mutate(selectedOrderDetail.id)}
                          >
                            <Truck className="size-3 mr-1" />
                            Tạo vận đơn GHTK
                          </Button>
                        )}
                        {selectedOrderDetail.status === "placed" && (
                          <p className="text-[11px] text-amber-700">
                            Có thể tạo vận đơn ngay từ trạng thái "Đã đặt". Sau đó đơn sẽ chuyển sang "Chờ lấy hàng".
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-2">Chưa có vận đơn GHTK</p>
                    {["placed", "shipping"].includes(selectedOrderDetail.status) && (
                      <Button
                        size="sm"
                        disabled={createShipmentMutation.isPending}
                        onClick={() => createShipmentMutation.mutate(selectedOrderDetail.id)}
                      >
                        <Truck className="size-3 mr-1" />
                        Tạo vận đơn GHTK
                      </Button>
                    )}
                    {selectedOrderDetail.status === "placed" && (
                      <p className="text-[11px] text-amber-700">
                        Đơn đang ở trạng thái "Đã đặt". Admin có thể tạo vận đơn GHTK ngay, rồi đổi sang "Đang giao" khi cần.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                  <Package className="size-4 text-muted-foreground" />
                  Danh sách sản phẩm
                </h4>
                <div className="rounded-xl border border-border overflow-hidden bg-muted/10">
                  <Table className="table-fixed">
                    <colgroup>
                      <col className="w-auto" />
                      <col className="w-28" />
                      <col className="w-16" />
                      <col className="w-28" />
                    </colgroup>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="px-3 text-xs">Sản phẩm</TableHead>
                        <TableHead className="px-3 text-right text-xs">Đơn giá</TableHead>
                        <TableHead className="px-3 text-center text-xs">SL</TableHead>
                        <TableHead className="px-3 text-right text-xs">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((selectedOrderDetail.items || selectedOrderDetail.products || [])).map((item: any, idx: number) => (
                        <TableRow key={idx} className="text-xs hover:bg-muted/10">
                          <TableCell className="px-3 py-2.5 align-top">
                            <div className="pr-3 font-medium leading-5 break-words">
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-right font-medium whitespace-nowrap align-top">
                            {formatVnd(item.price)}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-center font-semibold whitespace-nowrap align-top">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-right font-bold whitespace-nowrap align-top">
                            {formatVnd(item.price * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border mt-3 space-y-2 text-xs">
                {selectedOrderDetail.subtotal != null && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Tiền hàng:</span>
                    <span>{formatVnd(selectedOrderDetail.subtotal)}</span>
                  </div>
                )}
                {(selectedOrderDetail.shippingFee ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Phí vận chuyển:</span>
                    <span>{formatVnd(selectedOrderDetail.shippingFee ?? 0)}</span>
                  </div>
                )}
                {((selectedOrderDetail.discount ?? 0) + (selectedOrderDetail.tierDiscount ?? 0)) > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Giảm giá:</span>
                    <span>-{formatVnd((selectedOrderDetail.discount ?? 0) + (selectedOrderDetail.tierDiscount ?? 0))}</span>
                  </div>
                )}
                {(selectedOrderDetail.pointsUsed ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Điểm đổi thưởng:</span>
                    <span>-{formatVnd(selectedOrderDetail.pointsUsed ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-border/80 pt-2 font-semibold text-sm">
                  <span>Tổng cộng thanh toán:</span>
                  <span className="text-base font-bold text-primary">{formatVnd(selectedOrderDetail.total)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border px-6 py-3">
            <Button variant="outline" onClick={() => setSelectedOrderDetail(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Removed duplicate local pagination
