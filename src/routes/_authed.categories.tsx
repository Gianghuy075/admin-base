import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { Tag } from "lucide-react";

export const Route = createFileRoute("/_authed/categories")({
  head: () => ({ meta: [{ title: "Danh mục — HappyMall Admin" }] }),
  component: CategoriesPage,
});

const PASTELS = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

function CategoriesPage() {
  const q = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<any[]>("/categories", { auth: false }),
  });
  const list = q.data?.data ?? [];

  return (
    <div>
      <PageHeader title="Danh mục" subtitle={`${list.length} danh mục`} />

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {list.map((c: any, idx: number) => (
            <div
              key={c.id}
              className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-4 flex flex-col items-center text-center gap-3"
            >
              <div
                className={`size-16 rounded-2xl grid place-items-center ${PASTELS[idx % PASTELS.length]}`}
              >
                {c.icon || c.image ? (
                  <img src={c.icon ?? c.image} alt={c.name} className="size-10 object-contain" />
                ) : (
                  <Tag className="size-7" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                {c.productCount != null && (
                  <p className="text-xs text-muted-foreground">
                    {c.productCount} sp
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}