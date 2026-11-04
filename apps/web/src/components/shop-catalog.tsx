'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BoundingBox, HardFilters, Modality } from '@/domain/models';
import { categories, money } from '@/lib/catalog';
import { productRepository } from '@/dao/repositories';
import { searchController } from '@/services/search-orchestrator';
import { ProductCard } from './product-card';
import { SearchRail } from './search-rail';
import { Icon } from './icons';
import { ShipmentMapSimulator } from './shipment-map-simulator';

type PriceBand = '' | 'under-2' | '2-to-4' | 'over-4';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  new: { label: 'Mới tạo', cls: 'badge-info' },
  confirmed: { label: 'Đã xác nhận', cls: 'badge-primary' },
  shipping: { label: 'Đang giao hàng', cls: 'badge-warning' },
  completed: { label: 'Hoàn tất', cls: 'badge-success' },
  cancelled: { label: 'Đã hủy', cls: 'badge-error' },
};

export function ShopCatalog({
  initialQuery,
  initialMode,
  initialCategory,
  initialBoxCat = '',
  initialBoxLabel = '',
}: {
  initialQuery: string;
  initialMode: string;
  initialCategory: string;
  initialBoxCat?: string;
  initialBoxLabel?: string;
}) {
  const router = useRouter();
  const category = initialCategory;
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [priceBand, setPriceBand] = useState<PriceBand>('');
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    setVisibleCount(24);
  }, [initialQuery, category, selectedSize, priceBand, sort]);

  const allProducts = useMemo(
    () => productRepository.listAll(),
    [initialQuery, category]
  );

  const searchResponse = useMemo(() => {
    const modality: Modality =
      initialMode === 'image' || initialMode === 'voice'
        ? initialMode
        : 'text';

    const selectedBox: BoundingBox | undefined = initialBoxCat
      ? {
          id: 'box-selected',
          label: initialBoxLabel || 'Vùng trang phục đã chọn',
          categorySlug: initialBoxCat,
          x: 20,
          y: 20,
          width: 60,
          height: 60,
          confidence: 0.95,
        }
      : undefined;

    const uiOverrides: Partial<HardFilters> = {};
    if (category) uiOverrides.categorySlug = category;
    if (selectedSize) uiOverrides.size = selectedSize;
    if (priceBand === 'under-2') {
      uiOverrides.minPrice = undefined;
      uiOverrides.maxPrice = 2000000;
    } else if (priceBand === '2-to-4') {
      uiOverrides.minPrice = 2000000;
      uiOverrides.maxPrice = 4000000;
    } else if (priceBand === 'over-4') {
      uiOverrides.minPrice = 4000000;
      uiOverrides.maxPrice = undefined;
    }

    return searchController.search({
      text: initialQuery,
      modality,
      selectedBox,
      uiOverrides,
    });
  }, [
    initialQuery,
    initialMode,
    category,
    selectedSize,
    priceBand,
    initialBoxCat,
    initialBoxLabel,
  ]);

  const sortedResults = useMemo(() => {
    const list = [...searchResponse.results];
    if (sort === 'price-asc') {
      list.sort((a, b) => a.product.price - b.product.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.product.price - a.product.price);
    } else if (sort === 'name') {
      list.sort((a, b) => a.product.name.localeCompare(b.product.name));
    }
    return list;
  }, [searchResponse.results, sort]);

  const visibleResults = sortedResults.slice(0, visibleCount);

  const categoryUrl = (slug: string) => {
    const query = new URLSearchParams();
    if (slug) query.set('category', slug);
    if (initialQuery) query.set('q', initialQuery);
    if (initialMode) query.set('mode', initialMode);
    return `/shop${query.toString() ? `?${query}` : ''}`;
  };

  const selectCategory = (slug: string) =>
    router.push(categoryUrl(slug), { scroll: false });

  const clearLocalFilters = () => {
    setSelectedSize('');
    setPriceBand('');
  };

  const activeCategoryObj = categories.find((item) => item.slug === category);
  const heading = activeCategoryObj?.label ?? 'Hàng mới & Tuyển chọn';
  const rep = searchResponse.queryRepresentation;

  return (
    <div className="pb-20">
      {/* Page Header */}
      <section className="bg-base-200/50 border-b border-base-300 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
            Bộ sưu tập 2026 • {allProducts.length} thiết kế
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-normal text-neutral mb-3">
            {heading}
          </h1>
          <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
            {activeCategoryObj?.description ??
              'Tìm kiếm đa phương thức bằng Từ khóa, Giọng nói Amical AI Voice, Hình ảnh hoặc Tra cứu nhanh mã vận đơn.'}
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="bg-base-100 p-3 sm:p-4 rounded-box border border-base-300 shadow-md">
          <SearchRail compact />
        </div>
      </section>

      {/* ===================================================================== */}
      {/* Order Lookup View                                                     */}
      {/* ===================================================================== */}
      {searchResponse.orderLookupCode && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {searchResponse.matchedOrder ? (
            <>
              <div className="card bg-base-100 border-2 border-primary/40 shadow-lg p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-4">
                  <div>
                    <span className="badge badge-primary badge-xs uppercase tracking-wider mb-1">
                      Tra cứu vận đơn trực tuyến
                    </span>
                    <h2 className="font-serif text-2xl text-neutral">
                      Đơn hàng #{searchResponse.matchedOrder.orderCode}
                    </h2>
                    <p className="text-xs text-base-content/60">
                      Người nhận:{' '}
                      <strong>
                        {searchResponse.matchedOrder.shippingAddress.recipientName}
                      </strong>{' '}
                      ({searchResponse.matchedOrder.shippingAddress.phone}) • Đặt ngày{' '}
                      {new Date(
                        searchResponse.matchedOrder.createdAt
                      ).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        STATUS_BADGE[searchResponse.matchedOrder.orderStatus]?.cls ||
                        'badge-info'
                      } badge-md font-semibold`}
                    >
                      {STATUS_BADGE[searchResponse.matchedOrder.orderStatus]?.label ||
                        searchResponse.matchedOrder.orderStatus}
                    </span>
                    <Link href="/shop" className="btn btn-ghost btn-xs">
                      Đóng tra cứu
                    </Link>
                  </div>
                </div>

                {/* Order Items */}
                <div className="divide-y divide-base-300 border-y border-base-300">
                  {searchResponse.matchedOrder.items.map((item) => (
                    <div
                      key={item.orderItemId}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-12 h-14 object-cover rounded-field border border-base-300"
                          />
                        )}
                        <div>
                          <div className="font-medium text-base-content">
                            {item.productName}
                          </div>
                          <div className="text-xs text-base-content/60">
                            Màu: {item.colorName} • Size: {item.size} • Số lượng:{' '}
                            {item.quantity}
                          </div>
                        </div>
                      </div>
                      <strong className="text-sm font-semibold">
                        {money(item.unitPrice * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-xs text-base-content/60">
                    Giao đến:{' '}
                    {searchResponse.matchedOrder.shippingAddress.streetAddress},{' '}
                    {searchResponse.matchedOrder.shippingAddress.district},{' '}
                    {searchResponse.matchedOrder.shippingAddress.city}
                  </span>
                  <div className="text-base">
                    Tổng thanh toán:{' '}
                    <strong className="font-serif text-xl text-primary">
                      {money(
                        searchResponse.matchedOrder.totalAmount +
                          searchResponse.matchedOrder.shippingFee
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Interactive Live Delivery Map Simulator (10s Prep + 20s Map Transit to PTIT) */}
              <ShipmentMapSimulator order={searchResponse.matchedOrder} />
            </>
          ) : (
            <div className="alert alert-error alert-soft flex items-center justify-between">
              <div className="text-sm">
                <strong>Không tìm thấy đơn hàng:</strong> Mã đơn{' '}
                <span className="font-mono font-bold">
                  {searchResponse.orderLookupCode}
                </span>{' '}
                không tồn tại trong hệ thống. (Thử mã mẫu:{' '}
                <Link
                  href="/shop?q=SF-2026-0038"
                  className="underline font-semibold"
                >
                  SF-2026-0038
                </Link>{' '}
                hoặc{' '}
                <Link
                  href="/shop?q=SF-2026-0041"
                  className="underline font-semibold"
                >
                  SF-2026-0041
                </Link>
                )
              </div>
              <Link href="/shop" className="btn btn-ghost btn-xs">
                Đóng
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Category Tabs */}
      <nav
        role="tablist"
        aria-label="Danh mục sản phẩm"
        className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 overflow-x-auto flex justify-center"
      >
        <div className="tabs tabs-border min-w-max">
          <Link
            role="tab"
            href={categoryUrl('')}
            className={`tab ${
              !category
                ? 'tab-active font-semibold text-primary'
                : 'text-base-content/70'
            }`}
          >
            Tất cả ({allProducts.length})
          </Link>
          {categories.map((item) => {
            const count = allProducts.filter(
              (p) => p.categorySlug === item.slug
            ).length;
            return (
              <Link
                role="tab"
                key={item.slug}
                href={categoryUrl(item.slug)}
                className={`tab ${
                  category === item.slug
                    ? 'tab-active font-semibold text-primary'
                    : 'text-base-content/70'
                }`}
              >
                {item.label} ({count})
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Results & Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {initialQuery && !searchResponse.orderLookupCode && (
          <div className="card bg-base-200/70 border border-base-300 p-4 mb-5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="search" size={16} className="text-primary" />
                <span>
                  Kết quả{' '}
                  {initialMode === 'image'
                    ? 'tìm kiếm bằng hình ảnh'
                    : initialMode === 'voice'
                    ? 'tìm kiếm bằng giọng nói'
                    : 'tìm kiếm từ khóa'}{' '}
                  cho: <strong>“{initialQuery}”</strong>
                </span>
              </div>
              <Link href="/shop" className="btn btn-ghost btn-xs">
                Xóa tìm kiếm
              </Link>
            </div>

            {/* Extracted Filters & Tokens */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-base-content/60 font-medium">
                Tiêu chí đang lọc:
              </span>
              {rep.hardFilters.categorySlug && (
                <span className="badge badge-primary badge-sm">
                  Danh mục: {rep.hardFilters.categorySlug.toUpperCase()}
                </span>
              )}
              {rep.hardFilters.color && (
                <span className="badge badge-primary badge-sm">
                  Màu sắc: {rep.hardFilters.color}
                </span>
              )}
              {rep.hardFilters.maxPrice && (
                <span className="badge badge-primary badge-sm">
                  Giá tối đa: {money(rep.hardFilters.maxPrice)}
                </span>
              )}
              {rep.hardFilters.size && (
                <span className="badge badge-primary badge-sm">
                  Size: {rep.hardFilters.size}
                </span>
              )}
              {rep.selectedBox && (
                <span className="badge badge-accent badge-sm">
                  Vùng ảnh: {rep.selectedBox.label}
                </span>
              )}
              {rep.softTokens.slice(0, 5).map((tok) => (
                <span key={tok} className="badge badge-outline badge-xs">
                  #{tok}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Relaxed Filter Notice */}
        {searchResponse.isRelaxed && searchResponse.relaxedNotice && (
          <div className="alert alert-warning alert-soft mb-6 text-xs sm:text-sm flex items-start gap-2">
            <div>
              <strong className="block font-semibold">
                Gợi ý mở rộng tiêu chí tìm kiếm:
              </strong>
              <span>{searchResponse.relaxedNotice}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <button
            type="button"
            className="btn btn-outline btn-sm lg:hidden gap-2"
            onClick={() => setFiltersOpen(true)}
          >
            <Icon name="filter" size={16} />
            <span>Bộ lọc</span>
            {(selectedSize || priceBand) && (
              <span className="badge badge-primary badge-xs">!</span>
            )}
          </button>

          <span className="badge badge-ghost text-xs hidden lg:inline-flex">
            Hiển thị {visibleResults.length} / {sortedResults.length} sản phẩm phù hợp
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-base-content/60 hidden sm:inline">
              Sắp xếp theo:
            </span>
            <select
              className="select select-bordered select-sm text-xs"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sắp xếp sản phẩm"
            >
              <option value="featured">Độ phù hợp cao nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="name">Tên sản phẩm A–Z</option>
            </select>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6">
            <div className="card bg-base-100 border border-base-300 p-5 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">
                  Danh mục sản phẩm
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm cursor-pointer hover:text-primary">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="cat"
                        className="radio radio-primary radio-xs"
                        checked={!category}
                        onChange={() => selectCategory('')}
                      />
                      <span>Tất cả sản phẩm</span>
                    </div>
                    <span className="badge badge-ghost badge-xs">
                      {allProducts.length}
                    </span>
                  </label>
                  {categories.map((c) => (
                    <label
                      key={c.slug}
                      className="flex items-center justify-between text-sm cursor-pointer hover:text-primary"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="cat"
                          className="radio radio-primary radio-xs"
                          checked={category === c.slug}
                          onChange={() => selectCategory(c.slug)}
                        />
                        <span>{c.label}</span>
                      </div>
                      <span className="badge badge-ghost badge-xs">
                        {
                          allProducts.filter((p) => p.categorySlug === c.slug)
                            .length
                        }
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="border-t border-base-300 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">
                  Kích cỡ
                </h3>
                <div className="grid grid-cols-5 gap-1.5">
                  {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-xs ${
                        selectedSize === size
                          ? 'btn-neutral'
                          : 'btn-outline border-base-300'
                      }`}
                      onClick={() =>
                        setSelectedSize(selectedSize === size ? '' : size)
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Band */}
              <div className="border-t border-base-300 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">
                  Khoảng giá
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['under-2', 'Dưới 2.000.000₫'],
                    ['2-to-4', '2.000.000₫ – 4.000.000₫'],
                    ['over-4', 'Trên 4.000.000₫'],
                  ].map(([val, label]) => (
                    <label
                      key={val}
                      className="flex items-center gap-2 cursor-pointer hover:text-primary"
                    >
                      <input
                        type="radio"
                        name="price"
                        className="radio radio-primary radio-xs"
                        checked={priceBand === val}
                        onChange={() => setPriceBand(val as PriceBand)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {(selectedSize || priceBand) && (
                <button
                  type="button"
                  className="btn btn-outline btn-xs btn-block text-error border-error/30 hover:border-error"
                  onClick={clearLocalFilters}
                >
                  Xóa bộ lọc kích cỡ & giá
                </button>
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3 space-y-8">
            {visibleResults.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {visibleResults.map((res, index) => (
                    <ProductCard
                      key={res.resultId}
                      product={res.product}
                      index={index}
                      rank={res.rank}
                      badges={res.badges}
                    />
                  ))}
                </div>

                {visibleCount < sortedResults.length && (
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 24)}
                      className="btn btn-outline btn-primary px-8"
                    >
                      Xem thêm sản phẩm ({sortedResults.length - visibleCount}{' '}
                      mẫu còn lại)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="card bg-base-200/50 border border-base-300 p-12 text-center">
                <h3 className="font-serif text-2xl mb-2">
                  Không tìm thấy sản phẩm phù hợp
                </h3>
                <p className="text-sm text-base-content/60 mb-6 max-w-sm mx-auto">
                  Hãy thử nới lỏng các tiêu chí lọc hoặc chọn một trong các từ khóa gợi ý phổ biến bên dưới:
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {[
                    'áo sơ mi trắng',
                    'blazer công sở',
                    'váy lụa dự tiệc',
                    'quần suông đen',
                  ].map((kw) => (
                    <Link
                      key={kw}
                      href={`/shop?q=${encodeURIComponent(kw)}`}
                      className="badge badge-outline hover:badge-primary py-3"
                    >
                      {kw}
                    </Link>
                  ))}
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={clearLocalFilters}
                  >
                    Xóa các bộ lọc
                  </button>
                  <Link href="/shop" className="btn btn-primary btn-sm">
                    Xem tất cả sản phẩm
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-neutral/50 backdrop-blur-xs"
            onClick={() => setFiltersOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-base-100 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-base-300">
                <h3 className="font-serif text-xl">Bộ lọc sản phẩm</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-circle btn-sm"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Đóng bộ lọc"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              {/* Sizes */}
              <div className="py-5 border-b border-base-300">
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">
                  Kích cỡ
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-sm ${
                        selectedSize === size
                          ? 'btn-neutral'
                          : 'btn-outline border-base-300'
                      }`}
                      onClick={() =>
                        setSelectedSize(selectedSize === size ? '' : size)
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Band */}
              <div className="py-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">
                  Khoảng giá
                </h4>
                <div className="space-y-3 text-sm">
                  {[
                    ['under-2', 'Dưới 2.000.000₫'],
                    ['2-to-4', '2.000.000₫ – 4.000.000₫'],
                    ['over-4', 'Trên 4.000.000₫'],
                  ].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="m-price"
                        className="radio radio-primary radio-sm"
                        checked={priceBand === val}
                        onChange={() => setPriceBand(val as PriceBand)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-base-300">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => setFiltersOpen(false)}
              >
                Áp dụng bộ lọc ({sortedResults.length})
              </button>
              {(selectedSize || priceBand) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-block btn-sm text-error"
                  onClick={clearLocalFilters}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
