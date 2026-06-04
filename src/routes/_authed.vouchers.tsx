import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type VoucherItem = {
  id: string;
  code?: string | null;
  type: "discount" | "ship";
  title?: string | null;
  description?: string | null;
  value: number;
  valueType?: "fixed" | "percent";
  minOrder?: number | null;
  expiryDate?: string | null;
  totalLimit?: number | null;
  remaining?: number | null;
  usedCount?: number | null;
  isActive?: boolean | null;
};

type VoucherFormState = {
  id: string;
  type: "discount" | "ship";
  title: string;
  description: string;
  value: string;
  valueType: "fixed" | "percent";
  minOrder: string;
  expiryDate: string;
  totalLimit: string;
  isActive: boolean;
};

const defaultForm: VoucherFormState = {
  id: "",
  type: "discount",
  title: "",
  description: "",
  value: "",
  valueType: "fixed",
  minOrder: "0",
  expiryDate: "",
  totalLimit: "",
  isActive: true,
};

export const Route = createFileRoute("/_authed/vouchers")({
  head: () => ({ meta: [{ title: "Voucher — HappyMall Admin" }] }),
  component: VouchersPage,
});

function VouchersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VoucherItem | null>(null);
  const [deleting, setDeleting] = useState<VoucherItem | null>(null);
  const [form, setForm] = useState<VoucherFormState>(defaultForm);
  const [formError, setFormError] = useState("");

  const q = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => apiFetch<VoucherItem[]>("/vouchers"),
  });
  const list = q.data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/vouchers/admin/${payload.id}` : "/vouchers/admin", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success(editing ? "Cập nhật voucher thành công" : "Tạo voucher thành công");
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu voucher thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: { id: string; isActive: boolean }) =>
      apiFetch(`/vouchers/admin/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: payload.isActive }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Cập nhật trạng thái thành công");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Cập nhật trạng thái thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/vouchers/admin/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Xóa voucher thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa voucher thất bại";
      toast.error(message);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(voucher: VoucherItem) {
    setEditing(voucher);
    setForm({
      id: voucher.id ?? voucher.code ?? "",
      type: voucher.type ?? "discount",
      title: voucher.title ?? "",
      description: voucher.description ?? "",
      value: String(voucher.value ?? 0),
      valueType: voucher.valueType ?? "fixed",
      minOrder: String(voucher.minOrder ?? 0),
      expiryDate: voucher.expiryDate ? String(voucher.expiryDate).slice(0, 10) : "",
      totalLimit: voucher.totalLimit == null ? "" : String(voucher.totalLimit),
      isActive: voucher.isActive ?? true,
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.id.trim()) return "Mã voucher là bắt buộc";
    if (!form.title.trim()) return "Tiêu đề voucher là bắt buộc";
    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) return "Giá trị voucher phải lớn hơn 0";
    const minOrder = Number(form.minOrder || 0);
    if (!Number.isFinite(minOrder) || minOrder < 0) return "Đơn tối thiểu không hợp lệ";
    if (form.totalLimit.trim()) {
      const totalLimit = Number(form.totalLimit);
      if (!Number.isInteger(totalLimit) || totalLimit < 0)
        return "Giới hạn lượt phải là số nguyên không âm";
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
    const payload: Record<string, unknown> = {
      id: form.id.trim(),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      value: Number(form.value),
      valueType: form.valueType,
      minOrder: Number(form.minOrder || 0),
      expiryDate: form.expiryDate || undefined,
      totalLimit: form.totalLimit.trim() ? Number(form.totalLimit) : undefined,
      isActive: form.isActive,
    };
    setFormError("");
    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Voucher"
        subtitle={`${list.length} voucher đang hoạt động`}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tạo voucher
          </Button>
        }
      />

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} />
      ) : (
        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã voucher</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Tiêu đề & Mô tả</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                  <TableHead className="text-right">Đơn tối thiểu</TableHead>
                  <TableHead className="text-center">Lượt dùng</TableHead>
                  <TableHead>Hạn dùng</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((v) => {
                  const limitStr = v.totalLimit == null ? "Không giới hạn" : `${v.usedCount ?? 0}/${v.totalLimit}`;
                  const valueStr = v.valueType === "percent" ? `${v.value}%` : `${v.value.toLocaleString("vi-VN")}₫`;

                  return (
                    <TableRow key={v.id ?? v.code} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-bold text-secondary-foreground">{v.id ?? v.code}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            v.type === "ship" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          <Ticket className="size-3" />
                          {v.type === "ship" ? "Freeship" : "Giảm giá"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{v.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{v.description || "—"}</p>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{valueStr}</TableCell>
                      <TableCell className="text-right">
                        {v.minOrder && v.minOrder > 0 ? `${v.minOrder.toLocaleString("vi-VN")}₫` : "0₫"}
                      </TableCell>
                      <TableCell className="text-center text-xs">{limitStr}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {v.expiryDate ? formatDateShort(v.expiryDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={Boolean(v.isActive)}
                              onCheckedChange={(checked) =>
                                toggleMutation.mutate({ id: v.id, isActive: checked })
                              }
                            />
                            <span className="text-xs text-muted-foreground w-8">
                              {v.isActive ? "Bật" : "Tắt"}
                            </span>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                            Sửa
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleting(v)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật voucher" : "Tạo voucher mới"}</DialogTitle>
            <DialogDescription>Cập nhật thông tin voucher và lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-id">Mã voucher *</Label>
                <Input
                  id="voucher-id"
                  value={form.id}
                  disabled={Boolean(editing)}
                  onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-type">Loại *</Label>
                <select
                  id="voucher-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as VoucherFormState["type"],
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="discount">Giảm giá</option>
                  <option value="ship">Freeship</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-title">Tiêu đề *</Label>
              <Input
                id="voucher-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-description">Mô tả</Label>
              <Input
                id="voucher-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-value">Giá trị *</Label>
                <Input
                  id="voucher-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-value-type">Kiểu giá trị</Label>
                <select
                  id="voucher-value-type"
                  value={form.valueType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      valueType: e.target.value as VoucherFormState["valueType"],
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="fixed">Số tiền cố định</option>
                  <option value="percent">Phần trăm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-min-order">Đơn tối thiểu</Label>
                <Input
                  id="voucher-min-order"
                  type="number"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, minOrder: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-total-limit">Giới hạn sử dụng <span className="text-xs text-muted-foreground font-normal">(để trống = không giới hạn)</span></Label>
                <Input
                  id="voucher-total-limit"
                  type="number"
                  min={0}
                  value={form.totalLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalLimit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-expiry">Ngày hết hạn</Label>
                <Input
                  id="voucher-expiry"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm">
                  <span>Kích hoạt</span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

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
            <AlertDialogTitle>Xóa voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa voucher <strong>{deleting?.id ?? deleting?.code}</strong>? Hành động này không thể hoàn tác.
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
