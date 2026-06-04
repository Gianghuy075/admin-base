export interface ProductItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number | null;
  oldPrice?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  categoryId?: string | null;
  importPrice?: number;
  taxRate?: number; // VAT percentage, e.g. 5, 8, 10
}

export const seedProducts: ProductItem[] = [
  {
    id: "prod-1",
    name: "Táo Envy Mỹ Size 36",
    description: "<p>Táo Envy Mỹ có màu đỏ sẫm đặc trưng, thịt táo giòn ngọt đậm đà và có hương thơm đặc biệt. Chứa nhiều vitamin C và chất xơ có lợi cho sức khỏe.</p>",
    price: 189000,
    stock: 120,
    oldPrice: 220000,
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-1",
    importPrice: 110000,
    taxRate: 8,
  },
  {
    id: "prod-2",
    name: "Nho Mẫu Đơn Hàn Quốc",
    description: "<p>Nho mẫu đơn (Shine Muscat) nhập khẩu trực tiếp từ Hàn Quốc, quả to, ngọt thơm vị sữa đặc trưng, hoàn toàn không có hạt.</p>",
    price: 399000,
    stock: 45,
    oldPrice: 450000,
    imageUrl: "https://images.unsplash.com/photo-1537084642907-629340c7e59c?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1537084642907-629340c7e59c?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-1",
    importPrice: 240000,
    taxRate: 8,
  },
  {
    id: "prod-3",
    name: "Cam Sành Hàm Yên",
    description: "<p>Cam sành Hàm Yên vỏ sần sùi, mọng nước, có vị chua ngọt thanh mát tự nhiên. Thích hợp để làm nước ép giải nhiệt tốt cho sức khỏe.</p>",
    price: 35000,
    stock: 250,
    imageUrl: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1547514701-42782101795e?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-1",
    importPrice: 20000,
    taxRate: 10,
  },
  {
    id: "prod-4",
    name: "Rau Cải Ngọt Hữu Cơ",
    description: "<p>Rau cải ngọt được trồng hữu cơ tại nông trại HappyMall, đảm bảo không sử dụng phân bón hóa học và thuốc trừ sâu độc hại.</p>",
    price: 15000,
    stock: 80,
    oldPrice: 18000,
    imageUrl: "https://images.unsplash.com/photo-1587334206574-351ec37454a5?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1587334206574-351ec37454a5?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-2",
    importPrice: 8000,
    taxRate: 5,
  },
  {
    id: "prod-5",
    name: "Cà Rốt Đà Lạt",
    description: "<p>Cà rốt tươi ngon từ vùng đất Đà Lạt mát mẻ, nhiều beta-carotene tốt cho mắt và da.</p>",
    price: 25000,
    stock: 150,
    imageUrl: "https://images.unsplash.com/photo-1444312645910-ffa973656eba?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1444312645910-ffa973656eba?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-2",
    importPrice: 15000,
    taxRate: 5,
  },
  {
    id: "prod-6",
    name: "Thịt Ba Chỉ Bò Mỹ Cắt Lát",
    description: "<p>Thịt ba chỉ bò Mỹ (Shortplate) được cắt lát mỏng tiêu chuẩn phù hợp ăn lẩu, nướng BBQ. Vân mỡ đều đặn giúp thịt mềm béo và ngọt đậm đà.</p>",
    price: 260000,
    stock: 60,
    oldPrice: 290000,
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-3",
    importPrice: 170000,
    taxRate: 10,
  },
  {
    id: "prod-7",
    name: "Tôm Thẻ Chân Trắng Tươi",
    description: "<p>Tôm thẻ chân trắng nuôi tự nhiên tại đầm quảng canh, thịt chắc ngọt, luộc hoặc hấp sả cực ngon.</p>",
    price: 195000,
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-3",
    importPrice: 120000,
    taxRate: 10,
  },
  {
    id: "prod-8",
    name: "Sữa Tươi Tiệt Trùng TH True Milk",
    description: "<p>Thùng 48 hộp sữa tươi tiệt trùng TH True Milk nguyên chất 180ml, được làm hoàn toàn từ sữa bò tươi sạch của trang trại TH.</p>",
    price: 365000,
    stock: 90,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-4",
    importPrice: 280000,
    taxRate: 8,
  },
  {
    id: "prod-9",
    name: "Bánh Quy Cosy Marie",
    description: "<p>Bánh quy bơ Cosy thơm béo giòn rụm, thích hợp làm bữa phụ nhẹ nhàng cung cấp năng lượng nhanh.</p>",
    price: 24000,
    stock: 300,
    oldPrice: 28000,
    imageUrl: "https://images.unsplash.com/photo-1558961312-50346c09988b?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1558961312-50346c09988b?w=400&auto=format&fit=crop&q=80"],
    categoryId: "cat-5",
    importPrice: 16000,
    taxRate: 10,
  },
];
