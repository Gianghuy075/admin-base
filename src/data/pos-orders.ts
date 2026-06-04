export interface PosOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PosOrderRow {
  id: string;
  code: string;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingProvider: string;
  items: PosOrderItem[];
  total: number;
  status: "completed" | "pending" | "cancelled";
  createdAt: string;
  vat?: number;
  cogs?: number;
}

const now = new Date();
const daysAgo = (num: number) => {
  const d = new Date(now);
  d.setDate(now.getDate() - num);
  return d.toISOString();
};

export const seedPosOrders: PosOrderRow[] = [
  {
    id: "pos-1",
    code: "POS-1001",
    customerName: "Nguyễn Văn A",
    customerPhone: "0901234567",
    shippingProvider: "Khách tự mang về",
    items: [
      { productId: "prod-1", name: "Táo Envy Mỹ Size 36", price: 189000, quantity: 2 },
      { productId: "prod-4", name: "Rau Cải Ngọt Hữu Cơ", price: 15000, quantity: 3 }
    ],
    total: 423000,
    status: "completed",
    createdAt: daysAgo(0),
  },
  {
    id: "pos-2",
    code: "POS-1002",
    customerName: "Trần Thị B",
    customerPhone: "0987654321",
    shippingProvider: "GrabExpress",
    items: [
      { productId: "prod-2", name: "Nho Mẫu Đơn Hàn Quốc", price: 399000, quantity: 1 }
    ],
    total: 399000,
    status: "completed",
    createdAt: daysAgo(1),
  },
  {
    id: "pos-3",
    code: "POS-1003",
    customerName: "Khách vãng lai",
    shippingProvider: "Khách tự mang về",
    items: [
      { productId: "prod-9", name: "Bánh Quy Cosy Marie", price: 24000, quantity: 5 }
    ],
    total: 120000,
    status: "completed",
    createdAt: daysAgo(2),
  },
];
