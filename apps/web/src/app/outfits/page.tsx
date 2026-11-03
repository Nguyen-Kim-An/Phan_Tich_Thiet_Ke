'use client';

import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { productsByCategory, money } from '@/lib/catalog';
import { cartActions } from '@/store/store';
import { Icon } from '@/components/icons';

export default function Outfits() {
  const dispatch = useDispatch();
  const look = [
    productsByCategory('ao-khoac')[0],
    productsByCategory('ao')[0],
    productsByCategory('quan')[0],
  ].filter(Boolean);

  const total = look.reduce((sum, p) => sum + p.price, 0);

  const addEntireLook = () => {
    look.forEach((product) => {
      const variant = product.variants[0];
      if (variant) {
        dispatch(cartActions.add({ product, variant }));
      }
    });
    dispatch(cartActions.toggle(true));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <span className="badge badge-primary badge-outline gap-1.5 font-medium mb-3">
          <Icon name="spark" size={14} />
          Stylist AI Capsule Wardrobe
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-normal text-neutral mb-3">
          Một điểm bắt đầu,
          <br />
          đa tầng biến tấu.
        </h1>
        <p className="text-sm sm:text-base text-base-content/70">
          Các bộ trang phục được AI phối dựa trên quy tắc tương phản chất liệu và cân bằng màu sắc cho phụ nữ hiện đại.
        </p>
      </header>

      {/* Featured Look Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden p-6 sm:p-10">
        {/* Collage Column */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-3 min-h-[440px]">
          {look[0] && (
            <figure className="relative row-span-2 rounded-box overflow-hidden bg-base-200 border border-base-300 m-0">
              <img
                src={look[0].image}
                alt={look[0].name}
                className="w-full h-full object-cover"
              />
              <span className="badge badge-neutral absolute top-3 left-3 text-xs">
                Món chủ đạo
              </span>
            </figure>
          )}
          {look[1] && (
            <figure className="relative rounded-box overflow-hidden bg-base-200 border border-base-300 m-0">
              <img
                src={look[1].image}
                alt={look[1].name}
                className="w-full h-full object-cover"
              />
            </figure>
          )}
          {look[2] && (
            <figure className="relative rounded-box overflow-hidden bg-base-200 border border-base-300 m-0">
              <img
                src={look[2].image}
                alt={look[2].name}
                className="w-full h-full object-cover"
              />
            </figure>
          )}
        </div>

        {/* Copy & Breakdown Column */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge badge-ghost text-xs">Minimal</span>
              <span className="badge badge-ghost text-xs">Công sở tinh gọn</span>
              <span className="badge badge-ghost text-xs">Giao mùa</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral mb-3">
              Thành thị trong trẻo
            </h2>
            <p className="text-sm text-base-content/70 leading-relaxed">
              Blazer xám len mịn cân bằng nét phóng khoáng của sơ mi cotton trắng; kết hợp cùng quần suông ống thẳng giữ tổng thể chỉn chu, thanh thoát từ bàn làm việc đến buổi tiệc trà chiều.
            </p>

            {/* Individual Item Breakdown */}
            <div className="divide-y divide-base-300 border-y border-base-300 mt-6">
              {look.map((p) => (
                <div
                  key={p.productId}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <Link
                    href={`/product/${p.productId}`}
                    className="font-medium text-base-content hover:text-primary transition-colors line-clamp-1 pr-2"
                  >
                    {p.name}
                  </Link>
                  <span className="font-semibold text-base-content whitespace-nowrap">
                    {money(p.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/70">
                Tổng cộng (3 món đồ)
              </span>
              <strong className="text-2xl font-bold text-primary">
                {money(total)}
              </strong>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block btn-lg shadow-md gap-2"
              onClick={addEntireLook}
            >
              <span>Thêm cả bộ vào túi</span>
              <Icon name="bag" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
