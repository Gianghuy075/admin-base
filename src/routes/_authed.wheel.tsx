import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { TablePagination } from "@/components/table-pagination";
import { Gift, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PrizeType = "voucher" | "points" | "turns" | "miss";

type WheelPrize = {
  id: string;
  name?: string | null;
  label?: string | null;
  type: PrizeType;
  probability: number;
  value?: number | null;
  voucherId?: string | null;
  isActive?: boolean | null;
};

type VoucherOption = {
  id: string;
  title?: string | null;
};

type WheelHistoryItem = {
  id: string;
  createdAt?: string | null;
  prizeName?: string | null;
  prize?: {
    name?: string | null;
    label?: string | null;
  } | null;
};

type PrizeFormState = {
  name: string;
  type: PrizeType;
  probability: string;
  value: string;
  voucherId: string;
  isActive: boolean;
};

const defaultForm: PrizeFormState = {
  name: "",
  type: "points",
  probability: "",
  value: "",
  voucherId: "",
  isActive: true,
};

const TYPE_LABEL: Record<PrizeType, string> = {
  voucher: "Voucher",
  points: "Điểm",
  turns: "Lượt quay",
  miss: "Chúc may mắn lần sau",
};

const EMPTY_PRIZES: WheelPrize[] = [];
const EMPTY_HISTORY: WheelHistoryItem[] = [];

const wheelSearchSchema = z.object({
  tab: fallback(z.enum(["prizes", "history"]), "prizes").default("prizes"),
  prizePage: fallback(z.number().int().min(1), 1).default(1),
  prizeLimit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
  historyPage: fallback(z.number().int().min(1), 1).default(1),
  historyLimit: fallback(z.union([z.literal(10), z.literal(20)]), 10).default(10),
});

export const Route = createFileRoute("/_authed/wheel")({
  head: () => ({ meta: [{ title: "Vòng quay — HappyMall Admin" }] }),
  validateSearch: zodValidator(wheelSearchSchema),
  component: WheelPage,
});

function WheelPage() {
  const { tab, prizePage, prizeLimit, historyPage, historyLimit } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WheelPrize | null>(null);
  const [form, setForm] = useState<PrizeFormState>(defaultForm);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<WheelPrize | null>(null);

  const prizes = useQuery({
    queryKey: ["wheel-admin-prizes"],
    queryFn: () => apiFetch<WheelPrize[]>("/wheel/admin/prizes"),
  });

  const vouchers = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => apiFetch<VoucherOption[]>("/vouchers"),
  });
  const voucherList = vouchers.data?.data ?? [];

  const history = useQuery({
    queryKey: ["wheel-history"],
    queryFn: () => apiFetch<WheelHistoryItem[]>("/wheel/history"),
  });

  const list = prizes.data?.data ?? EMPTY_PRIZES;
  const historyList = history.data?.data ?? EMPTY_HISTORY;

  const activeProbability = useMemo(
    () =>
      list
        .filter((item) => item.isActive ?? true)
        .reduce((sum, item) => sum + Number(item.probability ?? 0), 0),
    [list],
  );

  const prizeTotal = list.length;
  const prizeTotalPages = Math.max(1, Math.ceil(prizeTotal / prizeLimit));
  const paginatedPrizes = list.slice((prizePage - 1) * prizeLimit, prizePage * prizeLimit);

  const historyTotal = historyList.length;
  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / historyLimit));
  const paginatedHistory = historyList.slice((historyPage - 1) * historyLimit, historyPage * historyLimit);

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/wheel/admin/prizes/${payload.id}` : "/wheel/admin/prizes", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wheel-admin-prizes"] });
      toast.success(editing ? "Cập nhật phần thưởng thành công" : "Tạo phần thưởng thành công");
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu phần thưởng thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/wheel/admin/prizes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wheel-admin-prizes"] });
      toast.success("Xóa phần thưởng thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa phần thưởng thất bại";
      toast.error(message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: { id: string; isActive: boolean }) =>
      apiFetch(`/wheel/admin/prizes/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: payload.isActive }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wheel-admin-prizes"] });
      toast.success("Cập nhật trạng thái thành công");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Cập nhật trạng thái thất bại");
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(prize: WheelPrize) {
    setEditing(prize);
    setForm({
      name: prize.name ?? prize.label ?? "",
      type: prize.type ?? "points",
      probability: String(prize.probability ?? ""),
      value: prize.value == null ? "" : String(prize.value),
      voucherId: prize.voucherId ?? "",
      isActive: prize.isActive ?? true,
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.name.trim()) return "Tên phần thưởng là bắt buộc";
    if (!form.probability.trim()) return "Xác suất là bắt buộc";
    const probability = Number(form.probability);
    if (!Number.isFinite(probability) || probability <= 0) return "Xác suất phải lớn hơn 0";
    if (probability > 100) return "Xác suất không được vượt quá 100%";
    if (form.value.trim()) {
      const value = Number(form.value);
      if (!Number.isFinite(value) || value < 0) return "Giá trị thưởng không hợp lệ";
    }
    if (form.type === "voucher" && !form.voucherId.trim())
      return "Voucher ID là bắt buộc cho phần thưởng voucher";
    return "";
  }

  function validateProbabilityCeiling(nextProbability: number) {
    const remainder = list.reduce((sum, item) => {
      const isCurrent = item.id === editing?.id;
      if (isCurrent || !(item.isActive ?? true)) return sum;
      return sum + Number(item.probability ?? 0);
    }, 0);
    const total = remainder + (form.isActive ? nextProbability : 0);
    if (total > 100) {
      return `Tổng probability active đang là ${total.toFixed(2)}%. Không được vượt quá 100%.`;
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
    const probability = Number(form.probability);
    const probabilityError = validateProbabilityCeiling(probability);
    if (probabilityError) {
      setFormError(probabilityError);
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      label: form.name.trim(),
      type: form.type,
      probability,
      value: form.value.trim() ? Number(form.value) : undefined,
      voucherId: form.voucherId.trim() || undefined,
      isActive: form.isActive,
    };

    setFormError("");
    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Vòng quay may mắn"
        subtitle={`${list.length} phần thưởng (active probability: ${activeProbability.toFixed(2)}%)`}
      />

      <Tabs
        value={tab}
        onValueChange={(val) =>
          navigate({ search: (prev: any) => ({ ...prev, tab: val }) })
        }
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="prizes">Quản lý phần thưởng</TabsTrigger>
          <TabsTrigger value="history">Lịch sử quay</TabsTrigger>
        </TabsList>

        <TabsContent value="prizes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tạo phần thưởng
            </Button>
          </div>

          {prizes.isLoading || prizes.isError || list.length === 0 ? (
            <DataState
              loading={prizes.isLoading}
              error={prizes.error}
              empty={list.length === 0}
              emptyText="Chưa có phần thưởng nào"
            />
          ) : (
            <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên phần thưởng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Tỷ lệ (Probability)</TableHead>
                      <TableHead>Giá trị thưởng</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPrizes.map((p) => {
                      const valueStr = p.value == null ? "—" : p.value;
                      const rewardDetail = p.type === "voucher" ? `Voucher: ${p.voucherId || "—"}` : valueStr;

                      return (
                        <TableRow key={p.id} className="hover:bg-muted/30">
                          <TableCell className="font-semibold text-sm">
                            <div className="flex items-center gap-2">
                              <div className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground shrink-0">
                                <Gift className="size-4.5" />
                              </div>
                              <span>{p.name ?? p.label ?? "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{TYPE_LABEL[p.type] ?? p.type}</TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            {Number(p.probability ?? 0).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{rewardDetail}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={p.isActive ?? true}
                                  onCheckedChange={(checked) =>
                                    toggleMutation.mutate({ id: p.id, isActive: checked })
                                  }
                                />
                                <span className="text-xs text-muted-foreground w-12 text-left">
                                  {p.isActive ?? true ? "Bật" : "Tắt"}
                                </span>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                                Sửa
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setDeleting(p)}>
                                Xóa
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                page={prizePage}
                totalPages={prizeTotalPages}
                limit={prizeLimit}
                total={prizeTotal}
                onLimitChange={(newLimit) =>
                  navigate({
                    search: (prev: any) => ({ ...prev, prizeLimit: newLimit, prizePage: 1 }),
                  })
                }
                fromRoute={Route.fullPath}
                searchKey="prizePage"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.isLoading || history.isError || historyList.length === 0 ? (
            <DataState
              loading={history.isLoading}
              error={history.error}
              empty={historyList.length === 0}
              emptyText="Chưa có lượt quay"
            />
          ) : (
            <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phần thưởng</TableHead>
                      <TableHead className="text-right">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((h) => (
                      <TableRow key={h.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold text-sm">
                          {h.prize?.name ?? h.prize?.label ?? h.prizeName ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {formatDate(h.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                page={historyPage}
                totalPages={historyTotalPages}
                limit={historyLimit}
                total={historyTotal}
                onLimitChange={(newLimit) =>
                  navigate({
                    search: (prev: any) => ({ ...prev, historyLimit: newLimit, historyPage: 1 }),
                  })
                }
                fromRoute={Route.fullPath}
                searchKey="historyPage"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật phần thưởng" : "Tạo phần thưởng"}</DialogTitle>
            <DialogDescription>Điền thông tin phần thưởng và lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="prize-name">Tên phần thưởng *</Label>
              <Input
                id="prize-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prize-type">Loại</Label>
                <select
                  id="prize-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as PrizeType }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="points">Điểm</option>
                  <option value="turns">Lượt quay</option>
                  <option value="voucher">Voucher</option>
                  <option value="miss">Chúc may mắn</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize-probability">Probability (%) *</Label>
                <Input
                  id="prize-probability"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.probability}
                  onChange={(e) => setForm((prev) => ({ ...prev, probability: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prize-value">Giá trị</Label>
                <Input
                  id="prize-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize-voucher">Voucher</Label>
                <select
                  id="prize-voucher"
                  value={form.voucherId}
                  disabled={form.type !== "voucher"}
                  onChange={(e) => setForm((prev) => ({ ...prev, voucherId: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="">— Chọn voucher —</option>
                  {voucherList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id}{v.title ? ` — ${v.title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 text-sm">
              <span>Kích hoạt</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
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

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phần thưởng?</AlertDialogTitle>
            <AlertDialogDescription>
              Phần thưởng <strong>{deleting?.name ?? deleting?.label}</strong> sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleting || deleteMutation.isPending}
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
