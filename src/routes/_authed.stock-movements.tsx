import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X, Plus, ClipboardList, Package, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatVnd } from "@/lib/format";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { TablePagination } from "@/components/table-pagination";

type StockMovement = {
  id: string;
  code: string;
  type: "in" | "out";
  createdAt: string;
  createdBy: string;
  details?: string | null;
  price?: number;
  totalValue?: number;
};

type ProductItem = {
  id: string;
  name: string;
  stock?: number | null;
  price: number;
  importPrice?: number;
};

type MovementFormState = {
  code: string;
  createdBy: string;
  productId: string;
  quantity: string;
  price: string;
};

const defaultForm: MovementFormState = {
  code: "",
  createdBy: "",
  productId: "",
  quantity: "1",
  price: "",
};

const stockMovementsSearchSchema = z.object({
  page: fallback(z.number().int().min(1), 1).default(1),
  limit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
  search: fallback(z.string(), "").default(""),
  typeFilter: fallback(z.enum(["all", "in", "out"]), "all").default("all"),
});

export const Route = createFileRoute("/_authed/stock-movements")({
  head: () => ({ meta: [{ title: "Xuất nhập kho — HappyMall Admin" }] }),
  validateSearch: zodValidator(stockMovementsSearchSchema),
  component: StockMovementsPage,
});

const TYPE_LABEL: Record<StockMovement["type"], string> = {
  in: "Nhập kho",
  out: "Xuất kho",
};

