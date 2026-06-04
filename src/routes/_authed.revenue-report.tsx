import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { TablePagination } from "@/components/table-pagination";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Calendar, DollarSign, Download, ShieldCheck, ShoppingBag, Landmark, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

type RevenueSearch = {
  startDate: string;
  endDate: string;
  channel: string;
};

const revenueSearchSchema = z.object({
  startDate: fallback(z.string(), "").default(""),
  endDate: fallback(z.string(), "").default(""),
  channel: fallback(z.string(), "all").default("all"),
  page: fallback(z.number().int().min(1), 1).default(1),
  limit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
});

export const Route = createFileRoute("/_authed/revenue-report")({
  head: () => ({ meta: [{ title: "Báo cáo doanh thu thực tế — HappyMall Admin" }] }),
  validateSearch: zodValidator(revenueSearchSchema),
  component: RevenueReportPage,
});

type RevenueReportData = {
  summary: {
    grossSales: number;
    vatCollected: number;
    netSales: number;
    cogs: number;
    actualProfit: number;
  };
  transactions: {
    id: string;
    code: string;
    channel: "POS" | "Online";
    customerName: string;
    customerPhone: string;
    total: number;
    vat: number;
    netSales: number;
    cogs: number;
    actualRevenue: number;
    createdAt: string;
  }[];
};

