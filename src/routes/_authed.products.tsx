import { useState, useRef, lazy, Suspense } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

const RichTextEditor = lazy(() =>
  import("@/components/rich-text-editor").then((m) => ({ default: m.RichTextEditor })),
);
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, Package, X, Plus, ImageIcon, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { PageHeader, DataState } from "@/components/page-header";
import { TablePagination } from "@/components/table-pagination";
import { formatVnd } from "@/lib/format";
import { Input } from "@/components/ui/input";
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

type ProductsSearch = {
  search: string;
  categoryId: string;
  page: number;
};

type CategoryItem = {
  id: string;
  name: string;
};

type ProductItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number | null;
  oldPrice?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  categoryId?: string | null;
  importPrice?: number;
  taxRate?: number;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  oldPrice: string;
  imageUrls: string[];
  categoryId: string;
  importPrice: string;
  taxRate: string;
};

type PendingFile = { file: File; preview: string };

const productsSearchSchema = z.object({
  search: fallback(z.string(), "").default(""),
  categoryId: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
  limit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
});

const defaultForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  oldPrice: "",
  imageUrls: [],
  categoryId: "",
  importPrice: "",
  taxRate: "10",
};

export const Route = createFileRoute("/_authed/products")({
  head: () => ({ meta: [{ title: "Sản phẩm — HappyMall Admin" }] }),
  validateSearch: zodValidator(productsSearchSchema),
  component: ProductsPage,
});

