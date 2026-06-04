export interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  slug?: string | null;
}

export const seedCategories: CategoryItem[] = [
  {
    id: "cat-1",
    name: "Trái cây tươi",
    description: "Trái cây nội địa và nhập khẩu tươi ngon mỗi ngày",
    icon: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=80&auto=format&fit=crop&q=60",
    slug: "trai-cay-tuoi",
  },
  {
    id: "cat-2",
    name: "Rau củ hữu cơ",
    description: "Rau sạch hữu cơ đạt tiêu chuẩn VietGAP",
    icon: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=80&auto=format&fit=crop&q=60",
    slug: "rau-cu-huu-co",
  },
  {
    id: "cat-3",
    name: "Thịt & Hải sản",
    description: "Thịt tươi sống và hải sản được bảo quản tiêu chuẩn",
    icon: "https://images.unsplash.com/photo-1544025162-d76694265947?w=80&auto=format&fit=crop&q=60",
    slug: "thit-hai-san",
  },
  {
    id: "cat-4",
    name: "Đồ uống & Sữa",
    description: "Nước ngọt, nước ép và các loại sữa dinh dưỡng",
    icon: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=80&auto=format&fit=crop&q=60",
    slug: "do-uong-sua",
  },
  {
    id: "cat-5",
    name: "Đồ ăn vặt",
    description: "Bánh kẹo, hạt sấy khô và đồ ăn vặt hấp dẫn",
    icon: "https://images.unsplash.com/photo-1599490659213-e2b9527ec087?w=80&auto=format&fit=crop&q=60",
    slug: "do-an-vat",
  },
];