function RevenueCard({
  label,
  value,
  description,
  icon: Icon,
  variant = "normal",
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "normal" | "highlight" | "success" | "accent";
}) {
  const styles = {
    normal: "bg-card text-card-foreground border-border",
    highlight: "bg-indigo-50 dark:bg-indigo-950/20 text-foreground border-indigo-200/50 dark:border-indigo-900/50",
    success: "bg-emerald-50 dark:bg-emerald-950/20 text-foreground border-emerald-200/50 dark:border-emerald-900/50",
    accent: "bg-linear-to-br from-primary to-orange-400 text-primary-foreground border-transparent",
  };

  const iconStyles = {
    normal: "bg-muted text-muted-foreground",
    highlight: "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400",
    success: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
    accent: "bg-white/20 text-white",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between h-36 transition-all hover:translate-y-[-2px] hover:shadow-md ${styles[variant]}`}>
      <div className="flex justify-between items-start">
        <span className={`text-xs font-semibold uppercase tracking-wider ${variant === "accent" ? "text-white/80" : "text-muted-foreground"}`}>
          {label}
        </span>
        <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${iconStyles[variant]}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black leading-none">{formatVnd(value)}</p>
        <p className={`text-[10px] mt-1.5 ${variant === "accent" ? "text-white/85" : "text-muted-foreground"}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

function RevenueReportPage() {
  const { startDate, endDate, channel, page, limit } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [localChannel, setLocalChannel] = useState(channel);

  const query = useQuery({
    queryKey: ["revenue-report", { startDate, endDate, channel }],
    queryFn: () =>
      apiFetch<RevenueReportData>("/admin/revenue-report", {
        query: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          channel: channel === "all" ? undefined : channel,
        },
      }),
  });

  const report = query.data?.data;
  const summary = report?.summary ?? {
    grossSales: 0,
    vatCollected: 0,
    netSales: 0,
    cogs: 0,
    actualProfit: 0,
  };
  const list = report?.transactions ?? [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedList = list.slice((page - 1) * limit, page * limit);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      search: (prev: any) => ({
        ...prev,
        startDate: localStart,
        endDate: localEnd,
        channel: localChannel,
        page: 1,
      }),
    });
  }

  function handleResetFilters() {
    setLocalStart("");
    setLocalEnd("");
    setLocalChannel("all");
    navigate({
      search: {
        startDate: "",
        endDate: "",
        channel: "all",
        page: 1,
        limit,
      },
    });
  }

  // Exports data to CSV with UTF-8 BOM
  function handleExportCsv() {
    if (list.length === 0) {
      toast.warning("Không có dữ liệu giao dịch để xuất");
      return;
    }

    try {
      const headers = [
        "Mã đơn hàng",
        "Kênh bán",
        "Ngày tạo đơn",
        "Tên khách hàng",
        "Số điện thoại",
        "Doanh số (VND)",
        "Thuế GTGT (VND)",
        "Doanh thu thuần (VND)",
        "Giá vốn (VND)",
        "Doanh thu thực tế (VND)"
      ];

      const csvRows = [
        headers.join(","), // Header row
        ...list.map((t) =>
          [
            t.code,
            t.channel === "POS" ? "Tại quầy (POS)" : "Trực tuyến (Online)",
            formatDate(t.createdAt),
            `"${t.customerName.replace(/"/g, '""')}"`,
            t.customerPhone || "—",
            t.total,
            t.vat,
            t.netSales,
            t.cogs,
            t.actualRevenue
          ].join(",")
        )
      ];

      const csvContent = "\uFEFF" + csvRows.join("\n"); // Include BOM for Excel UTF-8 display
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      const filename = `bao_cao_doanh_thu_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Xuất báo cáo doanh thu CSV thành công!");
    } catch {
      toast.error("Không thể xuất tệp CSV");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo doanh thu"
        subtitle="Theo dõi doanh số, thuế VAT thu hộ, giá vốn hàng bán và doanh thu thực tế (lợi nhuận)"
        action={
          <Button onClick={handleExportCsv} disabled={list.length === 0 || query.isLoading} className="h-10 rounded-lg shadow-sm">
            <Download className="size-4 mr-1.5" />
            Xuất báo cáo (CSV)
          </Button>
        }
      />

      {/* Filters form */}
      <form onSubmit={handleFilterSubmit} className="bg-card border rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="start-date" className="text-xs font-semibold">Từ ngày</Label>
          <Input
            id="start-date"
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="h-10 bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end-date" className="text-xs font-semibold">Đến ngày</Label>
          <Input
            id="end-date"
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="h-10 bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="channel-filter" className="text-xs font-semibold">Kênh bán</Label>
          <select
            id="channel-filter"
            value={localChannel}
            onChange={(e) => setLocalChannel(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả kênh</option>
            <option value="POS">Bán tại quầy (POS)</option>
            <option value="Online">Bán trực tuyến (Online)</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="h-10 flex-1 rounded-lg">
            Áp dụng
          </Button>
          {(startDate || endDate || channel !== "all") && (
            <Button type="button" variant="outline" onClick={handleResetFilters} className="h-10 px-3 rounded-lg" title="Xóa lọc">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </form>

      {/* KPI Cards Grid */}
      {query.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-card border animate-pulse border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <RevenueCard
            label="Tổng doanh số"
            value={summary.grossSales}
            description="Tổng tiền mặt thu về từ giỏ hàng"
            icon={ShoppingBag}
            variant="normal"
          />
          <RevenueCard
            label="Thuế VAT"
            value={summary.vatCollected}
            description="Tổng tiền thuế GTGT thu hộ"
            icon={Landmark}
            variant="highlight"
          />
          <RevenueCard
            label="Doanh thu thuần"
            value={summary.netSales}
            description="Doanh thu thực tính (Doanh số - VAT)"
            icon={DollarSign}
            variant="normal"
          />
          <RevenueCard
            label="Giá vốn hàng bán"
            value={summary.cogs}
            description="Tổng chi phí nhập kho của sản phẩm"
            icon={Landmark}
            variant="normal"
          />
          <RevenueCard
            label="Doanh thu thực tế"
            value={summary.actualProfit}
            description="Lợi nhuận gộp thực tế thu về"
            icon={ShieldCheck}
            variant={summary.actualProfit >= 0 ? "success" : "accent"}
          />
        </div>
      )}

      {/* Report breakdown table */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Chi tiết giao dịch doanh thu</h3>
        {query.isLoading || query.isError || list.length === 0 ? (
          <DataState
            loading={query.isLoading}
            error={query.error}
            empty={list.length === 0}
            emptyText="Không có dữ liệu giao dịch trong khoảng thời gian này"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-card border shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 text-xs">
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Kênh bán</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead className="text-right">Tổng cộng</TableHead>
                    <TableHead className="text-right">Thuế VAT</TableHead>
                    <TableHead className="text-right">Doanh thu thuần</TableHead>
                    <TableHead className="text-right">Giá vốn</TableHead>
                    <TableHead className="text-right">Doanh thu thực tế</TableHead>
                    <TableHead className="text-right">Ngày đặt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedList.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors text-xs">
                      <TableCell className="font-mono font-semibold">{t.code}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${t.channel === "POS" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-blue-50 text-blue-700 border border-blue-200/50"}`}>
                          {t.channel === "POS" ? "Tại quầy" : "Online"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{t.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{t.customerPhone || "—"}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatVnd(t.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatVnd(t.vat)}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatVnd(t.netSales)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatVnd(t.cogs)}</TableCell>
                      <TableCell className={`text-right font-bold ${t.actualRevenue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {formatVnd(t.actualRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
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
          </div>
        )}
      </div>
    </div>
  );
}
