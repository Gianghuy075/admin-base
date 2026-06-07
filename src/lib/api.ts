const DEFAULT_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";
export const API_BASE = DEFAULT_BASE.replace(/\/$/, "");

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hm_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("hm_token", token);
  else localStorage.removeItem("hm_token");
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; page: number; limit: number };
  error?: string;
  statusCode?: number;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean; query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<ApiResponse<T>> {
  const { auth = true, query, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string> ?? {}),
  };

  if (auth) {
    const token = getToken();
    if (!token) throw new Error("Unauthorized");
    headers["Authorization"] = `Bearer ${token}`;
  }

  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  try {
    const res = await fetch(url, { ...fetchOptions, headers });

    let json: any;
    try {
      json = await res.json();
    } catch {
      return { success: false, data: null as any, error: "Invalid JSON response" };
    }

    if (!res.ok) {
      return {
        success: false,
        data: null as any,
        error: json?.message ?? json?.error ?? `HTTP ${res.status}`,
        statusCode: res.status,
      };
    }

    // API wraps in { success, data, meta? }
    if (typeof json === "object" && json !== null && "success" in json) {
      return json as ApiResponse<T>;
    }

    return { success: true, data: json as T };
  } catch (err: any) {
    return {
      success: false,
      data: null as any,
      error: err?.message ?? "Network error",
    };
  }
}
