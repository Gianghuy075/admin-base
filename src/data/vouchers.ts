export interface VoucherItem {
  id: string;
  code?: string | null;
  type: "discount" | "ship";
  title?: string | null;
  description?: string | null;
  value: number;
  valueType?: "fixed" | "percent";
  minOrder?: number | null;
  expiryDate?: string | null;
  totalLimit?: number | null;
  remaining?: number | null;
  usedCount?: number | null;
  isActive?: boolean | null;
}

export const seedVouchers: VoucherItem[] = [
  {
    id: "HAPPYMALL10",
    code: "HAPPYMALL10",
    type: "discount",
    title: "Giảm 10% đơn hàng",
    description: "Giảm giá 10% tối đa 50k cho đơn hàng từ 100k",
    value: 10,
    valueType: "percent",
    minOrder: 100000,
    expiryDate: "2026-12-31T23:59:59.999Z",
    totalLimit: 200,
    remaining: 185,
    usedCount: 15,
    isActive: true,
  },
  {
    id: "FREESHIP50",
    code: "FREESHIP50",
    type: "ship",
    title: "Miễn phí vận chuyển 50k",
    description: "Giảm tối đa 50k phí ship cho đơn hàng từ 250k trở lên",
    value: 50000,
    valueType: "fixed",
    minOrder: 250000,
    expiryDate: "2026-09-30T23:59:59.999Z",
    totalLimit: 100,
    remaining: 82,
    usedCount: 18,
    isActive: true,
  },
  {
    id: "HELLOSUMMER",
    code: "HELLOSUMMER",
    type: "discount",
    title: "Chào hè giảm 30k",
    description: "Giảm ngay 30k tiền mặt trực tiếp vào đơn hàng bất kỳ",
    value: 30000,
    valueType: "fixed",
    minOrder: 150000,
    expiryDate: "2026-07-31T23:59:59.999Z",
    totalLimit: 50,
    remaining: 42,
    usedCount: 8,
    isActive: true,
  },
];
