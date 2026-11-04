import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { categories, products, productsByCategory, money } from '@/lib/catalog';
import { Icon } from '@/components/icons';
import { SearchRail } from '@/components/search-rail';

export default function Home() {
  const hero = productsByCategory('ao-khoac')[0] ?? products[0];
  const heroSide = productsByCategory('vay')[0] ?? products[1];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Editorial Split Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          {/* Main Hero Card */}
          <div className="lg:col-span-8 relative rounded-box overflow-hidden min-h-[520px] sm:min-h-[620px] flex items-end shadow-md group">
            <img
              src={hero.image}
              alt={hero.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral/90 via-neutral/40 to-transparent" />
            <div className="relative z-10 p-6 sm:p-12 text-neutral-content max-w-xl">
              <span className="badge badge-primary badge-sm uppercase tracking-widest font-semibold mb-4 shadow-xs">
                Bộ sưu tập giao mùa 2026
              </span>
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal leading-[0.95] tracking-tight mb-4 text-white">
                Quiet form,
                <br />
                clear intention.
              </h1>
              <p className="text-sm sm:text-base text-neutral-content/80 leading-relaxed mb-8 max-w-md">
                Đường cắt chuẩn xác. Tối giản chi tiết để chất liệu và phom dáng tự do cất tiếng nói.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="btn btn-primary px-8 text-base shadow-lg hover:shadow-xl"
                >
                  Khám phá bộ sưu tập
                </Link>
                <Link
                  href="/try-on"
                  className="btn btn-outline border-white/40 text-white hover:bg-white/10 hover:border-white text-base gap-2"
                >
                  <Icon name="camera" size={16} />
                  <span>Phòng thử đồ trực tuyến</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Curated Editorial Pick Card */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <Link
              href={`/product/${heroSide.productId}`}
              className="card bg-base-100 border border-base-300 overflow-hidden shadow-md group h-full flex flex-col justify-between hover:border-primary transition-colors"
            >
              <figure className="relative h-72 sm:h-80 overflow-hidden m-0 bg-base-200">
                <img
                  src={heroSide.image}
                  alt={heroSide.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="badge badge-neutral absolute top-3 left-3 text-xs shadow-xs">
                  Biên tập chọn tuần này
                </span>
              </figure>
              <div className="card-body p-5 justify-between">
                <div>
                  <h2 className="card-title text-base font-medium font-serif group-hover:text-primary transition-colors">
                    {heroSide.name}
                  </h2>
                  <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                    {heroSide.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-base-300 mt-4">
                  <strong className="text-base font-semibold text-primary">
                    {money(heroSide.price)}
                  </strong>
                  <span className="btn btn-circle btn-sm btn-ghost group-hover:translate-x-1 transition-transform">
                    <Icon name="arrow" size={16} />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-1">
              Khám phá theo danh mục
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-neutral">
              Mặc theo cách của bạn.
            </h2>
          </div>
          <p className="text-sm text-base-content/70 max-w-sm sm:text-right">
            Những phom dáng cốt lõi định hình phong cách sống hiện đại và thanh lịch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c, i) => {
            const product = productsByCategory(c.slug)[0];
            return (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="card image-full h-80 sm:h-96 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-base-300"
              >
                {product && (
                  <figure className="m-0">
                    <img
                      src={product.image}
                      alt={c.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                    />
                  </figure>
                )}
                <div className="card-body justify-between p-6 bg-gradient-to-t from-neutral/90 via-neutral/40 to-transparent">
                  <div className="flex justify-between items-start">
                    <span className="badge badge-neutral/80 text-xs backdrop-blur-xs font-mono">
                      0{i + 1}
                    </span>
                    <span className="btn btn-circle btn-xs btn-ghost text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="arrow" size={14} />
                    </span>
                  </div>
                  <div>
                    <h3 className="card-title font-serif text-2xl sm:text-3xl font-normal text-white mb-1">
                      {c.label}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="bg-base-200/50 py-16 sm:py-20 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-1">
                Vừa cập nhật
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-normal text-neutral">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop"
              className="btn btn-link no-underline hover:underline text-sm font-medium gap-1 text-primary p-0"
            >
              <span>Xem toàn bộ</span>
              <Icon name="arrow" size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(0, 8).map((product, index) => (
              <ProductCard
                key={product.productId}
                product={product}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Search & Multimodal Feature Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="card bg-primary text-primary-content overflow-hidden shadow-2xl border border-primary/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 p-8 sm:p-14 space-y-6">
              <span className="badge badge-accent badge-outline font-medium">
                Tìm kiếm & Tư vấn Đa phương thức
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-normal leading-tight">
                Bắt đầu bằng một cảm giác,
                <br />
                tìm ra đúng món đồ.
              </h2>
              <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed max-w-lg">
                Mô tả ý tưởng trang phục, tải lên ảnh chụp từ Instagram hay Pinterest, hoặc tìm bằng giọng nói. Hệ thống AI phân tích độ tương đồng thị giác và chất liệu tức thì.
              </p>

              <div className="pt-2 max-w-xl">
                <SearchRail compact />
              </div>
            </div>

            <div className="lg:col-span-5 relative h-80 sm:h-96 lg:h-full min-h-[380px] bg-primary-content/10">
              <img
                src={(productsByCategory('ao')[1] ?? products[0]).imageAlt}
                alt="Trang phục được gợi ý bởi AI"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-5 right-5 card bg-base-100 text-base-content p-4 shadow-xl border border-base-300 max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-primary badge-sm font-bold">96%</span>
                  <span className="text-xs font-semibold">Tương đồng phong cách</span>
                </div>
                <p className="text-xs text-base-content/70">
                  Gợi ý từ ảnh tham khảo: Phom suông tối giản, lụa cát cao cấp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Virtual Try-On Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-base-100 rounded-box border border-base-300 p-6 sm:p-12 shadow-sm">
          <div className="relative rounded-box overflow-hidden aspect-[4/3] bg-base-200">
            <img
              src={(productsByCategory('ao-khoac')[1] ?? products[2]).image}
              alt="Áo khoác trong bộ sưu tập thử đồ"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="badge badge-neutral shadow-sm text-xs">
                Thử đồ trực tuyến
              </span>
            </div>
          </div>

          <div className="space-y-6 lg:pl-6">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block">
              Công nghệ Virtual Try-On
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-neutral leading-tight">
              Thấy mình trong phom dáng trước khi quyết định.
            </h2>
            <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
              Chỉ cần một ảnh chân dung hoặc toàn thân, AI sẽ mô phỏng độ rủ của vải, tỷ lệ vai và chiều dài khi mặc trên cơ thể bạn. Giảm tỷ lệ đổi trả, tăng độ tự tin khi mua sắm.
            </p>
            <div className="space-y-2 text-xs text-base-content/60">
              <div className="flex items-center gap-2">
                <span className="badge badge-success badge-xs" />
                <span>Bảo mật tuyệt đối: Ảnh thử đồ tự động xóa sau 24 giờ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success badge-xs" />
                <span>Mô phỏng chính xác chất liệu linen, cotton và lụa cát</span>
              </div>
            </div>
            <div>
              <Link
                href="/try-on"
                className="btn btn-primary px-6 text-sm shadow-md gap-2"
              >
                <span>Trải nghiệm phòng thử đồ AI</span>
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Service Strip */}
      <section className="border-t border-base-300 bg-base-200/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-1">
              <strong className="text-sm font-semibold text-neutral block">
                Giao hàng miễn phí
              </strong>
              <p className="text-xs text-base-content/60">
                Cho mọi đơn hàng toàn quốc từ 1.500.000₫
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-sm font-semibold text-neutral block">
                Đổi size trong 14 ngày
              </strong>
              <p className="text-xs text-base-content/60">
                Nhân viên đến thu đổi tận nơi nhanh chóng
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-sm font-semibold text-neutral block">
                Stylist AI hiểu bạn
              </strong>
              <p className="text-xs text-base-content/60">
                Phối đồ thông minh theo tỷ lệ cơ thể và sự kiện
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-sm font-semibold text-neutral block">
                Thanh toán an toàn
              </strong>
              <p className="text-xs text-base-content/60">
                Hỗ trợ COD, chuyển khoản VNPay và ví MoMo
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