function ProductsPage() {
  const { search, categoryId, page, limit } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<ProductFormState>(defaultForm);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<ProductItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<CategoryItem[]>("/categories", { auth: false }),
  });

  const products = useQuery({
    queryKey: ["products", { search, categoryId, page, limit }],
    queryFn: () =>
      apiFetch<ProductItem[]>("/products", {
        auth: false,
        query: { search, categoryId: categoryId || undefined, page, limit, showAll: true },
      }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/products/${payload.id}` : "/products", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editing ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công");
      setPendingFiles((prev) => { prev.forEach((pf) => URL.revokeObjectURL(pf.preview)); return []; });
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setNewImageUrl("");
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu sản phẩm thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Xóa sản phẩm thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa sản phẩm thất bại";
      toast.error(message);
    },
  });

  const list = products.data?.data ?? [];
  const total = products.data?.meta?.total ?? list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilter = search || categoryId;
  const isFetching = products.isFetching && !products.isLoading;

  function openCreate() {
    setPendingFiles((prev) => { prev.forEach((pf) => URL.revokeObjectURL(pf.preview)); return []; });
    setEditing(null);
    setForm(defaultForm);
    setNewImageUrl("");
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(product: ProductItem) {
    setEditing(product);
    const fallbackImages = product.imageUrl ? [product.imageUrl] : [];
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
      imageUrls: product.images?.length ? product.images : fallbackImages,
      categoryId: product.categoryId ?? "",
      importPrice: String(product.importPrice ?? ""),
      taxRate: String(product.taxRate ?? "10"),
    });
    setPendingFiles((prev) => { prev.forEach((pf) => URL.revokeObjectURL(pf.preview)); return []; });
    setNewImageUrl("");
    setFormError("");
    setDialogOpen(true);

    // Fetch full detail to get description (html) + complete images array
    apiFetch<ProductItem & { images?: string[] }>(`/products/${product.id}`)
      .then((res) => {
        const p = res.data;
        const imgs = p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : fallbackImages;
        setForm((prev) => ({ ...prev, description: p.description ?? prev.description, imageUrls: imgs }));
      })
      .catch(() => {});
  }

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;
    setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
    setNewImageUrl("");
  }

  function removeImage(index: number) {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    const newPending = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPendingFiles((prev) => [...prev, ...newPending]);
  }

  function removePending(index: number) {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function validateForm() {
    if (!form.name.trim()) return "Tên sản phẩm là bắt buộc";
    if (!form.description.trim()) return "Mô tả sản phẩm là bắt buộc";
    if (!form.price.trim()) return "Giá sản phẩm là bắt buộc";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return "Giá sản phẩm phải lớn hơn 0";
    if (!form.stock.trim()) return "Số lượng tồn kho là bắt buộc";
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) return "Tồn kho phải là số nguyên không âm";
    if (form.oldPrice.trim()) {
      const oldPrice = Number(form.oldPrice);
      if (!Number.isFinite(oldPrice) || oldPrice < 0) return "Giá cũ không hợp lệ";
    }
    if (form.importPrice.trim()) {
      const importPrice = Number(form.importPrice);
      if (!Number.isFinite(importPrice) || importPrice < 0) return "Giá nhập kho không hợp lệ";
    }
    if (form.taxRate.trim()) {
      const taxRate = Number(form.taxRate);
      if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) return "Thuế suất VAT phải từ 0% đến 100%";
    }
    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) { setFormError(error); return; }
    setFormError("");

    let allUrls = form.imageUrls.filter((u) => u.trim());

    if (pendingFiles.length > 0) {
      setUploading(true);
      const results = await Promise.allSettled(pendingFiles.map((pf) => uploadToCloudinary(pf.file)));
      setUploading(false);
      let failed = 0;
      for (const r of results) {
        if (r.status === "fulfilled") allUrls.push(r.value);
        else failed++;
      }
      if (failed > 0) {
        toast.error(`${failed} ảnh tải lên thất bại`);
        return;
      }
    }

    saveMutation.mutate({
      id: editing?.id,
      body: {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        oldPrice: form.oldPrice.trim() ? Number(form.oldPrice) : undefined,
        imageUrls: allUrls,
        categoryId: form.categoryId || undefined,
        importPrice: form.importPrice.trim() ? Number(form.importPrice) : undefined,
        taxRate: form.taxRate.trim() ? Number(form.taxRate) : undefined,
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Sản phẩm"
        subtitle={`${total} sản phẩm đang hoạt động`}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) =>
              navigate({
                search: (prev: ProductsSearch) => ({ ...prev, search: e.target.value, page: 1 }),
              })
            }
            placeholder="Tìm theo tên sản phẩm..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) =>
            navigate({
              search: (prev: ProductsSearch) => ({ ...prev, categoryId: e.target.value, page: 1 }),
            })
          }
          className="h-11 min-w-[180px] rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {(categories.data?.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {hasFilter ? (
          <button
            onClick={() => navigate({ search: { search: "", categoryId: "", page: 1 } })}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        ) : null}
      </div>

      {products.isLoading || products.isError || list.length === 0 ? (
        <DataState
          loading={products.isLoading}
          error={products.error}
          empty={list.length === 0}
          emptyText="Không có sản phẩm nào"
        />
      ) : (
        <>
          <div className={`transition-opacity duration-200 ${isFetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Còn hàng</TableHead>
                  <TableHead className="text-right">Giá nhập</TableHead>
                  <TableHead className="text-right">Giá bán</TableHead>
                  <TableHead className="text-right">Thuế VAT</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {categories.data?.data?.find((c) => c.id === p.categoryId)?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">{p.stock ?? 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-medium">
                      {p.importPrice ? formatVnd(p.importPrice) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">{formatVnd(p.price)}</TableCell>
                    <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">
                      {p.taxRate ?? 10}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          Sửa
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleting(p)}>
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) setPendingFiles((prev) => { prev.forEach((pf) => URL.revokeObjectURL(pf.preview)); return []; });
        setDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
            <DialogDescription>Điền thông tin sản phẩm và lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="product-name">Tên sản phẩm *</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: Táo Envy"
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả *</Label>
              <Suspense fallback={<div className="h-[160px] rounded-md border border-input bg-muted animate-pulse" />}>
                <RichTextEditor
                  key={editing?.id ?? "create"}
                  value={form.description}
                  onChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
                />
              </Suspense>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-price">Giá bán *</Label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock">Tồn kho *</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-import-price">Giá nhập kho *</Label>
                <Input
                  id="product-import-price"
                  type="number"
                  min={0}
                  value={form.importPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, importPrice: e.target.value }))}
                  placeholder="Ví dụ: 100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-tax-rate">Thuế suất VAT (%) *</Label>
                <Input
                  id="product-tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  value={form.taxRate}
                  onChange={(e) => setForm((prev) => ({ ...prev, taxRate: e.target.value }))}
                  placeholder="Ví dụ: 10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-old-price">Giá cũ</Label>
              <Input
                id="product-old-price"
                type="number"
                min={0}
                value={form.oldPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, oldPrice: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">Danh mục</Label>
              <select
                id="product-category"
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Không chọn</option>
                {(categories.data?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-image section */}
            <div className="space-y-2">
              <Label>
                Ảnh sản phẩm{" "}
                <span className="text-muted-foreground font-normal">
                  ({form.imageUrls.length + pendingFiles.length} ảnh
                  {pendingFiles.length > 0 && `, ${pendingFiles.length} chưa lưu`})
                </span>
              </Label>

              {(form.imageUrls.length > 0 || pendingFiles.length > 0) && (
                <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-border bg-muted/30">
                  {form.imageUrls.map((url, i) => (
                    <div key={`ex-${i}`} className="relative group shrink-0">
                      <div className="size-16 rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={url} alt="" className="size-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                            (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                          }}
                        />
                        <div className="size-full hidden place-items-center text-muted-foreground">
                          <ImageIcon className="size-5" />
                        </div>
                      </div>
                      {i === 0 && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-primary text-primary-foreground px-1 rounded-full leading-4 whitespace-nowrap">
                          Chính
                        </span>
                      )}
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {pendingFiles.map((pf, i) => (
                    <div key={`pend-${i}`} className="relative group shrink-0">
                      <div className="size-16 rounded-lg overflow-hidden border border-dashed border-primary/50 bg-muted">
                        <img src={pf.preview} alt="" className="size-full object-cover opacity-80" />
                      </div>
                      {form.imageUrls.length === 0 && i === 0 && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-primary text-primary-foreground px-1 rounded-full leading-4 whitespace-nowrap">
                          Chính
                        </span>
                      )}
                      <div className="absolute top-0.5 left-0.5 size-4 rounded-full bg-background/80 grid place-items-center">
                        <Upload className="size-2.5 text-primary" />
                      </div>
                      <button type="button" onClick={() => removePending(i)}
                        className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0"
                >
                  <Upload className="size-4" />
                  Chọn ảnh
                </Button>
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addImage} className="shrink-0">
                  <Plus className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ảnh đầu tiên sẽ là ảnh đại diện. Ảnh local sẽ được tải lên khi bấm Lưu.
              </p>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || uploading}>
                {uploading ? (
                  <><Loader2 className="size-4 animate-spin" /> Đang tải ảnh...</>
                ) : saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Sản phẩm <strong>{deleting?.name}</strong> sẽ bị xóa. Hành động này không thể hoàn
              tác.
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
