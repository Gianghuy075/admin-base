export type NewsCategory = "promo" | "knowledge";

export interface NewsItem {
  id: string;
  title: string;
  category: NewsCategory;
  coverUrl?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  description?: string | null;
  content?: string[] | string | null;
  tag?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
}

export const seedNews: NewsItem[] = [
  {
    id: "news-summer-promo",
    title: "Khuyến mãi chào hè 2026 - Giải nhiệt cực lớn lên tới 50%",
    category: "promo",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    excerpt: "Nhận ngay hàng ngàn ưu đãi giảm giá cực khủng khi mua các loại trái cây và đồ uống lạnh tại hệ thống cửa hàng HappyMall trên toàn quốc.",
    content: "<p>Mùa hè oi bức đã gõ cửa! Để tiếp thêm năng lượng và mang lại làn gió mát lành cho quý khách hàng, HappyMall trân trọng gửi tới chương trình khuyến mãi cực khủng <strong>'Chào hè rực rỡ - Deal mát bất ngờ'</strong>.</p><p>Thời gian diễn ra chương trình từ ngày 01/06/2026 đến hết ngày 30/06/2026 với vô vàn ưu đãi như:</p><ul><li>Trái cây nhập khẩu (táo Envy, nho mẫu đơn) đồng loạt giảm giá 15% - 20%.</li><li>Nước ép trái cây tươi và sữa tiệt trùng giảm giá đến 30%.</li><li>Freeship cho tất cả các đơn hàng online có giá trị từ 250k.</li></ul><p>Đến ngay HappyMall gần nhất hoặc đặt hàng qua website/zalo để không bỏ lỡ cơ hội này nhé!</p>",
    tag: "flash-sale",
    publishedAt: "2026-06-01T08:00:00.000Z",
    createdAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "news-choose-fresh-fruit",
    title: "Mách bạn cách chọn trái cây tươi ngon, không lo hóa chất",
    category: "knowledge",
    coverUrl: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&auto=format&fit=crop&q=80",
    excerpt: "Bỏ túi ngay những mẹo nhỏ hữu ích từ chuyên gia dinh dưỡng giúp bạn lựa chọn trái cây tươi sạch, mọng nước và an toàn cho sức khỏe gia đình.",
    content: "<p>Trái cây là nguồn cung cấp vitamin và khoáng chất tự nhiên tuyệt vời cho cơ thể. Tuy nhiên, làm thế nào để chọn được những quả táo, quả cam ngon ngọt và an toàn vệ sinh thực phẩm?</p><p>Dưới đây là một số mẹo nhỏ cực kỳ đơn giản:</p><p><strong>1. Quan sát vỏ ngoài:</strong> Trái cây tươi ngon tự nhiên thường có vỏ căng bóng nhưng không quá hoàn hảo. Nếu vỏ quá láng bóng bất thường, có thể quả đã được phủ một lớp sáp bảo quản.</p><p><strong>2. Kiểm tra phần cuống:</strong> Cuống quả tươi phải còn xanh và dính chặt vào thân quả. Cuống héo hoặc dễ rụng chứng tỏ quả đã để lâu.</p><p><strong>3. Cầm chắc tay:</strong> Quả mọng nước khi cầm vào sẽ cảm thấy nặng tay và săn chắc, không bị mềm nhũn.</p><p>Tại HappyMall, chúng tôi luôn cam kết cung cấp các sản phẩm trái cây sạch VietGAP và trái cây nhập khẩu chính ngạch, đảm bảo an toàn tuyệt đối cho sức khỏe của bạn và gia đình.</p>",
    tag: "suc-khoe",
    publishedAt: "2026-05-28T09:30:00.000Z",
    createdAt: "2026-05-28T09:30:00.000Z",
  },
];
