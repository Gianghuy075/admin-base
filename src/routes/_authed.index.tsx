import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";
import { RevenueChart, StatusChart, TopProductsChart } from "@/components/dashboard-charts";
import {
  Package,
  ShoppingCart,
  Ticket,
  Tag,
  TrendingUp,
  Users,
  DollarSign,
  Landmark,
  ShieldCheck,
  Store,
  Globe,
  User,
} from "lucide-react";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Tổng quan — HTMAdmin" }] }),
  component: DashboardPage,
});

type AdminStats = {
  counts: {
    products: number;
    categories: number;
    orders: number;
    users: number;
    vouchers: number;
  };
  totalRevenue: number;
  recentOrders: {
    id: string;
    status: string;
    total: number;
    payMethod: string | null;
    createdAt: string;
  }[];
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; total: number; count: number }[];
  topProducts: { productId: string; name: string; qty: number; revenue: number }[];
  posCount: number;
  onlineCount: number;
  posSales: number;
  onlineSales: number;
  summary: {
    grossSales: number;
    vatCollected: number;
    netSales: number;
    cogs: number;
    actualProfit: number;
  };
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "orange" | "navy" | "hero" | "green" | "purple";
}) {
  const tones: Record<string, string> = {
    orange: "bg-primary/10 text-primary",
    navy: "bg-secondary text-secondary-foreground",
    hero: "bg-accent text-accent-foreground",
    green: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-5 flex items-center gap-4 border border-border/55 transition-all hover:shadow-md">
      <div className={`size-12 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function MiniFinanceCard({
  label,
  value,
  icon: Icon,
  description,
  variant = "normal",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  variant?: "normal" | "highlight" | "success";
}) {
  const styles = {
    normal: "bg-card text-card-foreground border-border/60",
    highlight: "bg-amber-50/40 dark:bg-amber-950/10 text-foreground border-amber-100/50 dark:border-amber-900/30",
    success: "bg-linear-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/10",
  };

  const iconStyles = {
    normal: "bg-muted text-muted-foreground",
    highlight: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
    success: "bg-white/20 text-white",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between h-32 transition-all hover:translate-y-[-1px] hover:shadow-md ${styles[variant]}`}>
      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${variant === "success" ? "text-white/80" : "text-muted-foreground"}`}>
          {label}
        </span>
        <div className={`size-8 rounded-lg grid place-items-center shrink-0 ${iconStyles[variant]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div>
        <p className="text-xl font-extrabold leading-none">{formatVnd(value)}</p>
        <p className={`text-[9px] mt-1.5 ${variant === "success" ? "text-white/80" : "text-muted-foreground"}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

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

function DashboardPage() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<AdminStats>("/admin/stats"),
  });
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<any>("/auth/me"),
  });

  const s = stats.data?.data;
  const counts = s?.counts;
  const meData = me.data?.data;
  const displayName = meData?.username?.trim() || meData?.name?.trim() || "";
  const accountIdentifier = meData?.username?.trim() || "—";
  const userRole = meData?.role || "Staff";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chào mừng${displayName ? `, ${displayName}` : ""}!`}
        subtitle="Tổng quan hoạt động và doanh thu thực tế HappyMall"
      />

      {/* Row 1: System Counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Sản phẩm" value={counts?.products ?? "—"} icon={Package} tone="orange" />
        <StatCard label="Danh mục" value={counts?.categories ?? "—"} icon={Tag} tone="navy" />
        <StatCard label="Khách hàng Zalo" value={counts?.users ?? "—"} icon={Users} tone="purple" />
        <StatCard label="Voucher" value={counts?.vouchers ?? "—"} icon={Ticket} tone="green" />
        <StatCard label="Đơn hàng" value={counts?.orders ?? "—"} icon={ShoppingCart} tone="hero" />
      </div>

      {/* Row 2: Sales Channels Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* POS Channel Card */}
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/15 p-5 shadow-xs flex flex-col justify-between h-40 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Kênh Bán Tại Quầy (POS)
              </span>
              <h3 className="text-xs text-muted-foreground mt-0.5">{s?.posCount ?? 0} đơn hàng thành công</h3>
            </div>
            <div className="size-10 rounded-xl grid place-items-center bg-emerald-100 text-emerald-700 shrink-0">
              <Store className="size-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{formatVnd(s?.posSales ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Doanh thu thực nhận trực tiếp từ quầy thu ngân
            </p>
          </div>
        </div>

        {/* Online Channel Card */}
        <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/15 p-5 shadow-xs flex flex-col justify-between h-40 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Kênh Trực Tuyến (Online)
              </span>
              <h3 className="text-xs text-muted-foreground mt-0.5">{s?.onlineCount ?? 0} đơn hàng thành công</h3>
            </div>
            <div className="size-10 rounded-xl grid place-items-center bg-blue-100 text-blue-700 shrink-0">
              <Globe className="size-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{formatVnd(s?.onlineSales ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Doanh thu qua trang thương mại điện tử trực tuyến
            </p>
          </div>
        </div>

        {/* Account Status Card */}
        <div className="rounded-2xl border border-border/60 bg-sidebar p-5 shadow-xs flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/70">
                Phiên làm việc
              </span>
              <h3 className="text-xs text-sidebar-foreground/70 mt-0.5">
                Vai trò: {userRole === "Admin" ? "Quản trị viên" : userRole === "Manager" ? "Quản lý" : "Nhân viên"}
              </h3>
            </div>
            <div className="size-10 rounded-xl grid place-items-center bg-sidebar-foreground/10 text-sidebar-foreground shrink-0">
              <User className="size-5" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-sidebar-foreground truncate">{displayName || "—"}</p>
            <p className="text-[10px] text-sidebar-foreground/75 truncate mt-1.5">
              Tài khoản: {accountIdentifier}
            </p>
          </div>
        </div>
      </div>

      {/* Row 3: Financial Metrics Overview */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Hiệu suất tài chính</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniFinanceCard
            label="Doanh thu thuần"
            value={s?.summary?.netSales ?? 0}
            icon={DollarSign}
            description="Doanh thu sau khi trừ thuế VAT"
            variant="normal"
          />
          <MiniFinanceCard
            label="Thuế VAT"
            value={s?.summary?.vatCollected ?? 0}
            icon={Landmark}
            description="Tổng tiền thuế GTGT thu hộ"
            variant="highlight"
          />
          <MiniFinanceCard
            label="Giá vốn hàng bán"
            value={s?.summary?.cogs ?? 0}
            icon={Package}
            description="Tổng chi phí giá vốn sản phẩm"
            variant="normal"
          />
          <MiniFinanceCard
            label="Doanh thu thực tế (Lợi nhuận)"
            value={s?.summary?.actualProfit ?? 0}
            icon={ShieldCheck}
            description="Lợi nhuận gộp thực tế thu về"
            variant="success"
          />
        </div>
      </div>

      {/* Row 4: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart data={s?.revenueByDay ?? []} />
        <StatusChart data={s?.ordersByStatus ?? []} total={counts?.orders ?? 0} />
        <TopProductsChart data={s?.topProducts ?? []} />
      </div>

      {/* Row 5: Recent Orders */}
      <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Đơn hàng mới nhận</h2>
          <span className="text-xs text-muted-foreground">Hiển thị 8 đơn hàng gần đây</span>
        </div>
        {stats.isLoading || stats.isError || (s?.recentOrders.length ?? 0) === 0 ? (
          <div className="p-6">
            <DataState
              loading={stats.isLoading}
              error={stats.error}
              empty={(s?.recentOrders.length ?? 0) === 0}
              emptyText="Chưa có đơn hàng nào được ghi nhận"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Mã đơn</th>
                  <th className="text-left px-6 py-3 font-semibold">Kênh bán</th>
                  <th className="text-left px-6 py-3 font-semibold">Trạng thái</th>
                  <th className="text-right px-6 py-3 font-semibold">Tổng tiền</th>
                  <th className="text-left px-6 py-3 font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {(s?.recentOrders ?? []).map((o) => {
                  const isPos = o.payMethod === "Tại quầy (POS)";
                  const channelBadge = isPos ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      Tại quầy (POS)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                      Online
                    </span>
                  );
                  return (
                    <tr key={o.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-mono font-semibold text-xs">{o.id}</td>
                      <td className="px-6 py-3">{channelBadge}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_TONE[o.status] ?? "bg-muted"
                          }`}
                        >
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-foreground">{formatVnd(o.total)}</td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
