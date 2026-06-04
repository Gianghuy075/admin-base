import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { Search, X, Eye, ShieldCheck, UserCheck, Calendar, Phone, Award, Hash, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UsersSearch = {
  q: string;
  page: number;
};

type UserItem = {
  id: string;
  name: string;
  zaloId: string;
  avatar: string;
  phone: string;
  points: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: string;
};

const usersSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

const LIMIT = 20;

export const Route = createFileRoute("/_authed/users")({
  head: () => ({ meta: [{ title: "Khách hàng Zalo OA — HappyMall Admin" }] }),
  validateSearch: zodValidator(usersSearchSchema),
  component: UsersPage,
});

function UsersPage() {
  const { q, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<UserItem | null>(null);

  const query = useQuery({
    queryKey: ["users-admin", { q, page }],
    queryFn: () =>
      apiFetch<UserItem[]>("/users/admin", {
        query: {
          search: q || undefined,
          page,
          limit: LIMIT,
        },
      }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { isActive?: boolean };
    }) =>
      apiFetch(`/users/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onMutate: ({ id }) => {
      setPendingUserId(id);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["users-admin"] });
      toast.success(
        variables.payload.isActive ? "Đã kích hoạt khách hàng" : "Đã vô hiệu hóa khách hàng",
      );
      // Update selectedCustomer if open
      if (selectedCustomer && selectedCustomer.id === variables.id) {
        setSelectedCustomer((prev) => prev ? { ...prev, isActive: !!variables.payload.isActive } : null);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Cập nhật khách hàng thất bại";
      toast.error(message);
    },
    onSettled: () => {
      setPendingUserId(null);
    },
  });

  const list = query.data?.data ?? [];
  const total = Number(query.data?.meta?.total ?? list.length);
  const responseLimit = Number(query.data?.meta?.limit ?? LIMIT);
  const totalPages = Math.max(1, Math.ceil(total / responseLimit));
  const hasFilter = Boolean(q);

  return (
    <div>
      <PageHeader title="Người dùng" subtitle={`Tổng ${total} khách hàng liên kết Zalo OA`} />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) =>
              navigate({
                search: (prev: UsersSearch) => ({ ...prev, q: event.target.value, page: 1 }),
              })
            }
            placeholder="Tìm theo tên, Zalo ID hoặc số điện thoại..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        {hasFilter ? (
          <button
            onClick={() => navigate({ search: { q: "", page: 1 } })}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <X className="size-4" />
            Xóa lọc
          </button>
        ) : null}
      </div>

      {query.isLoading || query.isError || list.length === 0 ? (
        <DataState
          loading={query.isLoading}
          error={query.error}
          empty={list.length === 0}
          emptyText="Không tìm thấy khách hàng nào"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 text-left">Khách hàng</th>
                    <th className="px-6 py-4 text-left">Zalo ID</th>
                    <th className="px-6 py-4 text-left">Điện thoại</th>
                    <th className="px-6 py-4 text-left">Điểm tích lũy</th>
                    <th className="px-6 py-4 text-left">Ngày liên kết</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((user) => (
                    <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="size-10 rounded-full object-cover border border-border shadow-sm bg-muted shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-foreground block leading-tight">{user.name}</span>
                            <span className="text-[11px] text-muted-foreground">Zalo Customer</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{user.zaloId}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{user.phone}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          ⭐ {user.points} điểm
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => setSelectedCustomer(user)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-3 text-xs font-medium hover:bg-muted transition-colors text-foreground"
                          >
                            <Eye className="size-3.5 text-muted-foreground" />
                            Xem chi tiết
                          </button>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={Boolean(user.isActive)}
                              disabled={updateUserMutation.isPending && pendingUserId === user.id}
                              onCheckedChange={(checked) =>
                                updateUserMutation.mutate({
                                  id: user.id,
                                  payload: { isActive: checked },
                                })
                              }
                            />
                            <span className="text-xs text-muted-foreground w-16 text-left">
                              {user.isActive ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <UsersPagination page={page} totalPages={totalPages} />
        </>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={Boolean(selectedCustomer)} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        {selectedCustomer && (
          <DialogContent className="sm:max-w-md overflow-hidden rounded-2xl p-0">
            <div className="relative h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              <div className="absolute -bottom-10 left-6">
                <img
                  src={selectedCustomer.avatar}
                  alt={selectedCustomer.name}
                  className="size-20 rounded-full border-4 border-card object-cover shadow-md bg-muted"
                />
              </div>
            </div>
            <div className="px-6 pt-12 pb-6">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {selectedCustomer.name}
                  {selectedCustomer.isActive ? (
                    <span className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                      Đã khóa
                    </span>
                  )}
                </DialogTitle>
                <DialogTitle className="hidden">Chi tiết khách hàng Zalo OA</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Khách hàng liên kết qua Zalo OA</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
                  <Hash className="size-4 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Zalo ID</p>
                    <p className="font-mono text-sm font-semibold truncate text-foreground">{selectedCustomer.zaloId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
                  <Phone className="size-4 text-indigo-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Số điện thoại</p>
                    <p className="text-sm font-semibold text-foreground">{selectedCustomer.phone || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
                    <Award className="size-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Điểm tích lũy</p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{selectedCustomer.points} điểm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
                    <ShoppingBag className="size-4 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tổng đơn hàng</p>
                      <p className="text-sm font-bold text-foreground">{selectedCustomer.totalOrders} đơn</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
                  <Calendar className="size-4 text-indigo-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ngày liên kết</p>
                    <p className="text-sm font-semibold text-foreground">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="h-10 rounded-lg">
                  Đóng
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function UsersPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  const window = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <Link
        from={Route.fullPath}
        search={(prev: UsersSearch) => ({ ...prev, page: Math.max(1, page - 1) })}
        className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50 inline-flex items-center"
        aria-disabled={page === 1}
      >
        Trước
      </Link>
      {pages.map((p, index) =>
        p === "…" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            from={Route.fullPath}
            search={(prev: UsersSearch) => ({ ...prev, page: p })}
            className={`grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm font-medium ${
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
        search={(prev: UsersSearch) => ({ ...prev, page: Math.min(totalPages, page + 1) })}
        className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50 inline-flex items-center"
        aria-disabled={page >= totalPages}
      >
        Sau
      </Link>
    </div>
  );
}
