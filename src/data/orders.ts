export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderRow {
  id: string;
  code?: string;
  payMethod?: string | null;
  note?: string | null;
  status: "placed" | "shipping" | "delivered" | "cancelled" | "returned";
  items?: OrderItem[];
  products?: OrderItem[]; // some fields use products instead of items
  total: number;
  createdAt: string;
  vat?: number;
  cogs?: number;
}

// Generate relative dates so the dashboard charts always show recent data
const now = new Date();
const daysAgo = (num: number) => {
  const d = new Date(now);
  d.setDate(now.getDate() - num);
  return d.toISOString();
};

export const seedOrders: OrderRow[] = [
  {
    id: "ord-1001",
    code: "HM-1001",
    payMethod: "Momo",
    note: "Giao giờ hành chính, gọi trước khi giao",
    status: "delivered",
    items: [
      { productId: "prod-1", name: "Táo Envy Mỹ Size 36", price: 189000, quantity: 2 },
      { productId: "prod-4", name: "Rau Cải Ngọt Hữu Cơ", price: 15000, quantity: 3 }
    ],
    get products() { return this.items; },
    total: 423000,
    createdAt: daysAgo(0), // Today
  },
  {
    id: "ord-1002",
    code: "HM-1002",
    payMethod: "ZaloPay",
    note: "Không lấy đá lạnh",
    status: "placed",
    items: [
      { productId: "prod-2", name: "Nho Mẫu Đơn Hàn Quốc", price: 399000, quantity: 1 }
    ],
    get products() { return this.items; },
    total: 399000,
    createdAt: daysAgo(1), // Yesterday
  },
  {
    id: "ord-1003",
    code: "HM-1003",
    payMethod: "COD",
    note: "",
    status: "placed",
    items: [
      { productId: "prod-3", name: "Cam Sành Hàm Yên", price: 35000, quantity: 5 },
      { productId: "prod-9", name: "Bánh Quy Cosy Marie", price: 24000, quantity: 2 }
    ],
    get products() { return this.items; },
    total: 223000,
    createdAt: daysAgo(1),
  },
  {
    id: "ord-1004",
    code: "HM-1004",
    payMethod: "COD",
    note: "Cổng bảo vệ nhận hộ",
    status: "shipping",
    items: [
      { productId: "prod-6", name: "Thịt Ba Chỉ Bò Mỹ Cắt Lát", price: 260000, quantity: 1 },
      { productId: "prod-8", name: "Sữa Tươi Tiệt Trùng TH True Milk", price: 365000, quantity: 1 }
    ],
    get products() { return this.items; },
    total: 625000,
    createdAt: daysAgo(2),
  },
  {
    id: "ord-1005",
    code: "HM-1005",
    payMethod: "Momo",
    note: "",
    status: "cancelled",
    items: [
      { productId: "prod-1", name: "Táo Envy Mỹ Size 36", price: 189000, quantity: 1 }
    ],
    get products() { return this.items; },
    total: 189000,
    createdAt: daysAgo(3),
  },
  {
    id: "ord-1006",
    code: "HM-1006",
    payMethod: "ZaloPay",
    status: "delivered",
    items: [
      { productId: "prod-2", name: "Nho Mẫu Đơn Hàn Quốc", price: 399000, quantity: 2 },
      { productId: "prod-5", name: "Cà Rốt Đà Lạt", price: 25000, quantity: 2 }
    ],
    get products() { return this.items; },
    total: 848000,
    createdAt: daysAgo(4),
  },
  {
    id: "ord-1007",
    code: "HM-1007",
    payMethod: "COD",
    status: "returned",
    items: [
      { productId: "prod-7", name: "Tôm Thẻ Chân Trắng Tươi", price: 195000, quantity: 1 }
    ],
    get products() { return this.items; },
    total: 195000,
    createdAt: daysAgo(5),
  },
  {
    id: "ord-1008",
    code: "HM-1008",
    payMethod: "Momo",
    status: "delivered",
    items: [
      { productId: "prod-8", name: "Sữa Tươi Tiệt Trùng TH True Milk", price: 365000, quantity: 2 }
    ],
    get products() { return this.items; },
    total: 730000,
    createdAt: daysAgo(6),
  },
  {
    id: "ord-1009",
    code: "HM-1009",
    payMethod: "COD",
    status: "delivered",
    items: [
      { productId: "prod-3", name: "Cam Sành Hàm Yên", price: 35000, quantity: 10 }
    ],
    get products() { return this.items; },
    total: 350000,
    createdAt: daysAgo(8),
  },
  {
    id: "ord-1010",
    code: "HM-1010",
    payMethod: "ZaloPay",
    status: "delivered",
    items: [
      { productId: "prod-1", name: "Táo Envy Mỹ Size 36", price: 189000, quantity: 3 }
    ],
    get products() { return this.items; },
    total: 567000,
    createdAt: daysAgo(10),
  },
];
