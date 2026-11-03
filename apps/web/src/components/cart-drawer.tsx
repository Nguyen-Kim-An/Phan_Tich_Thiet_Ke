'use client';

import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, cartActions } from '@/store/store';
import { money } from '@/lib/catalog';
import { Icon } from './icons';

export function CartDrawer() {
  const cart = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();

  const total = cart.lines.reduce(
    (acc, line) => acc + line.variant.price * line.quantity,
    0
  );

  const itemCount = cart.lines.reduce((acc, line) => acc + line.quantity, 0);

  if (!cart.open) return null;

  return (
    <div className="cart-drawer-root fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => dispatch(cartActions.toggle(false))}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
        aria-labelledby="cart-drawer-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-screen max-w-md bg-base-100 border-l border-base-300 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-base-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 id="cart-drawer-title" className="font-serif text-2xl font-normal">
                Túi mua sắm
              </h2>
              {itemCount > 0 && (
                <span className="badge badge-primary badge-sm font-medium">
                  {itemCount}
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm"
              onClick={() => dispatch(cartActions.toggle(false))}
              aria-label="Đóng giỏ hàng"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {cart.lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 mb-4">
                  <Icon name="bag" size={28} />
                </div>
                <h3 className="font-serif text-lg font-normal mb-1">
                  Túi đồ của bạn đang trống
                </h3>
                <p className="text-xs text-base-content/60 max-w-xs mb-6">
                  Khám phá các thiết kế mới và trải nghiệm thử đồ thông minh bằng AI.
                </p>
                <Link
                  href="/shop"
                  className="btn btn-primary btn-sm"
                  onClick={() => dispatch(cartActions.toggle(false))}
                >
                  Khám phá bộ sưu tập
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.lines.map((line) => (
                  <article
                    key={line.variant.variantId}
                    className="card card-side bg-base-200/50 border border-base-300 p-3 gap-3 items-center"
                  >
                    <figure className="w-20 h-24 shrink-0 rounded-field overflow-hidden bg-base-300">
                      <img
                        src={line.product.image}
                        alt={line.product.name}
                        className="w-full h-full object-cover"
                      />
                    </figure>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-base-content truncate">
                        {line.product.name}
                      </h4>
                      <p className="text-xs text-base-content/60 mt-0.5 mb-2">
                        {line.variant.colorName} • Size {line.variant.size}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="join border border-base-300 bg-base-100 rounded-field">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs join-item px-2"
                            onClick={() =>
                              dispatch(
                                cartActions.setQuantity({
                                  id: line.variant.variantId,
                                  quantity: line.quantity - 1,
                                })
                              )
                            }
                            aria-label="Giảm số lượng"
                          >
                            −
                          </button>
                          <span className="join-item px-2.5 text-xs font-semibold flex items-center justify-center min-w-7">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs join-item px-2"
                            onClick={() =>
                              dispatch(
                                cartActions.setQuantity({
                                  id: line.variant.variantId,
                                  quantity: line.quantity + 1,
                                })
                              )
                            }
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>

                        <strong className="text-sm font-semibold">
                          {money(line.variant.price * line.quantity)}
                        </strong>
                      </div>

                      <div className="mt-1 text-right">
                        <button
                          type="button"
                          className="text-xs text-error hover:underline cursor-pointer"
                          onClick={() =>
                            dispatch(cartActions.remove(line.variant.variantId))
                          }
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.lines.length > 0 && (
            <div className="p-5 border-t border-base-300 bg-base-100 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/70">Tạm tính</span>
                  <strong className="text-base font-semibold text-base-content">
                    {money(total)}
                  </strong>
                </div>
                <p className="text-xs text-base-content/50">
                  {total >= 1500000
                    ? '🎉 Đơn hàng được miễn phí vận chuyển toàn quốc.'
                    : 'Phí vận chuyển sẽ được tính tại bước thanh toán.'}
                </p>
              </div>

              <Link
                href="/checkout"
                className="btn btn-primary btn-block text-base shadow-md flex items-center justify-center gap-2"
                onClick={() => dispatch(cartActions.toggle(false))}
              >
                <span>Tiến hành thanh toán</span>
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
