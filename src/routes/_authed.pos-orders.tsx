import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, X, Plus, Trash2, ShoppingCart, Truck, User, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PosOrdersSearch = {
  search: string;
  page: number;
  limit: number;
};

const posOrdersSearchSchema = z.object({
  search: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
  limit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
});

type ProductItem = {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
};

type PosOrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type PosOrderRow = {
  id: string;
  code: string;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingProvider: string;
  items: PosOrderItem[];
  total: number;
  status: "completed" | "pending" | "cancelled";
  createdAt: string;
};

const SHIPPING_PROVIDERS = [
  "Khách tự mang về",
  "Giao Hàng Nhanh",
  "Giao Hàng Tiết Kiệm",
  "Viettel Post",
  "GrabExpress",
] as const;

export const Route = createFileRoute("/_authed/pos-orders")({
  head: () => ({ meta: [{ title: "Đơn hàng tại quầy — HappyMall Admin" }] }),
  validateSearch: zodValidator(posOrdersSearchSchema),
  component: PosOrdersPage,
});

function PosOrdersPage() {
  const { search, page, limit } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PosOrderRow | null>(null);
  const [deleting, setDeleting] = useState<PosOrderRow | null>(null);
  
  // Create / Edit Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingProvider, setShippingProvider] = useState<string>("Khách tự mang về");
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  
  // Temp item selection
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");
  const [formError, setFormError] = useState("");

  const productsQuery = useQuery({
    queryKey: ["products-pos-selection"],
    queryFn: () => apiFetch<ProductItem[]>("/products", { auth: false, query: { limit: 1000 } }),
  });
  const productsList = productsQuery.data?.data ?? [];

  const posOrders = useQuery({
    queryKey: ["pos-orders", { search, page, limit }],
    queryFn: () =>
      apiFetch<PosOrderRow[]>("/pos-orders", {
        query: { search, page, limit },
      }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: any }) =>
      apiFetch(payload.id ? `/pos-orders/${payload.id}` : "/pos-orders", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["products-pos-selection"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(editing ? "Cập nhật đơn hàng thành công" : "Tạo đơn hàng tại quầy thành công");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Thao tác thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/pos-orders/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Xóa đơn hàng thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa đơn hàng thất bại";
      toast.error(message);
    },
  });

  const list = posOrders.data?.data ?? [];
  const total = posOrders.data?.meta?.total ?? list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilter = search;

  function resetForm() {
    setEditing(null);
    setCustomerName("");
    setCustomerPhone("");
    setShippingProvider("Khách tự mang về");
    setOrderItems([]);
    setSelectedProductId("");
    setSelectedQty("1");
    setFormError("");
  }

  function openCreate() {
    resetForm();
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(order: PosOrderRow) {
    resetForm();
    setEditing(order);
    setCustomerName(order.customerName ?? "");
    setCustomerPhone(order.customerPhone ?? "");
    setShippingProvider(order.shippingProvider);
    // Map items for editing representation (though item quantities shouldn't be edited to keep stock calculations simple)
    setOrderItems(order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    setFormError("");
    setDialogOpen(true);
  }

  function addOrderItem() {
    setFormError("");
    if (!selectedProductId) {
      setFormError("Vui lòng chọn một sản phẩm");
      return;
    }
    const qty = Number(selectedQty);
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError("Số lượng phải là số nguyên lớn hơn 0");
      return;
    }

    const prod = productsList.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const availableStock = prod.stock ?? 0;
    
    // Check if product is already in the list
    const existingIdx = orderItems.findIndex((item) => item.productId === selectedProductId);
    let totalQty = qty;
    if (existingIdx !== -1) {
      totalQty += orderItems[existingIdx].quantity;
    }

    if (availableStock < totalQty) {
      setFormError(`Sản phẩm "${prod.name}" chỉ còn ${availableStock} trong kho. Không đủ đáp ứng.`);
      return;
    }

    if (existingIdx !== -1) {
      const updated = [...orderItems];
      updated[existingIdx].quantity = totalQty;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { productId: selectedProductId, quantity: qty }]);
    }

    setSelectedProductId("");
    setSelectedQty("1");
  }

  function removeOrderItem(index: number) {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  function calculateFormTotal() {
    return orderItems.reduce((sum, item) => {
      const prod = productsList.find((p) => p.id === item.productId);
      return sum + (prod?.price ?? 0) * item.quantity;
    }, 0);
  }

  function validateForm() {
    if (!editing && orderItems.length === 0) {
      return "Đơn hàng phải có ít nhất một sản phẩm";
    }
    if (customerPhone.trim() && !/^\d{9,11}$/.test(customerPhone.trim())) {
      return "Số điện thoại không hợp lệ (yêu cầu từ 9 đến 11 chữ số)";
    }
    return "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");

    const payload = editing
      ? {
          customerName: customerName.trim() || "Khách vãng lai",
          customerPhone: customerPhone.trim(),
          shippingProvider,
        }
      : {
          customerName: customerName.trim() || "Khách vãng lai",
          customerPhone: customerPhone.trim(),
          shippingProvider,
          items: orderItems,
          status: "completed",
        };

    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Đơn hàng bán tại quầy"
        subtitle={`${total} đơn bán trực tiếp`}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tạo đơn tại quầy
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) =>
              navigate({
                search: (prev: PosOrdersSearch) => ({ ...prev, search: e.target.value, page: 1 }),
              })
            }
            placeholder="Tìm theo mã đơn, tên khách hàng hoặc số điện thoại..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        {hasFilter ? (
          <button
            onClick={() => navigate({ search: { search: "", page: 1 } })}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        ) : null}
      </div>

      {posOrders.isLoading || posOrders.isError || list.length === 0 ? (
        <DataState
          loading={posOrders.isLoading}
          error={posOrders.error}
          empty={list.length === 0}
          emptyText="Không có đơn hàng tại quầy nào"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Điện thoại</TableHead>
                    <TableHead>Đơn vị vận chuyển</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-semibold">{o.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="size-3.5 text-muted-foreground" />
                          {o.customerName || "Khách vãng lai"}
                        </div>
                      </TableCell>
                      <TableCell>{o.customerPhone ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="size-3 text-muted-foreground" />
                          {o.customerPhone}
                        </div>
                      ) : "—"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-0.5 bg-secondary text-secondary-foreground">
                          <Truck className="size-3" />
                          {o.shippingProvider}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
                        {o.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatVnd(o.total)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="size-3" />
                          Đã hoàn thành
                        </span>
                      </td>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Button size="sm" variant="outline" onClick={() => openEdit(o)}>
                            Sửa
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleting(o)}>
                            Xóa
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
            page={page}
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

      {/* POS Order Creation / Editing Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Sửa đơn hàng ${editing.code}` : "Tạo đơn hàng tại quầy"}</DialogTitle>
            <DialogDescription>
              {editing ? "Cập nhật thông tin vận chuyển và khách hàng." : "Thêm các sản phẩm có sẵn trong kho để tạo đơn xuất trực tiếp."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cust-name">Tên khách hàng</Label>
                <Input
                  id="cust-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-phone">Số điện thoại</Label>
                <Input
                  id="cust-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping-prov">Đơn vị vận chuyển *</Label>
              <select
                id="shipping-prov"
                value={shippingProvider}
                onChange={(e) => setShippingProvider(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {SHIPPING_PROVIDERS.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Product selection only for new orders */}
            {!editing ? (
              <div className="space-y-3 border-t border-border pt-3">
                <h4 className="font-semibold text-sm">Chọn sản phẩm nhập đơn</h4>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="pos-prod-select">Sản phẩm</Label>
                    <select
                      id="pos-prod-select"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— Chọn sản phẩm trong kho —</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id} disabled={(p.stock ?? 0) <= 0}>
                          {p.name} (Tồn kho: {p.stock ?? 0}) — {formatVnd(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label htmlFor="pos-qty-input">Số lượng</Label>
                    <Input
                      id="pos-qty-input"
                      type="number"
                      min={1}
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={addOrderItem}>
                    Thêm
                  </Button>
                </div>

                {/* Items List */}
                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-center">Số lượng</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-xs h-16">
                            Chưa có sản phẩm nào được chọn
                          </TableCell>
                        </TableRow>
                      ) : (
                        orderItems.map((item, idx) => {
                          const prod = productsList.find((p) => p.id === item.productId);
                          if (!prod) return null;
                          return (
                            <TableRow key={item.productId} className="text-xs">
                              <td className="font-medium">{prod.name}</td>
                              <td className="text-right">{formatVnd(prod.price)}</td>
                              <td className="text-center font-bold">{item.quantity}</td>
                              <td className="text-right font-bold">{formatVnd(prod.price * item.quantity)}</td>
                              <td>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  onClick={() => removeOrderItem(idx)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </td>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              // Items preview for editing mode
              <div className="space-y-2 border-t border-border pt-3">
                <h4 className="font-semibold text-sm">Danh sách sản phẩm (không thể chỉnh sửa)</h4>
                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-center">Số lượng</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editing.items.map((item) => (
                        <TableRow key={item.productId} className="text-xs">
                          <td className="font-medium">{item.name}</td>
                          <td className="text-right">{formatVnd(item.price)}</td>
                          <td className="text-center font-bold">{item.quantity}</td>
                          <td className="text-right font-bold">{formatVnd(item.price * item.quantity)}</td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Price calculation summary */}
            <div className="bg-muted/50 p-4 rounded-xl border border-border mt-3 space-y-2 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Tạm tính (chưa thuế):</span>
                <span>
                  {formatVnd(
                    editing
                      ? editing.total - (editing.vat || 0)
                      : orderItems.reduce((sum, item) => {
                          const prod = productsList.find((p) => p.id === item.productId);
                          if (!prod) return sum;
                          const subtotal = prod.price * item.quantity;
                          const taxRate = prod.taxRate ?? 10;
                          const itemVat = Math.round((subtotal * taxRate) / (100 + taxRate));
                          return sum + (subtotal - itemVat);
                        }, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Thuế GTGT (VAT):</span>
                <span>
                  {formatVnd(
                    editing
                      ? (editing.vat || 0)
                      : orderItems.reduce((sum, item) => {
                          const prod = productsList.find((p) => p.id === item.productId);
                          if (!prod) return sum;
                          const subtotal = prod.price * item.quantity;
                          const taxRate = prod.taxRate ?? 10;
                          const itemVat = Math.round((subtotal * taxRate) / (100 + taxRate));
                          return sum + itemVat;
                        }, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/80 pt-2 font-semibold">
                <span>Tổng cộng thanh toán:</span>
                <span className="text-xl font-bold text-primary">
                  {formatVnd(editing ? editing.total : calculateFormTotal())}
                </span>
              </div>
            </div>

            {formError ? <p className="text-sm text-destructive font-medium">{formError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đơn hàng tại quầy?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng <strong>{deleting?.code}</strong>? Hành động này sẽ không hồi lại số lượng sản phẩm trong kho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending || !deleting}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
