import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/store/provider';
import { Header } from '@/components/header';
import { CartDrawer } from '@/components/cart-drawer';
import { Icon } from '@/components/icons';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'MaisonAI — Thời trang hiểu bạn',
    template: '%s — MaisonAI',
  },
  description:
    'Thời trang đương đại chọn lọc kết hợp công nghệ tìm kiếm đa phương thức và phòng thử đồ AI thông minh.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="maison">
      <body className="flex flex-col min-h-screen">
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <CartDrawer />

          <footer className="bg-neutral text-neutral-content border-t border-neutral/20">
            {/* Top Newsletter Strip */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-b border-neutral-content/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-3xl font-bold tracking-tight mb-2">
                    MAISON<span className="font-serif italic font-normal text-accent ml-1">AI</span>
                  </div>
                  <p className="text-sm text-neutral-content/70 max-w-md">
                    Thời trang đương đại, tuyển chọn cùng công nghệ trí tuệ nhân tạo để tôn vinh phong cách riêng của bạn.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-xl mb-3">Nhận bản tin đặc quyền</h3>
                  <form
                    action="/shop"
                    className="join w-full max-w-md"
                  >
                    <input
                      type="email"
                      aria-label="Email nhận bản tin"
                      placeholder="Nhập email của bạn..."
                      className="input input-bordered join-item flex-1 bg-neutral/60 text-neutral-content border-neutral-content/20 placeholder:text-neutral-content/40 focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary join-item px-6"
                      aria-label="Đăng ký nhận bản tin"
                    >
                      <Icon name="arrow" size={18} />
                    </button>
                  </form>
                  <p className="text-xs text-neutral-content/50 mt-2">
                    Đăng ký để nhận sớm bộ sưu tập mới và ưu đãi thành viên.
                  </p>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <span className="font-semibold text-xs tracking-wider uppercase text-neutral-content/50 block mb-4">
                    Mua sắm
                  </span>
                  <ul className="space-y-2 text-sm text-neutral-content/80">
                    <li>
                      <Link href="/shop" className="hover:text-accent transition-colors">
                        Tất cả sản phẩm
                      </Link>
                    </li>
                    <li>
                      <Link href="/shop?category=ao" className="hover:text-accent transition-colors">
                        Áo sơ mi & Áo kiểu
                      </Link>
                    </li>
                    <li>
                      <Link href="/shop?category=vay" className="hover:text-accent transition-colors">
                        Đầm & Chân váy
                      </Link>
                    </li>
                    <li>
                      <Link href="/shop?category=ao-khoac" className="hover:text-accent transition-colors">
                        Áo khoác & Blazer
                      </Link>
                    </li>
                    <li>
                      <Link href="/shop?category=phu-kien" className="hover:text-accent transition-colors">
                        Túi & Phụ kiện
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-xs tracking-wider uppercase text-neutral-content/50 block mb-4">
                    Công nghệ AI
                  </span>
                  <ul className="space-y-2 text-sm text-neutral-content/80">
                    <li>
                      <Link href="/try-on" className="hover:text-accent transition-colors">
                        Phòng thử đồ ảo
                      </Link>
                    </li>
                    <li>
                      <Link href="/outfits" className="hover:text-accent transition-colors">
                        Stylist AI gợi ý phối
                      </Link>
                    </li>
                    <li>
                      <Link href="/shop" className="hover:text-accent transition-colors">
                        Tìm kiếm qua hình ảnh
                      </Link>
                    </li>
                    <li>
                      <Link href="/account" className="hover:text-accent transition-colors">
                        Hồ sơ dáng người & phong cách
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-xs tracking-wider uppercase text-neutral-content/50 block mb-4">
                    Hỗ trợ khách hàng
                  </span>
                  <ul className="space-y-2 text-sm text-neutral-content/80">
                    <li>
                      <span className="hover:text-accent cursor-pointer">Chính sách giao nhận</span>
                    </li>
                    <li>
                      <span className="hover:text-accent cursor-pointer">Chính sách đổi trả 14 ngày</span>
                    </li>
                    <li>
                      <span className="hover:text-accent cursor-pointer">Hướng dẫn chọn kích cỡ</span>
                    </li>
                    <li>
                      <span className="hover:text-accent cursor-pointer">Câu hỏi thường gặp</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-xs tracking-wider uppercase text-neutral-content/50 block mb-4">
                    Đồ án học thuật
                  </span>
                  <p className="text-xs text-neutral-content/60 leading-relaxed">
                    Hệ thống Thương mại Điện tử Thời trang Tích hợp AI (SmartFashion). Ảnh sản phẩm thu thập cho mục đích prototype học tập nghiên cứu.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/admin"
                      className="btn btn-outline btn-xs text-neutral-content border-neutral-content/30 hover:border-accent hover:text-accent"
                    >
                      Bảng quản trị nội bộ
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-neutral-content/10 py-6 text-xs text-neutral-content/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p>© 2026 MaisonAI Inc. Toàn bộ quyền được bảo lưu.</p>
                <div className="flex items-center gap-6">
                  <span>Vietnam / VND (₫)</span>
                  <span className="hover:text-neutral-content cursor-pointer">Điều khoản</span>
                  <span className="hover:text-neutral-content cursor-pointer">Bảo mật</span>
                </div>
              </div>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
