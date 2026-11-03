import { notFound } from 'next/navigation';
import Link from 'next/link';
import { products, money } from '@/lib/catalog';
import { ProductPurchase } from '@/components/product-purchase';
import { ProductCard } from '@/components/product-card';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products.find((p) => p.productId === id);

  if (!product) notFound();

  const related = products
    .filter((p) => p.productId !== id && p.categorySlug !== product.categorySlug)
    .slice(0, 4);

  return (
    <div className="pb-24">
      {/* Product Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Breadcrumbs */}
        <div className="breadcrumbs text-xs text-base-content/60 mb-6">
          <ul>
            <li>
              <Link href="/">Trang chủ</Link>
            </li>
            <li>
              <Link href="/shop">Sản phẩm</Link>
            </li>
            <li>
              <Link href={`/shop?category=${product.categorySlug}`}>
                {product.category}
              </Link>
            </li>
            <li className="text-base-content font-medium">{product.name}</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Column */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <figure className="relative aspect-[4/5] bg-base-200 rounded-box overflow-hidden border border-base-300 m-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </figure>
            {product.imageAlt && (
              <figure className="relative aspect-[4/5] bg-base-200 rounded-box overflow-hidden border border-base-300 m-0">
                <img
                  src={product.imageAlt}
                  alt={`${product.name}, góc nhìn khác`}
                  className="w-full h-full object-cover"
                />
              </figure>
            )}
          </div>

          {/* Product Purchase & Information Column */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div>
              <span className="badge badge-ghost text-xs mb-2">
                {product.category}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral mb-2">
                {product.name}
              </h1>
              <div className="text-2xl font-bold text-primary mb-4">
                {money(product.price)}
              </div>
              <p className="text-sm text-base-content/70 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Purchase Form Component */}
            <ProductPurchase product={product} />

            {/* Collapsible Details */}
            <div className="space-y-2 pt-4">
              <details
                className="collapse collapse-plus bg-base-100 border border-base-300 rounded-box"
                open
              >
                <summary className="collapse-title text-sm font-semibold">
                  Chi tiết sản phẩm & hướng dẫn bảo quản
                </summary>
                <div className="collapse-content text-xs text-base-content/70 space-y-2 leading-relaxed">
                  <p>
                    Phom dáng hiện đại, đường cắt may chuẩn xác. Hoàn thiện thủ công kỹ lưỡng từng đường kim mũi chỉ.
                  </p>
                  <p>
                    • Giặt tay hoặc giặt máy chế độ nhẹ với túi giặt.
                    <br />
                    • Không vắt xoắn mạnh, phơi trong bóng râm để giữ độ bền sợi vải và màu sắc.
                  </p>
                </div>
              </details>

              <details className="collapse collapse-plus bg-base-100 border border-base-300 rounded-box">
                <summary className="collapse-title text-sm font-semibold">
                  Chính sách giao nhận & đổi trả
                </summary>
                <div className="collapse-content text-xs text-base-content/70 space-y-2 leading-relaxed">
                  <p>
                    • Miễn phí giao hàng tiêu chuẩn cho đơn từ 1.500.000₫ (thời gian giao 2–4 ngày làm việc).
                  </p>
                  <p>
                    • Hỗ trợ đổi size hoặc đổi mẫu trong vòng 14 ngày kể từ ngày nhận hàng với sản phẩm còn nguyên tem mác.
                  </p>
                </div>
              </details>

              <details className="collapse collapse-plus bg-base-100 border border-base-300 rounded-box">
                <summary className="collapse-title text-sm font-semibold">
                  Nguồn gốc sản phẩm & Dữ liệu
                </summary>
                <div className="collapse-content text-xs text-base-content/70 leading-relaxed">
                  Hình ảnh và metadata được thu thập từ {product.source.retailer} cho mục đích prototype học thuật môn Phân tích và Thiết kế Hệ thống Thông tin (SmartFashion).
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations / Complete the look */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 pt-16 border-t border-base-300">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-1">
                Gợi ý phối cùng
              </span>
              <h2 className="font-serif text-3xl font-normal text-neutral">
                Complete the look
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p, i) => (
              <ProductCard product={p} index={i} key={p.productId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
