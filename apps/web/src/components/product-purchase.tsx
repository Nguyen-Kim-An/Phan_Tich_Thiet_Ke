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

  const isOutOfStock = variant.stock <= 0;

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
            const itemOut = item.stock <= 0;
            return (
              <button
                key={item.variantId}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`btn btn-sm min-w-12 ${
                  isSelected
                    ? 'btn-neutral'
                    : itemOut
                    ? 'btn-outline border-base-300 opacity-50 line-through'
                    : 'btn-outline border-base-300'
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
            isOutOfStock
              ? 'status-error'
              : variant.stock <= 5
              ? 'status-warning'
              : 'status-success'
          }`}
        />
        <span>
          {isOutOfStock
            ? 'Tạm hết hàng cho kích cỡ này'
            : variant.stock <= 5
            ? `Chỉ còn ${variant.stock} sản phẩm trong kho (Mã SKU: ${variant.sku})`
            : `Còn hàng (${variant.stock} sản phẩm) — sẵn sàng giao ngay`}
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          disabled={isOutOfStock}
          className="btn btn-primary btn-block text-base shadow-md gap-2 disabled:btn-disabled"
          onClick={() => {
            if (!isOutOfStock) {
              dispatch(cartActions.add({ product, variant }));
            }
          }}
        >
          <span>
            {isOutOfStock
              ? 'Tạm hết hàng — Vui lòng chọn size khác'
              : 'Thêm vào túi mua sắm'}
          </span>
          {!isOutOfStock && <Icon name="bag" size={18} />}
        </button>

        <Link
          href={`/try-on?variant=${variant.variantId}`}
          className="btn btn-outline btn-block text-primary border-primary/40 hover:bg-primary/10 hover:border-primary gap-2"
        >
          <Icon name="camera" size={16} />
          <span>Thử trực tiếp món này với Wearson AI</span>
        </Link>
      </div>
    </div>
  );
}
