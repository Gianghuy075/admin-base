import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDateShort } from "@/lib/format";
import { Newspaper } from "lucide-react";

export const Route = createFileRoute("/_authed/news")({
  head: () => ({ meta: [{ title: "Tin tức — HappyMall Admin" }] }),
  component: NewsPage,
});

const CATS = [
  { value: "", label: "Tất cả" },
  { value: "promo", label: "Khuyến mãi" },
  { value: "knowledge", label: "Kiến thức" },
] as const;

function NewsPage() {
  const [category, setCategory] = useState("");
  const q = useQuery({
    queryKey: ["news", category],
    queryFn: () => apiFetch<any[]>("/news", { auth: false, query: { category: category || undefined } }),
  });
  const list = q.data?.data ?? [];

  return (
    <div>
      <PageHeader title="Tin tức" subtitle={`${list.length} bài viết`} />

      <div className="flex gap-2 mb-5">
        {CATS.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`h-9 px-4 rounded-full text-sm font-medium transition ${
              category === c.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "bg-card text-foreground border border-border hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((n: any) => (
            <article
              key={n.id}
              className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/9] bg-muted overflow-hidden">
                {n.image || n.thumbnail ? (
                  <img
                    src={n.image ?? n.thumbnail}
                    alt={n.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground">
                    <Newspaper className="size-8" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <span className="inline-flex w-fit px-2 py-0.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
                  {n.category === "promo" ? "Khuyến mãi" : n.category === "knowledge" ? "Kiến thức" : n.category}
                </span>
                <h3 className="font-semibold mt-2 line-clamp-2">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3 flex-1">
                  {n.excerpt ?? n.summary ?? n.description ?? ""}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  {formatDateShort(n.publishedAt ?? n.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}