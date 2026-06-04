export interface StockMovement {
  id: string;
  code: string;
  type: "in" | "out";
  createdAt: string;
  createdBy: string;
  details?: string;
  price?: number;
  totalValue?: number;
}

const now = new Date();
const daysAgo = (num: number) => {
  const d = new Date(now);
  d.setDate(now.getDate() - num);
  return d.toISOString();
};

export const seedStockMovements: StockMovement[] = [
  {
    id: "sm-1",
    code: "XK-POS-1001",
    type: "out",
    createdAt: daysAgo(0),
    createdBy: "Hệ thống (POS)",
  },
  {
    id: "sm-2",
    code: "XK-POS-1002",
    type: "out",
    createdAt: daysAgo(1),
    createdBy: "Hệ thống (POS)",
  },
  {
    id: "sm-3",
    code: "NK-RESTOCK-01",
    type: "in",
    createdAt: daysAgo(3),
    createdBy: "Nguyễn Văn A",
  },
];
