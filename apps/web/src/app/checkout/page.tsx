'use client';

import { FormEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, cartActions } from '@/store/store';
import { money } from '@/lib/catalog';
import Link from 'next/link';
import { Icon } from '@/components/icons';

export default function Checkout() {
  const lines = useSelector((s: RootState) => s.cart.lines);
  const dispatch = useDispatch();
  const [done, setDone] = useState(false);

  const subtotal = lines.reduce(
    (n, l) => n + l.variant.price * l.quantity,
    0
  );
  const shipping = subtotal >= 1500000 ? 0 : 30000;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
    dispatch(cartActions.clear());
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="card bg-base-100 border border-base-300 shadow-xl p-8 sm:p-12 space-y-6">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral mb-2">
              Đơn hàng đã hoàn tất!
            </h1>
            <p className="text-sm text-base-content/70">
              Mã vận đơn của bạn:{' '}
              <span className="font-mono font-semibold text-primary">
                SF-2026-0042
              </span>
            </p>
          </div>
          <p className="text-xs text-base-content/60 leading-relaxed">
            Chúng tôi đã gửi email xác nhận chi tiết cùng mã tra cứu đơn hàng đến email của bạn. MaisonAI sẽ bắt đầu đóng gói và giao đến bạn sớm nhất.
          </p>
          <div className="pt-2">
            <Link href="/shop" className="btn btn-primary btn-block">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="card bg-base-100 border border-base-300 p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
            <Icon name="bag" size={24} />
          </div>
          <h1 className="font-serif text-2xl font-normal">
            Túi mua sắm đang trống
          </h1>
          <p className="text-xs text-base-content/60">
            Bạn chưa chọn món đồ nào để thanh toán.
          </p>
          <Link href="/shop" className="btn btn-primary btn-sm">
            Khám phá bộ sưu tập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* DaisyUI Steps */}
      <ul className="steps steps-horizontal w-full max-w-xl mx-auto mb-10 text-xs">
        <li className="step step-primary">Chọn đồ</li>
        <li className="step step-primary">Địa chỉ & Thanh toán</li>
        <li className="step">Hoàn tất</li>
      </ul>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipping Information */}
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
                  Bước 1
                </span>
                <h2 className="font-serif text-2xl font-normal text-neutral">
                  Thông tin nhận hàng
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-base-content/70">
                    Họ và tên người nhận *
                  </label>
                  <input
                    required
                    name="name"
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-base-content/70">
                    Số điện thoại *
                  </label>
                  <input
                    required
                    name="phone"
                    placeholder="0987 654 321"
                    autoComplete="tel"
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-base-content/70">
                    Địa chỉ nhận hàng (Số nhà, tên đường) *
                  </label>
                  <input
                    required
                    name="address"
                    placeholder="123 Đường Lê Lợi, Phường Bến Nghé"
                    autoComplete="street-address"
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-base-content/70">
                    Tỉnh / Thành phố *
                  </label>
                  <input
                    required
                    name="city"
                    placeholder="TP. Hồ Chí Minh"
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-base-content/70">
                    Quận / Huyện *
                  </label>
                  <input
                    required
                    name="district"
                    placeholder="Quận 1"
                    className="input input-bordered w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
                  Bước 2
                </span>
                <h2 className="font-serif text-2xl font-normal text-neutral">
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                <label className="card bg-base-200/40 border border-base-300 p-4 flex flex-row items-center gap-3 cursor-pointer hover:border-primary">
                  <input
                    defaultChecked
                    type="radio"
                    name="payment"
                    value="cod"
                    className="radio radio-primary radio-sm"
                  />
                  <div>
                    <strong className="text-sm block">
                      Thanh toán khi nhận hàng (COD)
                    </strong>
                    <span className="text-xs text-base-content/60">
                      Kiểm tra hàng trước khi thanh toán tiền mặt cho shipper
                    </span>
                  </div>
                </label>

                <label className="card bg-base-200/40 border border-base-300 p-4 flex flex-row items-center gap-3 cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    className="radio radio-primary radio-sm"
                  />
                  <div>
                    <strong className="text-sm block">
                      Chuyển khoản trực tuyến (VNPay / MoMo QR)
                    </strong>
                    <span className="text-xs text-base-content/60">
                      Quét mã QR tiện lợi qua mọi ứng dụng ngân hàng
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg shadow-lg text-base"
            >
              Đặt hàng ngay • {money(subtotal + shipping)}
            </button>
          </form>
        </div>

        {/* Order Summary Column */}
        <aside className="lg:col-span-5">
          <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-6 lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl font-normal text-neutral pb-3 border-b border-base-300">
              Đơn hàng của bạn ({lines.length})
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1 divide-y divide-base-300">
              {lines.map((l) => (
                <div
                  key={l.variant.variantId}
                  className="pt-3 first:pt-0 flex gap-3 items-center"
                >
                  <img
                    src={l.product.image}
                    alt={l.product.name}
                    className="w-14 h-18 object-cover rounded-field bg-base-200 border border-base-300"
                  />
                  <div className="flex-1 min-w-0">
                    <strong className="text-sm font-medium block truncate">
                      {l.product.name}
                    </strong>
                    <span className="text-xs text-base-content/60 block">
                      {l.variant.colorName} • Size {l.variant.size} • SL:{' '}
                      {l.quantity}
                    </span>
                  </div>
                  <b className="text-sm font-semibold whitespace-nowrap">
                    {money(l.variant.price * l.quantity)}
                  </b>
                </div>
              ))}
            </div>

            <div className="border-t border-base-300 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-base-content/70">
                <span>Tạm tính</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base-content/70">
                <span>Phí vận chuyển</span>
                <span>{shipping ? money(shipping) : 'Miễn phí'}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-base-content pt-3 border-t border-base-300">
                <span>Tổng cộng</span>
                <span className="text-primary font-serif text-xl">
                  {money(subtotal + shipping)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
