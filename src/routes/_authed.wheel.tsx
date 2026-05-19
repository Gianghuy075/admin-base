import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { Gift, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authed/wheel")({
  head: () => ({ meta: [{ title: "Vòng quay — HappyMall Admin" }] }),
  component: WheelPage,
});

function WheelPage() {
  const prizes = useQuery({
    queryKey: ["wheel-prizes"],
    queryFn: () => apiFetch<any[]>("/wheel/prizes"),
  });
  const history = useQuery({
    queryKey: ["wheel-history"],
    queryFn: () => apiFetch<any[]>("/wheel/history"),
  });

  const list = prizes.data?.data ?? [];
  const hist = history.data?.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Phần thưởng vòng quay" subtitle={`${list.length} phần thưởng`} />
        {prizes.isLoading || prizes.isError || list.length === 0 ? (
          <DataState loading={prizes.isLoading} error={prizes.error} empty={list.length === 0} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {list.map((p: any) => (
              <div
                key={p.id}
                className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-4 text-center"
              >
                <div className="size-14 mx-auto rounded-2xl bg-accent text-accent-foreground grid place-items-center mb-3">
                  <Gift className="size-7" />
                </div>
                <p className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                  {p.name ?? p.label ?? p.type}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tỷ lệ: {Number(p.probability ?? 0)}%
                </p>
                {p.value != null && (
                  <p className="text-primary font-bold mt-1">{p.value}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Lịch sử quay
            </h2>
            <p className="text-sm text-muted-foreground">Của tài khoản hiện tại</p>
          </div>
        </div>
        {history.isLoading || history.isError || hist.length === 0 ? (
          <DataState loading={history.isLoading} error={history.error} empty={hist.length === 0} emptyText="Chưa có lượt quay" />
        ) : (
          <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3">Phần thưởng</th>
                  <th className="text-left px-6 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {hist.map((h: any) => (
                  <tr key={h.id} className="border-t border-border">
                    <td className="px-6 py-3 font-medium">
                      {h.prize?.name ?? h.prizeName ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(h.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}