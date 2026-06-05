import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { Search, X, Plus, Pencil, Trash2, ShieldCheck, UserCheck, Calendar, Key, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/table-pagination";
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

type AccountsSearch = {
  q: string;
  page: number;
};

type StaffItem = {
  id: string;
  name: string;
  username: string;
  role: "Admin" | "Manager" | "Staff";
  isActive: boolean;
  createdAt: string;
};

const accountsSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
  limit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
});

export const Route = createFileRoute("/_authed/accounts")({
  head: () => ({ meta: [{ title: "Tài khoản nhân viên — Admin" }] }),
  validateSearch: zodValidator(accountsSearchSchema),
  component: AccountsPage,
});

function AccountsPage() {
  const { q, page, limit } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  const [pendingStaffId, setPendingStaffId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"Admin" | "Manager" | "Staff">("Staff");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  const query = useQuery({
    queryKey: ["staff-admin", { q, page, limit }],
    queryFn: () =>
      apiFetch<StaffItem[]>("/staff/admin", {
        query: {
          search: q || undefined,
          page,
          limit,
        },
      }),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: any }) => {
      if (id) {
        return apiFetch(`/staff/admin/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return apiFetch("/staff/admin", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (res) => {
      if (!res.success) {
        setFormError(res.error || "Thực hiện thất bại");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["staff-admin"] });
      toast.success(editingStaff ? "Đã cập nhật tài khoản" : "Đã tạo tài khoản thành công");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/staff/admin/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || "Xóa thất bại");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["staff-admin"] });
      toast.success("Đã xóa tài khoản nhân viên");
      setDeletingStaff(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch(`/staff/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onMutate: ({ id }) => {
      setPendingStaffId(id);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["staff-admin"] });
      toast.success(
        variables.isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản nhân viên",
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật trạng thái");
    },
    onSettled: () => {
      setPendingStaffId(null);
    },
  });

  const list = query.data?.data ?? [];
  const total = Number(query.data?.meta?.total ?? list.length);
  const responseLimit = Number(query.data?.meta?.limit ?? limit);
  const totalPages = Math.max(1, Math.ceil(total / responseLimit));
  const hasFilter = Boolean(q);

  function resetForm() {
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormRole("Staff");
    setFormIsActive(true);
    setFormError("");
    setEditingStaff(null);
  }

  function handleOpenCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function handleOpenEdit(staff: StaffItem) {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormUsername(staff.username);
    setFormPassword(""); // Leave blank unless changing
    setFormRole(staff.role);
    setFormIsActive(staff.isActive);
    setFormError("");
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Vui lòng điền tên nhân viên");
      return;
    }

    if (!editingStaff && !formUsername.trim()) {
      setFormError("Vui lòng điền tên đăng nhập");
      return;
    }

    if (!editingStaff && !formPassword) {
      setFormError("Vui lòng điền mật khẩu khởi tạo");
      return;
    }

    const payload: any = {
      name: formName.trim(),
      role: formRole,
      isActive: formIsActive,
    };

    if (!editingStaff) {
      payload.username = formUsername.trim();
      payload.password = formPassword;
    } else if (formPassword) {
      payload.password = formPassword;
    }

    saveMutation.mutate({ id: editingStaff?.id, body: payload });
  }

  function handleDelete(staff: StaffItem) {
    if (staff.username === "admin") {
      toast.error("Không thể xóa tài khoản admin mặc định!");
      return;
    }
    setDeletingStaff(staff);
  }

  function getRoleBadge(role: StaffItem["role"]) {
    switch (role) {
      case "Admin":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/30 px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200/50">
            Quản trị viên
          </span>
        );
      case "Manager":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200/50">
            Quản lý
          </span>
        );
      case "Staff":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
            Nhân viên
          </span>
        );
    }
  }

  return (
    <div>
      <PageHeader
        title="Tài khoản"
        subtitle={`Quản lý ${total} tài khoản vận hành hệ thống`}
        action={
          <Button onClick={handleOpenCreate} className="h-10 rounded-lg shadow-[var(--shadow-button)]">
            <Plus className="size-4 mr-1.5" />
            Thêm tài khoản
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) =>
              navigate({
                search: (prev: AccountsSearch) => ({ ...prev, q: event.target.value, page: 1 }),
              })
            }
            placeholder="Tìm theo tên hoặc tài khoản nhân viên..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        {hasFilter ? (
          <button
            onClick={() => navigate({ search: { q: "", page: 1 } })}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted transition-colors text-foreground"
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
          emptyText="Không tìm thấy tài khoản nhân viên"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 text-left">Nhân viên</th>
                    <th className="px-6 py-4 text-left">Tài khoản</th>
                    <th className="px-6 py-4 text-left">Vai trò</th>
                    <th className="px-6 py-4 text-left">Ngày tạo</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((staff) => (
                    <tr key={staff.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-primary/10 text-primary font-bold text-sm grid place-items-center uppercase shadow-sm">
                            {staff.name.slice(0, 2)}
                          </div>
                          <span className="font-semibold text-foreground">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left font-medium text-foreground">{staff.username}</td>
                      <td className="px-6 py-4 text-left">{getRoleBadge(staff.role)}</td>
                      <td className="px-6 py-4 text-left text-muted-foreground">
                        {formatDate(staff.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Sửa"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff)}
                            disabled={staff.username === "admin"}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:bg-card"
                            title="Xóa"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <div className="flex items-center gap-2 ml-1">
                            <Switch
                              checked={Boolean(staff.isActive)}
                              disabled={
                                (toggleStatusMutation.isPending && pendingStaffId === staff.id) ||
                                staff.username === "admin"
                              }
                              onCheckedChange={(checked) =>
                                toggleStatusMutation.mutate({ id: staff.id, isActive: checked })
                              }
                            />
                            <span className="text-xs text-muted-foreground w-16 text-left">
                              {staff.isActive ? "Hoạt động" : "Tạm khóa"}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingStaff ? "Chỉnh sửa tài khoản" : "Thêm tài khoản nhân viên"}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "Cập nhật thông tin phân quyền hoặc mật khẩu của nhân viên."
                : "Tạo tài khoản mới và thiết lập quyền truy cập cho nhân viên vận hành."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Tên nhân viên *</Label>
              <Input
                id="staff-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="h-10 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-username">Tên đăng nhập *</Label>
              <Input
                id="staff-username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="Ví dụ: nguyenvana"
                className="h-10 rounded-lg"
                required
                disabled={Boolean(editingStaff)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="staff-password">
                  {editingStaff ? "Mật khẩu mới (Không bắt buộc)" : "Mật khẩu khởi tạo *"}
                </Label>
                {editingStaff && (
                  <span className="text-[10px] text-muted-foreground">Để trống nếu không đổi</span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="staff-password"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingStaff ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
                  className="h-10 rounded-lg pl-9"
                  required={!editingStaff}
                />
                <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="staff-role">Vai trò *</Label>
                <select
                  id="staff-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={editingStaff?.username === "admin"}
                >
                  <option value="Staff">Nhân viên</option>
                  <option value="Manager">Quản lý</option>
                  <option value="Admin">Quản trị viên</option>
                </select>
              </div>

              <div className="space-y-2 flex flex-col justify-end pb-2">
                <div className="flex items-center gap-2 h-10 px-1">
                  <Switch
                    id="staff-active"
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                    disabled={editingStaff?.username === "admin"}
                  />
                  <Label htmlFor="staff-active" className="cursor-pointer">
                    Cho phép hoạt động
                  </Label>
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-lg">
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="h-10 rounded-lg shadow-[var(--shadow-button)]">
                {saveMutation.isPending ? "Đang lưu..." : "Lưu tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={Boolean(deletingStaff)} onOpenChange={(open) => !open && setDeletingStaff(null)}>
        {deletingStaff && (
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
              <AlertDialogDescription>
                Tài khoản của nhân viên <strong className="text-foreground">{deletingStaff.name}</strong> (username: <code>{deletingStaff.username}</code>) sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-10 rounded-lg">Hủy bỏ</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deletingStaff.id)}
                disabled={deleteMutation.isPending}
                className="h-10 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}

// Removed duplicate local pagination
