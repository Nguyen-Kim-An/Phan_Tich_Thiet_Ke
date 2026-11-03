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
}: {
  product: Product;
  index?: number;
}) {
  const [liked, setLiked] = useState(false);
  const dispatch = useDispatch();
  const variant = product.variants[0];

  return (
    <article className="card bg-base-100 border border-base-300 overflow-hidden group hover:shadow-md transition-all duration-300">
      <figure className="relative aspect-[4/5] bg-base-200 overflow-hidden m-0">
        <Link
          href={`/product/${product.productId}`}
          aria-label={`Xem chi tiết ${product.name}`}
          className="w-full h-full block"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.imageAlt && (
            <img
              src={product.imageAlt}
              alt={`${product.name}, góc nhìn khác`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </Link>

        {product.match && (
          <span className="badge badge-primary badge-sm absolute top-3 left-3 shadow-xs font-medium">
            Khớp {product.match}%
          </span>
        )}

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

        {variant && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            <button
              type="button"
              className="btn btn-neutral btn-sm w-full shadow-md gap-2"
              onClick={() => dispatch(cartActions.add({ product, variant }))}
            >
              <Icon name="plus" size={16} />
              <span>Thêm nhanh</span>
            </button>
          </div>
        )}
      </figure>

      <div className="card-body p-4 gap-1">
        <div className="flex justify-between items-start gap-2">
          <Link
            href={`/product/${product.productId}`}
            className="flex-1 min-w-0 hover:text-primary transition-colors"
          >
            <h3 className="card-title text-sm font-medium text-base-content truncate">
              {product.name}
            </h3>
            <p className="text-xs text-base-content/60 mt-0.5">
              {product.category}
            </p>
          </Link>
          <span className="text-sm font-semibold text-base-content whitespace-nowrap">
            {money(product.price)}
          </span>
        </div>
      </div>
    </article>
  );
}
