export type PrizeType = "voucher" | "points" | "turns" | "miss";

export interface WheelPrize {
  id: string;
  name?: string | null;
  label?: string | null;
  type: PrizeType;
  probability: number;
  value?: number | null;
  voucherId?: string | null;
  isActive?: boolean | null;
}

export interface WheelHistoryItem {
  id: string;
  createdAt?: string | null;
  prizeName?: string | null;
  prize?: {
    name?: string | null;
    label?: string | null;
  } | null;
}

export const seedPrizes: WheelPrize[] = [
  {
    id: "prize-1",
    name: "Tặng 50 điểm tích lũy",
    label: "Tặng 50 điểm tích lũy",
    type: "points",
    probability: 30,
    value: 50,
    isActive: true,
  },
  {
    id: "prize-2",
    name: "Voucher Giảm 10%",
    label: "Voucher Giảm 10%",
    type: "voucher",
    probability: 15,
    voucherId: "HAPPYMALL10",
    isActive: true,
  },
  {
    id: "prize-3",
    name: "Thêm 1 lượt quay miễn phí",
    label: "Thêm 1 lượt quay miễn phí",
    type: "turns",
    probability: 20,
    value: 1,
    isActive: true,
  },
  {
    id: "prize-4",
    name: "Chúc may mắn lần sau",
    label: "Chúc may mắn lần sau",
    type: "miss",
    probability: 35,
    isActive: true,
  },
];

export const seedWheelHistory: WheelHistoryItem[] = [
  {
    id: "hist-1",
    createdAt: "2026-06-03T15:20:00.000Z",
    prizeName: "Tặng 50 điểm tích lũy",
    prize: {
      name: "Tặng 50 điểm tích lũy",
      label: "Tặng 50 điểm tích lũy",
    },
  },
  {
    id: "hist-2",
    createdAt: "2026-06-03T11:05:00.000Z",
    prizeName: "Chúc may mắn lần sau",
    prize: {
      name: "Chúc may mắn lần sau",
      label: "Chúc may mắn lần sau",
    },
  },
  {
    id: "hist-3",
    createdAt: "2026-06-02T09:40:00.000Z",
    prizeName: "Voucher Giảm 10%",
    prize: {
      name: "Voucher Giảm 10%",
      label: "Voucher Giảm 10%",
    },
  },
];
