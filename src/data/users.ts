export interface UserItem {
  id: string;
  name: string;
  zaloId: string;
  avatar: string;
  phone: string;
  points: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: string;
}

export const seedUsers: UserItem[] = [
  {
    id: "customer-1",
    name: "Nguyễn Văn Hùng",
    zaloId: "zalo-oa-982143",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    phone: "0912345678",
    points: 350,
    totalOrders: 12,
    isActive: true,
    createdAt: "2026-03-12T09:30:00.000Z",
  },
  {
    id: "customer-2",
    name: "Lê Thị Mai",
    zaloId: "zalo-oa-112094",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    phone: "0987654321",
    points: 120,
    totalOrders: 4,
    isActive: true,
    createdAt: "2026-04-05T14:15:00.000Z",
  },
  {
    id: "customer-3",
    name: "Phạm Minh Tuấn",
    zaloId: "zalo-oa-743128",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face",
    phone: "0905123456",
    points: 580,
    totalOrders: 23,
    isActive: true,
    createdAt: "2026-01-20T08:05:00.000Z",
  },
  {
    id: "customer-4",
    name: "Trần Thu Hương",
    zaloId: "zalo-oa-358190",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    phone: "0978999888",
    points: 45,
    totalOrders: 1,
    isActive: false,
    createdAt: "2026-05-18T16:45:00.000Z",
  },
  {
    id: "customer-5",
    name: "Hoàng Đức Anh",
    zaloId: "zalo-oa-482910",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    phone: "0934112233",
    points: 0,
    totalOrders: 0,
    isActive: true,
    createdAt: "2026-06-01T11:22:00.000Z",
  },
];