function StockMovementsPage() {
  const queryClient = useQueryClient();
  const { page, limit, search, typeFilter } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingType, setPendingType] = useState<StockMovement["type"] | null>(null);
  const [form, setForm] = useState<MovementFormState>(defaultForm);
  const [formError, setFormError] = useState("");

  const movementsQuery = useQuery({
    queryKey: ["stock-movements"],
    queryFn: () => apiFetch<StockMovement[]>("/stock-movements"),
  });
  const movementsList = movementsQuery.data?.data ?? [];

  const productsQuery = useQuery({
    queryKey: ["products-for-stock"],
    queryFn: () => apiFetch<ProductItem[]>("/products", { auth: false, query: { limit: 1000 } }),
  });
  const productsList = productsQuery.data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (body: any) =>
      apiFetch("/stock-movements", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["products-for-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products-inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(pendingType === "in" ? "Nhập sản phẩm kho thành công" : "Xuất kho sản phẩm thành công");
      setDialogOpen(false);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Thao tác kho thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    // Sort movements by date descending
    const sorted = [...movementsList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return sorted.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (!term) return true;
      return (
        m.code.toLowerCase().includes(term) ||
        m.createdBy.toLowerCase().includes(term) ||
        (m.details ?? "").toLowerCase().includes(term)
      );
    });
  }, [search, typeFilter, movementsList]);

  const hasFilter = search.trim() || typeFilter !== "all";
  const dialogTitle = pendingType ? `Tạo phiếu ${TYPE_LABEL[pendingType].toLowerCase()}` : "Tạo phiếu";
  const dialogDescription = pendingType
    ? `Điền thông tin và chọn sản phẩm để thực hiện phiếu ${TYPE_LABEL[pendingType].toLowerCase()}.`
    : "Điền thông tin phiếu kho.";

  function openCreate(type: StockMovement["type"]) {
    setPendingType(type);
    
    // Auto-generate code
    const prefix = type === "in" ? "NK" : "XK";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generatedCode = `${prefix}-${dateStr}-${randomNum}`;

    setForm({
      code: generatedCode,
      createdBy: "Quản trị viên",
      productId: "",
      quantity: "1",
      price: "",
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!pendingType) return "Vui lòng chọn loại đơn";
    if (!form.code.trim()) return "Mã đơn là bắt buộc";
    if (!form.createdBy.trim()) return "Người tạo lệnh là bắt buộc";
    if (!form.productId) return "Vui lòng chọn một sản phẩm";
    
    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty <= 0) return "Số lượng phải là số nguyên duy nhất lớn hơn 0";

    if (pendingType === "out") {
      const prod = productsList.find((p) => p.id === form.productId);
      if (prod && (prod.stock ?? 0) < qty) {
        return `Số lượng xuất kho (${qty}) vượt quá số lượng tồn hiện có của sản phẩm "${prod.name}" (Còn: ${prod.stock ?? 0})`;
      }
    }
    if (form.price.trim()) {
      const pr = Number(form.price);
      if (!Number.isFinite(pr) || pr < 0) return "Đơn giá giao dịch phải là số không âm";
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

    saveMutation.mutate({
      code: form.code.trim(),
      type: pendingType!,
      createdBy: form.createdBy.trim(),
      productId: form.productId,
      quantity: Number(form.quantity),
      price: form.price.trim() ? Number(form.price) : undefined,
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedList = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div>
      <PageHeader
        title="Xuất nhập kho"
        subtitle="Quản lý và ghi nhận lịch sử xuất, nhập kho sản phẩm"
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => openCreate("in")} className="bg-emerald-600 hover:bg-emerald-700">
              Nhập kho (Restock)
            </Button>
            <Button type="button" variant="outline" onClick={() => openCreate("out")} className="border-rose-300 text-rose-700 hover:bg-rose-50">
              Xuất kho
            </Button>
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-4 flex items-center gap-3 border border-border/55">
          <div className="size-10 rounded-lg grid place-items-center bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Tổng số giao dịch</p>
            <p className="text-lg font-bold">{movementsList.length} lượt</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-4 flex items-center gap-3 border border-border/55">
          <div className="size-10 rounded-lg grid place-items-center bg-emerald-100 text-emerald-700">
            <ArrowDownLeft className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Tổng giá trị nhập kho</p>
            <p className="text-lg font-bold">
              {formatVnd(movementsList.filter((m) => m.type === "in").reduce((sum, m) => sum + (m.totalValue ?? 0), 0))}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-4 flex items-center gap-3 border border-border/55">
          <div className="size-10 rounded-lg grid place-items-center bg-rose-100 text-rose-700">
            <ArrowUpRight className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Tổng giá trị xuất kho</p>
            <p className="text-lg font-bold">
              {formatVnd(movementsList.filter((m) => m.type === "out").reduce((sum, m) => sum + (m.totalValue ?? 0), 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) =>
              navigate({
                search: (prev: any) => ({ ...prev, search: event.target.value, page: 1 }),
              })
            }
            placeholder="Tìm theo mã đơn, người tạo hoặc tên sản phẩm..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) =>
            navigate({
              search: (prev: any) => ({ ...prev, typeFilter: event.target.value as any, page: 1 }),
            })
          }
          className="h-11 min-w-[200px] rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="all">Tất cả loại giao dịch</option>
          <option value="in">Nhập kho (In)</option>
          <option value="out">Xuất kho (Out)</option>
        </select>
        {hasFilter ? (
          <button
            onClick={() => {
              navigate({
                search: { search: "", typeFilter: "all", page: 1 },
              });
            }}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        ) : null}
      </div>

      {movementsQuery.isLoading || movementsQuery.isError || filtered.length === 0 ? (
        <DataState
          loading={movementsQuery.isLoading}
          error={movementsQuery.error}
          empty={filtered.length === 0}
          emptyText="Chưa ghi nhận lịch sử xuất nhập kho nào khớp bộ lọc"
        />
      ) : (
        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn xuất-nhập</TableHead>
                  <TableHead>Loại giao dịch</TableHead>
                  <TableHead>Sản phẩm & Chi tiết</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Tổng giá trị</TableHead>
                  <TableHead>Người tạo lệnh</TableHead>
                  <TableHead className="text-right">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((movement) => {
                  const isEntry = movement.type === "in";
                  const typeBadge = isEntry ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                      <ArrowDownLeft className="size-3" /> Nhập kho
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700">
                      <ArrowUpRight className="size-3" /> Xuất kho
                    </span>
                  );

                  return (
                    <TableRow key={movement.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-semibold text-xs">{movement.code}</TableCell>
                      <TableCell>{typeBadge}</TableCell>
                      <TableCell className="font-medium text-foreground text-sm">
                        <div className="flex items-center gap-1.5">
                          <Package className="size-3.5 text-muted-foreground shrink-0" />
                          {movement.details || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-medium">
                        {movement.price ? formatVnd(movement.price) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {movement.totalValue ? formatVnd(movement.totalValue) : "—"}
                      </TableCell>
                      <TableCell>{movement.createdBy}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">{formatDate(movement.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
        </div>
      )}

      {/* Manualrestock/export dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setForm(defaultForm);
            setFormError("");
            setPendingType(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="movement-code">Mã đơn xuất-nhập *</Label>
              <Input id="movement-code" value={form.code} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-prod-select">Sản phẩm *</Label>
              <select
                id="movement-prod-select"
                value={form.productId}
                onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— Chọn sản phẩm kho —</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Hiện tại: {p.stock ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="movement-qty">Số lượng *</Label>
                <Input
                  id="movement-qty"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="movement-price">Đơn giá (Để trống = tự động)</Label>
                <Input
                  id="movement-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="Đồng/đơn vị"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-creator">Người tạo lệnh *</Label>
              <Input
                id="movement-creator"
                value={form.createdBy}
                onChange={(e) => setForm((prev) => ({ ...prev, createdBy: e.target.value }))}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>

            {formError ? <p className="text-sm text-destructive font-medium">{formError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu..." : "Xác nhận"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
