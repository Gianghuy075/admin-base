import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type CategoryItem = {
  id: string;
  name: string;
};

type ProductItem = {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
  categoryId?: string | null;
};

export const Route = createFileRoute("/_authed/inventory")({
  head: () => ({ meta: [{ title: "Tồn kho — HappyMall Admin" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "out" | "low" | "in">("all");
  const [categoryId, setCategoryId] = useState("");

  const productsQuery = useQuery({
    queryKey: ["products-inventory"],
    queryFn: () => apiFetch<ProductItem[]>("/products", { auth: false, query: { limit: 1000 } }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<CategoryItem[]>("/categories", { auth: false }),
  });

  const list = productsQuery.data?.data ?? [];
  const categoriesList = categoriesQuery.data?.data ?? [];

  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      // 1. Search filter
      const matchesSearch = !term || p.name.toLowerCase().includes(term);
      
      // 2. Category filter
      const matchesCategory = !categoryId || p.categoryId === categoryId;

      // 3. Stock status filter
      const stock = p.stock ?? 0;
      let matchesStatus = true;
      if (statusFilter === "out") {
        matchesStatus = stock <= 0;
      } else if (statusFilter === "low") {
        matchesStatus = stock > 0 && stock < 10;
      } else if (statusFilter === "in") {
        matchesStatus = stock >= 10;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [list, search, categoryId, statusFilter]);

  const hasFilter = search.trim() || statusFilter !== "all" || categoryId;

  // Stats cards values
  const stats = useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;
    let totalItems = 0;

    list.forEach((p) => {
      const stock = p.stock ?? 0;
      totalItems += stock;
      if (stock <= 0) {
        outOfStock++;
      } else if (stock < 10) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { outOfStock, lowStock, inStock, totalItems };
  }, [list]);

  return (
    <div>
      <PageHeader
        title="Tồn kho sản phẩm"
        subtitle="Quản lý và theo dõi số lượng tồn kho sản phẩm"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-5 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-primary/10 text-primary">
            <Package className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Tổng sản phẩm trong kho</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalItems} đơn vị</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-5 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-emerald-100 text-emerald-700">
            <CheckCircle className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Còn hàng (&gt;= 10)</p>
            <p className="text-2xl font-bold text-foreground">{stats.inStock} mã hàng</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-5 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-amber-100 text-amber-700">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Sắp hết hàng (&lt; 10)</p>
            <p className="text-2xl font-bold text-foreground">{stats.lowStock} mã hàng</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-5 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-rose-100 text-rose-700">
            <XCircle className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Hết hàng (= 0)</p>
            <p className="text-2xl font-bold text-foreground">{stats.outOfStock} mã hàng</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm theo tên..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-11 min-w-[180px] rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {categoriesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-11 min-w-[180px] rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="all">Tất cả trạng thái kho</option>
          <option value="in">Còn hàng (đầy đủ)</option>
          <option value="low">Sắp hết hàng (&lt; 10)</option>
          <option value="out">Hết hàng (= 0)</option>
        </select>
        {hasFilter ? (
          <button
            onClick={() => {
              setSearch("");
              setCategoryId("");
              setStatusFilter("all");
            }}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        ) : null}
      </div>

      {productsQuery.isLoading || productsQuery.isError || filteredList.length === 0 ? (
        <DataState
          loading={productsQuery.isLoading}
          error={productsQuery.error}
          empty={filteredList.length === 0}
          emptyText="Không tìm thấy sản phẩm nào khớp bộ lọc"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã sản phẩm</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-center">Số lượng tồn</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((p) => {
                const stock = p.stock ?? 0;
                let statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                    Còn hàng
                  </span>
                );
                let stockTextClass = "text-foreground font-semibold";

                if (stock <= 0) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700">
                      Hết hàng
                    </span>
                  );
                  stockTextClass = "text-rose-600 font-bold";
                } else if (stock < 10) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">
                      Sắp hết hàng
                    </span>
                  );
                  stockTextClass = "text-amber-600 font-bold";
                }

                const catName = categoriesList.find((c) => c.id === p.categoryId)?.name ?? "—";

                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <td className="font-mono text-xs text-muted-foreground">{p.id}</td>
                    <td className="font-medium">{p.name}</td>
                    <td>{catName}</td>
                    <td className="text-right font-semibold">{formatVnd(p.price)}</td>
                    <td className={`text-center ${stockTextClass}`}>{stock}</td>
                    <td>{statusBadge}</td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
