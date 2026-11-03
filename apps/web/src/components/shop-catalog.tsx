'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { categories, products } from '@/lib/catalog';
import { ProductCard } from './product-card';
import { SearchRail } from './search-rail';
import { Icon } from './icons';

type PriceBand = '' | 'under-2' | '2-to-4' | 'over-4';

export function ShopCatalog({
  initialQuery,
  initialMode,
  initialCategory,
}: {
  initialQuery: string;
  initialMode: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const category = initialCategory;
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [priceBand, setPriceBand] = useState<PriceBand>('');

  const results = useMemo(() => {
    const words = initialQuery.toLowerCase().split(/\s+/).filter(Boolean);
    let list = products.filter((product) => {
      const searchable = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      const matchesSearch =
        !words.length || words.some((word) => searchable.includes(word));
      const matchesSize =
        !selectedSize ||
        product.variants.some((variant) =>
          variant.size
            .toUpperCase()
            .split(/\s*\/\s*|\s+/)
            .includes(selectedSize)
        );
      const matchesPrice =
        !priceBand ||
        (priceBand === 'under-2' && product.price < 2000000) ||
        (priceBand === '2-to-4' &&
          product.price >= 2000000 &&
          product.price <= 4000000) ||
        (priceBand === 'over-4' && product.price > 4000000);

      return (
        (!category || product.categorySlug === category) &&
        matchesSearch &&
        matchesSize &&
        matchesPrice
      );
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list.map((product, index) =>
      initialMode
        ? { ...product, match: Math.max(74, 97 - index * 3) }
        : product
    );
  }, [category, sort, initialQuery, initialMode, selectedSize, priceBand]);

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

  return (
    <div className="pb-20">
      {/* Page Header */}
      <section className="bg-base-200/50 border-b border-base-300 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
            Bộ sưu tập 2026
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-normal text-neutral mb-3">
            {heading}
          </h1>
          <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
            {activeCategoryObj?.description ??
              'Khám phá những phom dáng kinh điển và hiện đại, phối hợp hoàn hảo với tủ đồ của bạn.'}
          </p>
        </div>
      </section>

      {/* AI Search Bar */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="bg-base-100 p-3 sm:p-4 rounded-box border border-base-300 shadow-md">
          <SearchRail compact />
        </div>
      </section>

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
            className={`tab ${!category ? 'tab-active font-semibold text-primary' : 'text-base-content/70'}`}
          >
            Tất cả
          </Link>
          {categories.map((item) => (
            <Link
              role="tab"
              key={item.slug}
              href={categoryUrl(item.slug)}
              className={`tab ${category === item.slug ? 'tab-active font-semibold text-primary' : 'text-base-content/70'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Results & Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {initialQuery && (
          <div className="alert alert-soft alert-info mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="spark" size={16} />
              <span>
                Kết quả {initialMode === 'image' ? 'tìm bằng hình ảnh' : initialMode === 'voice' ? 'từ giọng nói' : 'tìm kiếm'} cho: <strong>“{initialQuery}”</strong>
              </span>
            </div>
            <Link href="/shop" className="btn btn-ghost btn-xs">
              Xóa tìm kiếm
            </Link>
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
            {results.length} sản phẩm
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
              <option value="featured">Nổi bật nhất</option>
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
                  Danh mục
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                    <input
                      type="radio"
                      name="cat"
                      className="radio radio-primary radio-xs"
                      checked={!category}
                      onChange={() => selectCategory('')}
                    />
                    <span>Tất cả sản phẩm</span>
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
                        {products.filter((p) => p.categorySlug === c.slug).length}
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
          <div className="lg:col-span-3">
            {results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {results.map((product, index) => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="card bg-base-200/50 border border-base-300 p-12 text-center">
                <h3 className="font-serif text-2xl mb-2">
                  Chưa có sản phẩm phù hợp
                </h3>
                <p className="text-sm text-base-content/60 mb-6 max-w-sm mx-auto">
                  Hãy thử nới lỏng các tiêu chí lọc hoặc tìm kiếm bằng từ khóa khác.
                </p>
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
                <h3 className="font-serif text-xl">Bộ lọc</h3>
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
                Áp dụng bộ lọc ({results.length})
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
