'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { Product } from '@/lib/catalog';
import { cartActions } from '@/store/store';
import { Icon } from './icons';

export function ProductPurchase({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.variantId);
  const variant =
    product.variants.find((item) => item.variantId === variantId) ??
    product.variants[0];
  const dispatch = useDispatch();

  if (!variant) return null;

  return (
    <div className="space-y-6 pt-4 border-t border-base-300">
      {/* Color Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-base-content/70">Màu sắc</span>
        <div className="flex items-center gap-2 font-medium">
          <span
            className="w-4 h-4 rounded-full border border-base-300 shadow-xs inline-block"
            style={{ backgroundColor: variant.colorCode }}
          />
          <span>{variant.colorName}</span>
        </div>
      </div>

      {/* Size Selector */}
      <div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-base-content/70">Chọn kích cỡ</span>
          <span className="text-xs text-primary underline cursor-pointer hover:opacity-80">
            Bảng quy đổi size
          </span>
        </div>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kích cỡ">
          {product.variants.map((item) => {
            const isSelected = item.variantId === variant.variantId;
            return (
              <button
                key={item.variantId}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`btn btn-sm min-w-12 ${
                  isSelected ? 'btn-neutral' : 'btn-outline border-base-300'
                }`}
                onClick={() => setVariantId(item.variantId)}
              >
                {item.size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stock Notice */}
      <div className="flex items-center gap-2 text-xs text-base-content/70">
        <span
          className={`status status-xs ${
            variant.stock <= 5 ? 'status-warning' : 'status-success'
          }`}
        />
        <span>
          {variant.stock <= 5
            ? `Chỉ còn ${variant.stock} sản phẩm trong kho`
            : 'Còn hàng — sẵn sàng giao'}
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          className="btn btn-primary btn-block text-base shadow-md gap-2"
          onClick={() => dispatch(cartActions.add({ product, variant }))}
        >
          <span>Thêm vào túi mua sắm</span>
          <Icon name="bag" size={18} />
        </button>

        <Link
          href={`/try-on?variant=${variant.variantId}`}
          className="btn btn-outline btn-block text-primary border-primary/40 hover:bg-primary/10 hover:border-primary gap-2"
        >
          <Icon name="spark" size={16} />
          <span>Thử trang phục này với AI</span>
        </Link>
      </div>
    </div>
  );
}
