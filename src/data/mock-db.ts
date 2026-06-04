import { seedCategories, CategoryItem } from "./categories";
import { seedProducts, ProductItem } from "./products";
import { seedVouchers, VoucherItem } from "./vouchers";
import { seedUsers, UserItem } from "./users";
import { seedStaff, StaffItem } from "./staff";
import { seedNews, NewsItem } from "./news";
import { seedOrders, OrderRow } from "./orders";
import { seedPrizes, seedWheelHistory, WheelPrize, WheelHistoryItem } from "./wheel";
import { seedPosOrders, PosOrderRow } from "./pos-orders";
import { seedStockMovements, StockMovement } from "./stock-movements";

// Safe localStorage access
const isClient = typeof window !== "undefined";

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  const val = localStorage.getItem(key);
  if (!val) return defaultValue;
  try {
    return JSON.parse(val) as T;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Initial storage setup
export function initMockDb() {
  if (!isClient) return;
  if (!localStorage.getItem("hm_mock_categories")) {
    setStorageItem("hm_mock_categories", seedCategories);
  }
  if (!localStorage.getItem("hm_mock_products")) {
    setStorageItem("hm_mock_products", seedProducts);
  }
  if (!localStorage.getItem("hm_mock_vouchers")) {
    setStorageItem("hm_mock_vouchers", seedVouchers);
  }
  if (!localStorage.getItem("hm_mock_users")) {
    setStorageItem("hm_mock_users", seedUsers);
  }
  if (!localStorage.getItem("hm_mock_staff")) {
    setStorageItem("hm_mock_staff", seedStaff);
  }
  if (!localStorage.getItem("hm_mock_news")) {
    setStorageItem("hm_mock_news", seedNews);
  }
  if (!localStorage.getItem("hm_mock_orders")) {
    setStorageItem("hm_mock_orders", seedOrders);
  }
  if (!localStorage.getItem("hm_mock_prizes")) {
    setStorageItem("hm_mock_prizes", seedPrizes);
  }
  if (!localStorage.getItem("hm_mock_wheel_history")) {
    setStorageItem("hm_mock_wheel_history", seedWheelHistory);
  }
  if (!localStorage.getItem("hm_mock_pos_orders")) {
    setStorageItem("hm_mock_pos_orders", seedPosOrders);
  }
  if (!localStorage.getItem("hm_mock_stock_movements")) {
    setStorageItem("hm_mock_stock_movements", seedStockMovements);
  }
}

// Helper generators
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// DB CRUD API

export const db = {
  // Categories
  categories: {
    getAll(): CategoryItem[] {
      initMockDb();
      const categories = getStorageItem<CategoryItem[]>("hm_mock_categories", seedCategories);
      const products = getStorageItem<ProductItem[]>("hm_mock_products", seedProducts);
      
      // Enrich categories with productCount
      return categories.map((cat) => ({
        ...cat,
        productCount: products.filter((p) => p.categoryId === cat.id).length,
      }));
    },
    add(item: Omit<CategoryItem, "id">): CategoryItem {
      const list = this.getAll();
      const newItem = { ...item, id: `cat-${generateId()}` };
      list.push(newItem);
      setStorageItem("hm_mock_categories", list);
      return newItem;
    },
    update(id: string, item: Partial<CategoryItem>): CategoryItem {
      const list = this.getAll();
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Category not found");
      const updated = { ...list[idx], ...item };
      list[idx] = updated;
      setStorageItem("hm_mock_categories", list);
      return updated;
    },
    delete(id: string): void {
      const list = this.getAll();
      const filtered = list.filter((c) => c.id !== id);
      setStorageItem("hm_mock_categories", filtered);
    },
  },

  // Products
  products: {
    getAll(): ProductItem[] {
      initMockDb();
      return getStorageItem<ProductItem[]>("hm_mock_products", seedProducts);
    },
    query(search = "", categoryId = "", page = 1, limit = 20) {
      const all = this.getAll();
      const term = search.trim().toLowerCase();
      
      const filtered = all.filter((p) => {
        const matchesSearch = !term || p.name.toLowerCase().includes(term);
        const matchesCategory = !categoryId || p.categoryId === categoryId;
        return matchesSearch && matchesCategory;
      });

      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        data: paginated,
        meta: { total, page, limit },
      };
    },
    get(id: string): ProductItem {
      const all = this.getAll();
      const found = all.find((p) => p.id === id);
      if (!found) throw new Error("Product not found");
      return found;
    },
    add(item: Omit<ProductItem, "id">): ProductItem {
      const list = this.getAll();
      const newItem = { ...item, id: `prod-${generateId()}` };
      list.push(newItem);
      setStorageItem("hm_mock_products", list);
      return newItem;
    },
    update(id: string, item: Partial<ProductItem>): ProductItem {
      const list = this.getAll();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Product not found");
      const updated = { ...list[idx], ...item };
      list[idx] = updated;
      setStorageItem("hm_mock_products", list);
      return updated;
    },
    delete(id: string): void {
      const list = this.getAll();
      const filtered = list.filter((p) => p.id !== id);
      setStorageItem("hm_mock_products", filtered);
    },
  },

  // Vouchers
  vouchers: {
    getAll(): VoucherItem[] {
      initMockDb();
      return getStorageItem<VoucherItem[]>("hm_mock_vouchers", seedVouchers);
    },
    add(item: VoucherItem): VoucherItem {
      const list = this.getAll();
      const newItem = { 
        ...item, 
        id: item.id || item.code || `VO-${generateId().toUpperCase()}`,
        remaining: item.totalLimit ?? null,
        usedCount: 0,
      };
      list.push(newItem);
      setStorageItem("hm_mock_vouchers", list);
      return newItem;
    },
    update(id: string, item: Partial<VoucherItem>): VoucherItem {
      const list = this.getAll();
      const idx = list.findIndex((v) => v.id === id);
      if (idx === -1) throw new Error("Voucher not found");
      const updated = { ...list[idx], ...item };
      list[idx] = updated;
      setStorageItem("hm_mock_vouchers", list);
      return updated;
    },
    delete(id: string): void {
      const list = this.getAll();
      const filtered = list.filter((v) => v.id !== id);
      setStorageItem("hm_mock_vouchers", filtered);
    },
  },

  // Users
  users: {
    getAll(): UserItem[] {
      initMockDb();
      return getStorageItem<UserItem[]>("hm_mock_users", seedUsers);
    },
    query(search = "", page = 1, limit = 20) {
      const all = this.getAll();
      const term = search.trim().toLowerCase();

      const filtered = all.filter((u) => {
        if (!term) return true;
        return (
          (u.name ?? "").toLowerCase().includes(term) ||
          (u.phone ?? "").toLowerCase().includes(term) ||
          (u.zaloId ?? "").toLowerCase().includes(term)
        );
      });

      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        data: paginated,
        meta: { total, page, limit },
      };
    },
    update(id: string, item: Partial<UserItem>): UserItem {
      const list = this.getAll();
      const idx = list.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("User not found");
      const updated = { ...list[idx], ...item };
      list[idx] = updated;
      setStorageItem("hm_mock_users", list);
      return updated;
    },
  },

  // Staff
  staff: {
    getAll(): StaffItem[] {
      initMockDb();
      return getStorageItem<StaffItem[]>("hm_mock_staff", seedStaff);
    },
    query(search = "", page = 1, limit = 20) {
      const all = this.getAll();
      const term = search.trim().toLowerCase();

      const filtered = all.filter((s) => {
        if (!term) return true;
        return (
          s.name.toLowerCase().includes(term) ||
          s.username.toLowerCase().includes(term)
        );
      });

      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        data: paginated,
        meta: { total, page, limit },
      };
    },
    add(item: Omit<StaffItem, "id" | "createdAt">): StaffItem {
      const list = this.getAll();
      if (list.some((s) => s.username === item.username)) {
        throw new Error("Tài khoản đã tồn tại");
      }
      const newItem: StaffItem = {
        ...item,
        id: `staff-${generateId()}`,
        createdAt: new Date().toISOString(),
      };
      list.push(newItem);
      setStorageItem("hm_mock_staff", list);
      return newItem;
    },
    update(id: string, item: Partial<StaffItem>): StaffItem {
      const list = this.getAll();
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error("Không tìm thấy nhân viên");
      
      if (item.username && item.username !== list[idx].username) {
        if (list.some((s) => s.username === item.username)) {
          throw new Error("Tài khoản đã tồn tại");
        }
      }

      const cleanItem = { ...item };
      if (cleanItem.password === "") {
        delete cleanItem.password;
      }

      const updated = { ...list[idx], ...cleanItem };
      list[idx] = updated;
      setStorageItem("hm_mock_staff", list);
      return updated;
    },
    delete(id: string): void {
      const list = this.getAll();
      const staff = list.find((s) => s.id === id);
      if (staff && staff.username === "admin") {
        throw new Error("Không thể xóa tài khoản admin mặc định");
      }
      const filtered = list.filter((s) => s.id !== id);
      setStorageItem("hm_mock_staff", filtered);
    },
  },

  // News
  news: {
    getAll(): NewsItem[] {
      initMockDb();
      return getStorageItem<NewsItem[]>("hm_mock_news", seedNews);
    },
    query(category?: string) {
      const all = this.getAll();
      let filtered = all;
      if (category) {
        filtered = all.filter((n) => n.category === category);
      }
      return filtered.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    },
    add(item: Omit<NewsItem, "id"> & { id?: string }): NewsItem {
      const list = this.getAll();
      const newItem = { 
        ...item, 
        id: item.id || `news-${generateId()}`, 
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString() 
      };
      list.push(newItem);
      setStorageItem("hm_mock_news", list);
      return newItem;
    },
    update(id: string, item: Partial<NewsItem>): NewsItem {
      const list = this.getAll();
      const idx = list.findIndex((n) => n.id === id);
      if (idx === -1) throw new Error("Article not found");
      const updated = { ...list[idx], ...item };
      list[idx] = updated;
      setStorageItem("hm_mock_news", list);
      return updated;
    },
    delete(id: string): void {
      const list = this.getAll();
      const filtered = list.filter((n) => n.id !== id);
      setStorageItem("hm_mock_news", filtered);
    },
  },

  // Online Orders
  orders: {
    getAll(): OrderRow[] {
      initMockDb();
      const list = getStorageItem<OrderRow[]>("hm_mock_orders", seedOrders);
      const products = getStorageItem<ProductItem[]>("hm_mock_products", seedProducts);
      return list.map((o) => {
        let vat = o.vat;
        let cogs = o.cogs;
        if (vat === undefined || cogs === undefined) {
          vat = 0;
          cogs = 0;
          const items = o.items || o.products || [];
          items.forEach((item: any) => {
            const prod = products.find((p) => p.id === item.productId);
            const taxRate = prod?.taxRate ?? 10;
            const importPrice = prod?.importPrice ?? Math.round((prod?.price ?? item.price) * 0.6);
            const itemTotal = item.price * item.quantity;
            vat += (itemTotal * taxRate) / (100 + taxRate);
            cogs += importPrice * item.quantity;
          });
          vat = Math.round(vat);
          cogs = Math.round(cogs);
        }
        return { ...o, vat, cogs };
      });
    },
    query(status = "", page = 1, limit = 15) {
      const all = this.getAll();
      
      const filtered = all.filter((o) => {
        return !status || o.status === status;
      });

      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        data: paginated,
        meta: { total, page, limit },
      };
    },
    updateStatus(id: string, status: OrderRow["status"]): OrderRow {
      const list = this.getAll();
      const idx = list.findIndex((o) => o.id === id);
      if (idx === -1) throw new Error("Order not found");
      const updated = { ...list[idx], status };
      list[idx] = updated;
      setStorageItem("hm_mock_orders", list);
      return updated;
    },
  },

  // POS Orders (Counter retail orders)
  posOrders: {
    getAll(): PosOrderRow[] {
      initMockDb();
      const list = getStorageItem<PosOrderRow[]>("hm_mock_pos_orders", seedPosOrders);
      const products = getStorageItem<ProductItem[]>("hm_mock_products", seedProducts);
      return list.map((o) => {
        let vat = o.vat;
        let cogs = o.cogs;
        if (vat === undefined || cogs === undefined) {
          vat = 0;
          cogs = 0;
          const items = o.items || [];
          items.forEach((item: any) => {
            const prod = products.find((p) => p.id === item.productId);
            const taxRate = prod?.taxRate ?? 10;
            const importPrice = prod?.importPrice ?? Math.round((prod?.price ?? item.price) * 0.6);
            const itemTotal = item.price * item.quantity;
            vat += (itemTotal * taxRate) / (100 + taxRate);
            cogs += importPrice * item.quantity;
          });
          vat = Math.round(vat);
          cogs = Math.round(cogs);
        }
        return { ...o, vat, cogs };
      });
    },
    query(search = "", page = 1, limit = 15) {
      const all = this.getAll();
      const term = search.trim().toLowerCase();

      const filtered = all.filter((o) => {
        if (!term) return true;
        return (
          o.code.toLowerCase().includes(term) ||
          (o.customerName ?? "").toLowerCase().includes(term) ||
          (o.customerPhone ?? "").toLowerCase().includes(term) ||
          o.shippingProvider.toLowerCase().includes(term)
        );
      });

      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        data: paginated,
        meta: { total, page, limit },
      };
    },
    add(item: Omit<PosOrderRow, "id" | "code" | "createdAt" | "total"> & { items: { productId: string; quantity: number }[] }): PosOrderRow {
      const list = this.getAll();
      
      // Calculate order code incrementing the last code number
      let nextNum = 1001;
      if (list.length > 0) {
        const codes = list.map((o) => parseInt(o.code.replace("POS-", ""), 10)).filter(Number.isFinite);
        if (codes.length > 0) {
          nextNum = Math.max(...codes) + 1;
        }
      }
      const code = `POS-${nextNum}`;

      // Loop through items to get name/price and decrease product stock in warehouse
      const products = getStorageItem<ProductItem[]>("hm_mock_products", seedProducts);
      const enrichedItems: any[] = [];
      let total = 0;
      let vat = 0;
      let cogs = 0;

      item.items.forEach((ordItem) => {
        const prod = products.find((p) => p.id === ordItem.productId);
        if (!prod) throw new Error(`Sản phẩm với ID ${ordItem.productId} không tồn tại`);
        
        // Deduct stock
        const requestedQty = Number(ordItem.quantity);
        const currentStock = prod.stock ?? 0;
        if (currentStock < requestedQty) {
          throw new Error(`Sản phẩm "${prod.name}" không đủ số lượng trong kho (Còn: ${currentStock}, Yêu cầu: ${requestedQty})`);
        }
        prod.stock = currentStock - requestedQty;

        const subtotal = prod.price * requestedQty;
        total += subtotal;

        // Calculate tax and import cost
        const taxRate = prod.taxRate ?? 10;
        const itemVat = Math.round((subtotal * taxRate) / (100 + taxRate));
        vat += itemVat;

        const importPrice = prod.importPrice ?? Math.round(prod.price * 0.6);
        cogs += importPrice * requestedQty;

        enrichedItems.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: requestedQty,
        });
      });

      // Save updated products stock
      setStorageItem("hm_mock_products", products);

      // Automatically create a stock movement of type "out" (Xuất kho)
      const movements = getStorageItem<StockMovement[]>("hm_mock_stock_movements", seedStockMovements);
      const detailStr = enrichedItems.map((i) => `${i.name} (x${i.quantity})`).join(", ");
      const newMovement: any = {
        id: `sm-${generateId()}`,
        code: `XK-${code}`,
        type: "out",
        createdAt: new Date().toISOString(),
        createdBy: "Hệ thống (POS)",
        details: detailStr, // details extension helper
      };
      movements.push(newMovement);
      setStorageItem("hm_mock_stock_movements", movements);

      // Create new POS Order
      const newOrder: PosOrderRow = {
        id: `pos-${generateId()}`,
        code,
        customerName: item.customerName || "Khách vãng lai",
        customerPhone: item.customerPhone || "",
        shippingProvider: item.shippingProvider || "Khách tự mang về",
        items: enrichedItems,
        total,
        vat,
        cogs,
        status: item.status || "completed",
        createdAt: new Date().toISOString(),
      };

      list.push(newOrder);
      setStorageItem("hm_mock_pos_orders", list);
      return newOrder;
    },
    update(id: string, item: Partial<PosOrderRow>): PosOrderRow {
      const list = this.getAll();
      const idx = list.findIndex((o) => o.id === id);
      if (idx === -1) throw new Error("Không tìm thấy đơn hàng");
      const updated = { ...list[idx], ...item };
      list[idx] = updated;
      setStorageItem("hm_mock_pos_orders", list);
      return updated;
    },
    delete(id: string): void {
      const list = this.getAll();
      const filtered = list.filter((o) => o.id !== id);
      setStorageItem("hm_mock_pos_orders", filtered);
    },
  },

  // Stock Movements
  stockMovements: {
    getAll(): (StockMovement & { details?: string })[] {
      initMockDb();
      return getStorageItem<any[]>("hm_mock_stock_movements", seedStockMovements);
    },
    add(item: Omit<StockMovement, "id" | "createdAt"> & { productId?: string; quantity?: number; details?: string; price?: number }): StockMovement {
      const list = this.getAll();
      
      let details = item.details || "";
      let price = item.price;
      let totalValue = 0;
      
      // If a product and quantity were manually selected, adjust the stock
      if (item.productId && item.quantity) {
        const qty = Number(item.quantity);
        const products = getStorageItem<ProductItem[]>("hm_mock_products", seedProducts);
        const prodIdx = products.findIndex((p) => p.id === item.productId);
        
        if (prodIdx !== -1) {
          const prod = products[prodIdx];
          const oldStock = prod.stock ?? 0;
          if (item.type === "in") {
            prod.stock = oldStock + qty;
          } else {
            if (oldStock < qty) {
              throw new Error(`Kho không đủ hàng để xuất (Còn: ${oldStock}, Yêu cầu: ${qty})`);
            }
            prod.stock = oldStock - qty;
          }
          details = `${prod.name} (x${qty})`;
          
          if (!price) {
            price = item.type === "in" ? (prod.importPrice ?? Math.round(prod.price * 0.6)) : prod.price;
          }
          totalValue = price * qty;
          
          setStorageItem("hm_mock_products", products);
        }
      }

      const newMovement: StockMovement = {
        ...item,
        id: `sm-${generateId()}`,
        createdAt: new Date().toISOString(),
        details: details || undefined,
        price,
        totalValue: totalValue || undefined,
      };

      list.push(newMovement);
      setStorageItem("hm_mock_stock_movements", list);
      return newMovement;
    },
  },

  // Revenue Report
  revenue: {
    report(startDateStr = "", endDateStr = "", channel = "all") {
      const products = getStorageItem<ProductItem[]>("hm_mock_products", seedProducts);
      const onlineOrders = getStorageItem<OrderRow[]>("hm_mock_orders", seedOrders);
      const posOrders = getStorageItem<PosOrderRow[]>("hm_mock_pos_orders", seedPosOrders);
      
      const allMergedOrders: any[] = [];
      
      const enrichAndPush = (o: any, sourceChannel: "POS" | "Online") => {
        if (sourceChannel === "Online" && (o.status === "cancelled" || o.status === "returned")) return;
        if (sourceChannel === "POS" && o.status === "cancelled") return;

        const orderDateStr = o.createdAt.slice(0, 10);
        if (startDateStr && orderDateStr < startDateStr) return;
        if (endDateStr && orderDateStr > endDateStr) return;
        
        let vat = o.vat;
        let cogs = o.cogs;
        
        if (vat === undefined || cogs === undefined) {
          vat = 0;
          cogs = 0;
          const items = o.items || o.products || [];
          items.forEach((item: any) => {
            const prod = products.find((p) => p.id === item.productId);
            const taxRate = prod?.taxRate ?? 10;
            const importPrice = prod?.importPrice ?? Math.round((prod?.price ?? item.price) * 0.6);
            
            const itemTotal = item.price * item.quantity;
            vat += (itemTotal * taxRate) / (100 + taxRate);
            cogs += importPrice * item.quantity;
          });
          vat = Math.round(vat);
          cogs = Math.round(cogs);
        }

        allMergedOrders.push({
          id: o.id,
          code: o.code || `ONL-${o.id.slice(-6).toUpperCase()}`,
          channel: sourceChannel,
          customerName: o.customerName || o.name || "Khách hàng Online",
          customerPhone: o.customerPhone || o.phone || "",
          total: o.total,
          vat,
          netSales: o.total - vat,
          cogs,
          actualRevenue: o.total - vat - cogs,
          createdAt: o.createdAt,
        });
      };

      if (channel === "all" || channel === "Online") {
        onlineOrders.forEach((o) => enrichAndPush(o, "Online"));
      }
      if (channel === "all" || channel === "POS") {
        posOrders.forEach((o) => enrichAndPush(o, "POS"));
      }

      allMergedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const summary = allMergedOrders.reduce(
        (acc, o) => {
          acc.grossSales += o.total;
          acc.vatCollected += o.vat;
          acc.netSales += o.netSales;
          acc.cogs += o.cogs;
          acc.actualProfit += o.actualRevenue;
          return acc;
        },
        { grossSales: 0, vatCollected: 0, netSales: 0, cogs: 0, actualProfit: 0 }
      );

      return {
        summary,
        transactions: allMergedOrders,
      };
    }
  },

  // Wheel Prizes and History
  wheel: {
    getPrizes(): WheelPrize[] {
      initMockDb();
      return getStorageItem<WheelPrize[]>("hm_mock_prizes", seedPrizes);
    },
    addPrize(item: Omit<WheelPrize, "id">): WheelPrize {
      const list = this.getPrizes();
      const newItem = { ...item, id: `prize-${generateId()}` };
      list.push(newItem);
      setStorageItem("hm_mock_prizes", list);
      return newItem;
    },
    updatePrize(id: string, item: Partial<WheelPrize>): WheelPrize {
      const list = this.getPrizes();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Prize not found");
      const updated = { ...list[idx], ...item };
      list[idx] = updated;
      setStorageItem("hm_mock_prizes", list);
      return updated;
    },
    deletePrize(id: string): void {
      const list = this.getPrizes();
      const filtered = list.filter((p) => p.id !== id);
      setStorageItem("hm_mock_prizes", filtered);
    },
    getHistory(): WheelHistoryItem[] {
      initMockDb();
      return getStorageItem<WheelHistoryItem[]>("hm_mock_wheel_history", seedWheelHistory);
    },
  },

  // Dynamic Dashboard Stats
  stats: {
    getStats() {
      const products = db.products.getAll();
      const categories = db.categories.getAll();
      const onlineOrders = db.orders.getAll();
      const posOrders = db.posOrders.getAll();
      const users = db.users.getAll();
      const vouchers = db.vouchers.getAll();

      // Counts
      const counts = {
        products: products.length,
        categories: categories.length,
        orders: onlineOrders.length + posOrders.length, // sum online + pos
        users: users.length,
        vouchers: vouchers.length,
      };

      // Total Revenue (exclude cancelled / returned)
      const validOnlineOrders = onlineOrders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
      const validPosOrders = posOrders.filter((o) => o.status !== "cancelled");
      
      const totalRevenue = 
        validOnlineOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
        validPosOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Recent Orders (last 8)
      const allMergedOrders: any[] = [];
      onlineOrders.forEach((o) => {
        allMergedOrders.push({
          id: o.code || o.id,
          status: o.status,
          total: o.total,
          payMethod: o.payMethod ? `${o.payMethod} (Online)` : "Online",
          createdAt: o.createdAt,
        });
      });
      posOrders.forEach((o) => {
        allMergedOrders.push({
          id: o.code,
          status: o.status === "completed" ? "paid" : o.status, // normalise for dashboard status badge
          total: o.total,
          payMethod: "Tại quầy (POS)",
          createdAt: o.createdAt,
        });
      });

      const sortedOrders = allMergedOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const recentOrders = sortedOrders.slice(0, 8);

      // Orders by Status
      const statusMap: Record<string, number> = {};
      onlineOrders.forEach((o) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      posOrders.forEach((o) => {
        const s = o.status === "completed" ? "paid" : o.status;
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
      }));

      // Revenue by Day (last 14 days)
      const revMap: Record<string, { total: number; count: number }> = {};
      
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        revMap[dateStr] = { total: 0, count: 0 };
      }

      validOnlineOrders.forEach((o) => {
        const dateStr = new Date(o.createdAt).toISOString().slice(0, 10);
        if (revMap[dateStr] !== undefined) {
          revMap[dateStr].total += o.total;
          revMap[dateStr].count += 1;
        }
      });
      
      validPosOrders.forEach((o) => {
        const dateStr = new Date(o.createdAt).toISOString().slice(0, 10);
        if (revMap[dateStr] !== undefined) {
          revMap[dateStr].total += o.total;
          revMap[dateStr].count += 1;
        }
      });

      const revenueByDay = Object.entries(revMap).map(([date, data]) => ({
        date,
        total: data.total,
        count: data.count,
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Top Products (aggregate from both)
      const prodSales: Record<string, { name: string; qty: number; revenue: number }> = {};
      
      const aggregateItems = (items: any[]) => {
        items.forEach((item) => {
          if (!prodSales[item.productId]) {
            prodSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
          }
          prodSales[item.productId].qty += item.quantity;
          prodSales[item.productId].revenue += item.price * item.quantity;
        });
      };

      validOnlineOrders.forEach((o) => aggregateItems(o.items || o.products || []));
      validPosOrders.forEach((o) => aggregateItems(o.items || []));

      const topProducts = Object.entries(prodSales)
        .map(([productId, data]) => ({
          productId,
          name: data.name,
          qty: data.qty,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 7);

      if (topProducts.length === 0) {
        products.slice(0, 5).forEach((p, idx) => {
          topProducts.push({
            productId: p.id,
            name: p.name,
            qty: 12 - idx * 2,
            revenue: p.price * (12 - idx * 2),
          });
        });
      }

      return {
        counts,
        totalRevenue,
        recentOrders,
        ordersByStatus,
        revenueByDay,
        topProducts,
      };
    },
  },
};
