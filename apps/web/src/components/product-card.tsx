'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Product, money } from '@/lib/catalog';
import { cartActions } from '@/store/store';
import { Icon } from './icons';

export function ProductCard({
  product,
  index = 0,
  rank,
  badges,
}: {
  product: Product;
  index?: number;
  rank?: number;
  badges?: string[];
}) {
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dispatch = useDispatch();
  const inStockVariant =
    product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const isOutOfStock = product.variants.every((v) => v.stock <= 0);
  const explanationBadges = badges ?? product.badges ?? [];

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      className="card bg-base-100 border border-base-300 overflow-hidden group hover:shadow-md transition-all duration-300"
    >
      <figure className="relative aspect-[4/5] bg-base-200 overflow-hidden m-0">
        <Link
          href={`/product/${product.productId}`}
          aria-label={`Xem chi tiết ${product.name}`}
          className="w-full h-full block"
        >
          <img
            src={product.image}
            alt={product.name}
            loading={index < 6 ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {hovered && product.imageAlt && product.imageAlt !== product.image && (
            <img
              src={product.imageAlt}
              alt={`${product.name}, góc nhìn khác`}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </Link>

        {/* Top-left Match Score Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.match && (
            <span className="badge badge-primary badge-sm shadow-xs font-medium">
              {rank && rank <= 12 ? `#${rank} • ` : ''}Phù hợp {product.match}%
            </span>
          )}
          {isOutOfStock && (
            <span className="badge badge-error badge-sm shadow-xs font-medium">
              Hết hàng
            </span>
          )}
        </div>

        <button
          type="button"
          className={`btn btn-circle btn-sm btn-ghost absolute top-3 right-3 bg-base-100/80 backdrop-blur-xs hover:bg-base-100 transition-colors ${
            liked ? 'text-primary' : 'text-base-content/70'
          }`}
          onClick={() => setLiked(!liked)}
          aria-label={liked ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          <Icon name="heart" size={16} className={liked ? 'fill-current' : ''} />
        </button>

        {inStockVariant && !isOutOfStock && (
          <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 flex items-center gap-1.5">
            <Link
              href={`/try-on?product=${product.productId}&variant=${inStockVariant.variantId}`}
              className="btn btn-primary btn-xs sm:btn-sm flex-1 shadow-md gap-1 px-2 font-medium"
              title="Thử đồ trực tiếp với Maison AI"
            >
              <Icon name="camera" size={14} />
              <span className="truncate">Thử đồ</span>
            </Link>
            <button
              type="button"
              className="btn btn-neutral btn-xs sm:btn-sm flex-1 shadow-md gap-1 px-2 font-medium"
              title={`Thêm size ${inStockVariant.size} vào giỏ hàng`}
              onClick={() =>
                dispatch(cartActions.add({ product, variant: inStockVariant }))
              }
            >
              <Icon name="plus" size={14} />
              <span className="truncate">Thêm ({inStockVariant.size})</span>
            </button>
          </div>
        )}
      </figure>

      <div className="card-body p-4 gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <Link
            href={`/product/${product.productId}`}
            className="flex-1 min-w-0 hover:text-primary transition-colors"
          >
            <h3 className="card-title text-sm font-medium text-base-content truncate">
              {product.name}
            </h3>
            <p className="text-xs text-base-content/60 mt-0.5">
              {product.category} • Đánh giá {product.rating}/5 ({product.soldCount} đã bán)
            </p>
          </Link>
          <span className="text-sm font-semibold text-base-content whitespace-nowrap">
            {money(product.price)}
          </span>
        </div>

        {explanationBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {explanationBadges.map((b) => (
              <span
                key={b}
                className="badge badge-soft badge-primary badge-xs h-auto max-w-full whitespace-normal break-words py-1 text-[10px] leading-relaxed"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
