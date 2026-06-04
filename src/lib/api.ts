import { db } from "../data/mock-db";

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean; query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<ApiResponse<T>> {
  // Simulate network latency for realistic dashboard loading states
  await sleep(150);

  const { auth = true, query, method = "GET", body } = options;

  // Authentication check
  if (auth && !getToken()) {
    throw new Error("Unauthorized");
  }

  // Parse body if present
  let parsedBody: any = null;
  if (body && typeof body === "string") {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = null;
    }
  }

  try {
    // 1. Auth routes
    if (path === "/auth/login" && method === "POST") {
      const { username, password } = parsedBody || {};
      const staffList = db.staff.getAll();
      const staff = staffList.find(
        (s) => s.username === username.trim() && s.password === password
      );
      if (staff) {
        if (!staff.isActive) {
          return {
            success: false,
            error: "Tài khoản của bạn đã bị khóa",
            data: null as any,
          };
        }
        return {
          success: true,
          data: { token: `mock-token-${staff.username}`, username: staff.username, name: staff.name } as any,
        };
      }
      return {
        success: false,
        error: "Tài khoản hoặc mật khẩu không chính xác",
        data: null as any,
      };
    }

    if (path === "/auth/me" && method === "GET") {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          error: "Unauthorized",
          data: null as any,
        };
      }
      const username = token.replace("mock-token-", "");
      const staffList = db.staff.getAll();
      const staff = staffList.find((s) => s.username === username);
      if (staff) {
        return {
          success: true,
          data: { username: staff.username, name: staff.name, role: staff.role } as any,
        };
      }
      return {
        success: false,
        error: "Unauthorized",
        data: null as any,
      };
    }

    // 2. Stats
    if (path === "/admin/stats" && method === "GET") {
      return {
        success: true,
        data: db.stats.getStats() as any,
      };
    }

    // 2.5. Revenue Report
    if (path === "/admin/revenue-report" && method === "GET") {
      const startDate = query?.startDate ? String(query.startDate) : "";
      const endDate = query?.endDate ? String(query.endDate) : "";
      const channel = query?.channel ? String(query.channel) : "all";
      
      const report = db.revenue.report(startDate, endDate, channel);
      return {
        success: true,
        data: report as any,
      };
    }

    // 3. Categories routes
    if (path === "/categories") {
      if (method === "GET") {
        return {
          success: true,
          data: db.categories.getAll() as any,
        };
      }
      if (method === "POST") {
        return {
          success: true,
          data: db.categories.add(parsedBody) as any,
        };
      }
    }

    if (path.startsWith("/categories/")) {
      const id = path.split("/").pop() || "";
      if (method === "PATCH") {
        return {
          success: true,
          data: db.categories.update(id, parsedBody) as any,
        };
      }
      if (method === "DELETE") {
        db.categories.delete(id);
        return {
          success: true,
          data: { id } as any,
        };
      }
    }

    // 4. Products routes
    if (path === "/products") {
      if (method === "GET") {
        const search = String(query?.search ?? "");
        const categoryId = String(query?.categoryId ?? "");
        const page = Number(query?.page ?? 1);
        const limit = Number(query?.limit ?? 20);
        const res = db.products.query(search, categoryId, page, limit);
        return {
          success: true,
          data: res.data as any,
          meta: res.meta,
        };
      }
      if (method === "POST") {
        return {
          success: true,
          data: db.products.add(parsedBody) as any,
        };
      }
    }

    if (path.startsWith("/products/")) {
      const id = path.split("/").pop() || "";
      if (method === "GET") {
        return {
          success: true,
          data: db.products.get(id) as any,
        };
      }
      if (method === "PATCH") {
        return {
          success: true,
          data: db.products.update(id, parsedBody) as any,
        };
      }
      if (method === "DELETE") {
        db.products.delete(id);
        return {
          success: true,
          data: { id } as any,
        };
      }
    }

    // 5. Vouchers routes
    if (path === "/vouchers") {
      if (method === "GET") {
        return {
          success: true,
          data: db.vouchers.getAll() as any,
        };
      }
    }

    if (path === "/vouchers/admin" && method === "POST") {
      return {
        success: true,
        data: db.vouchers.add(parsedBody) as any,
      };
    }

    if (path.startsWith("/vouchers/admin/")) {
      const id = path.split("/").pop() || "";
      if (method === "PATCH") {
        return {
          success: true,
          data: db.vouchers.update(id, parsedBody) as any,
        };
      }
      if (method === "DELETE") {
        db.vouchers.delete(id);
        return {
          success: true,
          data: { id } as any,
        };
      }
    }

    // 6. Users routes
    if (path === "/users/admin" && method === "GET") {
      const search = String(query?.search ?? "");
      const page = Number(query?.page ?? 1);
      const limit = Number(query?.limit ?? 20);
      const res = db.users.query(search, page, limit);
      return {
        success: true,
        data: res.data as any,
        meta: res.meta,
      };
    }

    if (path.startsWith("/users/admin/")) {
      const id = path.split("/").pop() || "";
      if (method === "PATCH") {
        return {
          success: true,
          data: db.users.update(id, parsedBody) as any,
        };
      }
    }

    // 6.5. Staff routes
    if (path === "/staff/admin" && method === "GET") {
      const search = String(query?.search ?? "");
      const page = Number(query?.page ?? 1);
      const limit = Number(query?.limit ?? 20);
      const res = db.staff.query(search, page, limit);
      return {
        success: true,
        data: res.data as any,
        meta: res.meta,
      };
    }

    if (path === "/staff/admin" && method === "POST") {
      return {
        success: true,
        data: db.staff.add(parsedBody) as any,
      };
    }

    if (path.startsWith("/staff/admin/")) {
      const id = path.split("/").pop() || "";
      if (method === "PATCH") {
        return {
          success: true,
          data: db.staff.update(id, parsedBody) as any,
        };
      }
      if (method === "DELETE") {
        db.staff.delete(id);
        return {
          success: true,
          data: { id } as any,
        };
      }
    }

    // 7. News routes
    if (path === "/news") {
      if (method === "GET") {
        const category = query?.category ? String(query.category) : undefined;
        return {
          success: true,
          data: db.news.query(category) as any,
        };
      }
      if (method === "POST") {
        return {
          success: true,
          data: db.news.add(parsedBody) as any,
        };
      }
    }

    if (path.startsWith("/news/")) {
      const id = path.split("/").pop() || "";
      if (method === "PATCH") {
        return {
          success: true,
          data: db.news.update(id, parsedBody) as any,
        };
      }
      if (method === "DELETE") {
        db.news.delete(id);
        return {
          success: true,
          data: { id } as any,
        };
      }
    }

    // 8. Orders routes
    if (path === "/orders/admin/all" && method === "GET") {
      const status = String(query?.status ?? "");
      const page = Number(query?.page ?? 1);
      const limit = Number(query?.limit ?? 15);
      const res = db.orders.query(status, page, limit);
      return {
        success: true,
        data: res.data as any,
        meta: res.meta,
      };
    }

    if (path.startsWith("/orders/admin/") && path.endsWith("/status")) {
      // Format is `/orders/admin/:id/status`
      const segments = path.split("/");
      const id = segments[segments.length - 2];
      if (method === "PATCH") {
        return {
          success: true,
          data: db.orders.updateStatus(id, parsedBody.status) as any,
        };
      }
    }

    // 9. Wheel routes
    if (path === "/wheel/admin/prizes") {
      if (method === "GET") {
        return {
          success: true,
          data: db.wheel.getPrizes() as any,
        };
      }
      if (method === "POST") {
        return {
          success: true,
          data: db.wheel.addPrize(parsedBody) as any,
        };
      }
    }

    if (path.startsWith("/wheel/admin/prizes/")) {
      const id = path.split("/").pop() || "";
      if (method === "PATCH") {
        return {
          success: true,
          data: db.wheel.updatePrize(id, parsedBody) as any,
        };
      }
      if (method === "DELETE") {
        db.wheel.deletePrize(id);
        return {
          success: true,
          data: { id } as any,
        };
      }
    }

    if (path === "/wheel/history" && method === "GET") {
      return {
        success: true,
        data: db.wheel.getHistory() as any,
      };
    }

    // 10. POS Orders routes
    if (path === "/pos-orders") {
      if (method === "GET") {
        const search = String(query?.search ?? "");
        const page = Number(query?.page ?? 1);
        const limit = Number(query?.limit ?? 15);
        const res = db.posOrders.query(search, page, limit);
        return {
          success: true,
          data: res.data as any,
          meta: res.meta,
        };
      }
      if (method === "POST") {
        return {
          success: true,
          data: db.posOrders.add(parsedBody) as any,
        };
      }
    }

    if (path.startsWith("/pos-orders/")) {
      const id = path.split("/").pop() || "";
      if (method === "PATCH") {
        return {
          success: true,
          data: db.posOrders.update(id, parsedBody) as any,
        };
      }
      if (method === "DELETE") {
        db.posOrders.delete(id);
        return {
          success: true,
          data: { id } as any,
        };
      }
    }

    // 11. Stock Movements routes
    if (path === "/stock-movements") {
      if (method === "GET") {
        return {
          success: true,
          data: db.stockMovements.getAll() as any,
        };
      }
      if (method === "POST") {
        return {
          success: true,
          data: db.stockMovements.add(parsedBody) as any,
        };
      }
    }

    throw new Error(`Endpoint not mocked: ${method} ${path}`);
  } catch (error: any) {
    return {
      success: false,
      data: null as any,
      error: error?.message || "Internal server error in mock API",
    };
  }
}
