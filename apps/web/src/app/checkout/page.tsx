'use client';

import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, cartActions } from '@/store/store';
import { money, products } from '@/lib/catalog';
import { orderRepository, productRepository } from '@/dao/repositories';
import type { Order, ShippingMethodId } from '@/domain/models';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import {
  ShipmentMapSimulator,
  TRANSPORT_OPTIONS,
  TransportVehicleSvg,
} from '@/components/shipment-map-simulator';

export default function Checkout() {
  const lines = useSelector((s: RootState) => s.cart.lines);
  const dispatch = useDispatch();
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [selectedTransport, setSelectedTransport] =
    useState<ShippingMethodId>('motorbike');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read ?order=... from URL or sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const orderParam = params.get('order');
      if (orderParam) {
        const found = orderRepository.findByCode(orderParam);
        if (found) {
          setCreatedOrder(found);
          return;
        }
      }
      const rawCached = sessionStorage.getItem('smartfashion_last_order');
      if (rawCached) {
        const parsed = JSON.parse(rawCached) as Order;
        if (parsed?.orderCode) {
          setCreatedOrder(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const subtotal = lines.reduce(
    (n, l) => n + (l.variant?.price || l.product?.price || 0) * (l.quantity || 1),
    0
  );

  const activeTransportObj =
    TRANSPORT_OPTIONS.find((t) => t.id === selectedTransport) ||
    TRANSPORT_OPTIONS[0];
  const shipping = subtotal >= 2500000 ? 0 : activeTransportObj.fee;

  const handleAddSampleItems = () => {
    const p1 = products[0];
    const p2 = products[1] || products[0];
    if (p1 && p1.variants[0]) {
      dispatch(cartActions.add({ product: p1, variant: p1.variants[0] }));
    }
    if (p2 && p2.variants[0] && p2.productId !== p1?.productId) {
      dispatch(cartActions.add({ product: p2, variant: p2.variants[0] }));
    }
    dispatch(cartActions.toggle(false));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const recipientName = String(formData.get('name') || 'Nguyễn Hà Linh').trim();
      const phone = String(formData.get('phone') || '0987 654 321').trim();
      const streetAddress = String(
        formData.get('address') ||
          'Học viện Công nghệ Bưu chính Viễn thông (Km10, Đường Nguyễn Trãi)'
      ).trim();
      const city = String(formData.get('city') || 'Thành phố Hà Nội').trim();
      const district = String(formData.get('district') || 'Quận Hà Đông').trim();
      const paymentMethod =
        formData.get('payment') === 'online' ? 'online' : 'cod';

      const randomNum = Math.floor(1000 + Math.random() * 8999);
      const orderId = `ord-${Date.now()}`;
      const orderCode = `SF-2026-${randomNum}`;

      // Deduct variant stock in repository
      lines.forEach((l) => {
        if (l.variant?.variantId) {
          const nextStock = Math.max(0, (l.variant.stock || 8) - l.quantity);
          productRepository.updateVariantStock(l.variant.variantId, nextStock);
        }
      });

      const newOrder: Order = {
        orderId,
        orderCode,
        userId: 'usr-halinh',
        totalAmount: subtotal || 1490000,
        shippingFee: shipping,
        orderStatus: 'confirmed',
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
        shippingAddress: {
          recipientName: recipientName || 'Nguyễn Hà Linh',
          phone: phone || '0987 654 321',
          streetAddress:
            streetAddress ||
            'Học viện Công nghệ Bưu chính Viễn thông (Km10, Đường Nguyễn Trãi)',
          district: district || 'Quận Hà Đông',
          city: city || 'Thành phố Hà Nội',
          paymentMethod,
          shippingMethod: selectedTransport,
          originAddress: activeTransportObj.originAddress,
        },
        items: lines.map((l, idx) => ({
          orderItemId: `oi-${orderId}-${idx}`,
          orderId,
          variantId: l.variant?.variantId || `v-${idx}`,
          productId: l.product?.productId || `p-${idx}`,
          productName: l.product?.name || 'Sản phẩm MaisonAI',
          colorName: l.variant?.colorName || 'Màu tiêu chuẩn',
          size: l.variant?.size || 'M',
          imageUrl: l.product?.image || '',
          quantity: l.quantity || 1,
          unitPrice: l.variant?.price || l.product?.price || 1200000,
        })),
        createdAt: new Date().toISOString(),
      };

      // Save order to DAO repository
      orderRepository.create(newOrder);

      // Cache last order in session storage
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            'smartfashion_last_order',
            JSON.stringify(newOrder)
          );
          window.history.pushState(
            null,
            '',
            `/checkout?order=${newOrder.orderCode}`
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
          // ignore
        }
      }

      startTransition(() => {
        setCreatedOrder(newOrder);
        dispatch(cartActions.clear());
        setIsSubmitting(false);
      });
    } catch (err) {
      console.error('Error during checkout submission:', err);
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW A: ORDER CREATED -> LIVE 10s PREP + 20s MAP SIMULATION TO PTIT
  // =========================================================================
  if (createdOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Progress Steps Header */}
        <ul className="steps steps-horizontal w-full max-w-2xl mx-auto text-xs">
          <li className="step step-primary">Chọn đồ</li>
          <li className="step step-primary">Đặt hàng & Chọn phương tiện</li>
          <li className="step step-primary">
            Chuẩn bị (10s) & Vận chuyển (20s)
          </li>
          <li
            className={`step ${
              createdOrder.orderStatus === 'completed' ? 'step-primary' : ''
            }`}
          >
            Nhận hàng hoàn tất
          </li>
        </ul>

        {/* Live 10s Prep + 20s Real-time Map Shipping Simulator */}
        <ShipmentMapSimulator
          order={createdOrder}
          onOrderStatusChanged={(nextStatus) => {
            setCreatedOrder((prev) =>
              prev ? { ...prev, orderStatus: nextStatus } : null
            );
          }}
        />

        {/* Bottom Navigation Links */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-base-100 border border-base-300 rounded-box p-5 shadow-xs">
          <div className="text-xs sm:text-sm text-base-content/70">
            Mã vận đơn của bạn:{' '}
            <strong className="font-mono text-primary text-base">
              {createdOrder.orderCode}
            </strong>{' '}
            • Trạng thái hiện tại:{' '}
            <span className="badge badge-primary badge-sm uppercase">
              {createdOrder.orderStatus}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('smartfashion_last_order');
                setCreatedOrder(null);
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/checkout');
                }
                handleAddSampleItems();
              }}
              className="btn btn-outline btn-sm"
            >
              Tạo đơn hàng mới
            </button>
            <Link
              href={`/shop?q=${encodeURIComponent(createdOrder.orderCode)}`}
              className="btn btn-outline btn-sm"
            >
              Tra cứu đơn #{createdOrder.orderCode} trên Cửa hàng
            </Link>
            <Link href="/shop" className="btn btn-primary btn-sm">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: CART EMPTY -> QUICK LOAD SAMPLE ITEMS TO TEST IMMEDIATELY
  // =========================================================================
  if (!lines.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card bg-base-100 border border-base-300 p-8 sm:p-12 space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
            <Icon name="bag" size={28} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-normal text-neutral mb-2">
              Túi mua sắm hiện đang trống
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 max-w-md mx-auto leading-relaxed">
              Bạn chưa có món đồ nào trong giỏ hàng. Bạn có thể nạp ngay 2 sản phẩm mẫu bên dưới để kiểm thử trực tiếp quy trình đặt hàng và mô phỏng giao xe máy, ô tô, drone về Học viện Công nghệ Bưu chính Viễn thông.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddSampleItems}
              className="btn btn-primary btn-sm sm:btn-md shadow-md gap-2"
            >
              <Icon name="plus" size={16} />
              <span>Nạp sản phẩm mẫu để thanh toán ngay</span>
            </button>
            <Link href="/shop" className="btn btn-outline btn-sm sm:btn-md">
              Xem toàn bộ cửa hàng
            </Link>
          </div>

          <div className="pt-4 border-t border-base-300">
            <Link
              href="/shop?q=SF-2026-0038"
              className="text-xs text-primary underline font-medium"
            >
              Hoặc xem mô phỏng đơn hàng mẫu có sẵn (SF-2026-0038) →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW C: CHECKOUT FORM WITH 6 TRANSPORT OPTIONS & INSTANT SUBMIT
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <ul className="steps steps-horizontal w-full max-w-xl mx-auto mb-10 text-xs">
        <li className="step step-primary">Chọn đồ</li>
        <li className="step step-primary">Địa chỉ & Phương tiện giao hàng</li>
        <li className="step">Theo dõi bản đồ trực tiếp</li>
      </ul>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Shipping Information (Default to PTIT Ha Dong) */}
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
                  Bước 1 • Địa chỉ nhận hàng thực tế
                </span>
                <h2 className="font-serif text-2xl font-normal text-neutral">
                  Thông tin người nhận tại điểm giao
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
                    defaultValue="Nguyễn Hà Linh"
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
                    defaultValue="0987 654 321"
                    placeholder="0987 654 321"
                    autoComplete="tel"
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-base-content/70">
                    Địa chỉ nhận hàng thực tế *
                  </label>
                  <input
                    required
                    name="address"
                    defaultValue="Học viện Công nghệ Bưu chính Viễn thông (Km10, Đường Nguyễn Trãi)"
                    placeholder="Học viện Công nghệ Bưu chính Viễn thông, Km10 Nguyễn Trãi"
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
                    defaultValue="Thành phố Hà Nội"
                    placeholder="Thành phố Hà Nội"
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
                    defaultValue="Quận Hà Đông"
                    placeholder="Quận Hà Đông"
                    className="input input-bordered w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Choose Delivery Vehicle Mode */}
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
                  Bước 2 • Chọn phương thức vận chuyển (10s chuẩn bị + 20s giao trên bản đồ)
                </span>
                <h2 className="font-serif text-2xl font-normal text-neutral">
                  Phương tiện giao hàng tới Học viện Công nghệ Bưu chính Viễn thông
                </h2>
                <p className="text-xs text-base-content/60 mt-1">
                  Sau khi bấm Đặt hàng, hệ thống sẽ mô phỏng trực tiếp 10 giây đóng gói tại kho xuất phát và 20 giây phương tiện di chuyển thực tế trên bản đồ tới cổng PTIT.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRANSPORT_OPTIONS.map((opt) => {
                  const active = selectedTransport === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedTransport(opt.id)}
                      className={`card text-left p-4 border transition-all cursor-pointer ${
                        active
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : 'border-base-300 bg-base-200/30 hover:border-base-content/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-field flex items-center justify-center ${
                              active
                                ? 'bg-primary text-primary-content'
                                : 'bg-base-200 text-neutral'
                            }`}
                          >
                            <TransportVehicleSvg mode={opt.id} size={18} />
                          </div>
                          <div>
                            <strong className="text-sm font-semibold text-neutral block leading-tight">
                              {opt.name}
                            </strong>
                            <span className="text-[11px] text-primary font-medium">
                              {opt.speedLabel} • {opt.totalDistanceKm} km
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-outline badge-xs font-semibold whitespace-nowrap">
                          {money(opt.fee)}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/70 leading-relaxed mb-1.5">
                        {opt.subtitle}
                      </p>
                      <span className="text-[11px] text-base-content/50 block">
                        Xuất phát: {opt.originName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
                  Bước 3
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
                      Kiểm tra hàng tại cổng Học viện Công nghệ Bưu chính Viễn thông trước khi thanh toán
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
              id="submit-order-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-block btn-lg shadow-lg text-base"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Đang xử lý đơn hàng...</span>
                </>
              ) : (
                <span>
                  Đặt hàng & Bắt đầu Mô phỏng Giao hàng • {money(subtotal + shipping)}
                </span>
              )}
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
                  key={l.variant?.variantId || l.product?.productId}
                  className="pt-3 first:pt-0 flex gap-3 items-center"
                >
                  <img
                    src={l.product?.image}
                    alt={l.product?.name}
                    className="w-14 h-18 object-cover rounded-field bg-base-200 border border-base-300"
                  />
                  <div className="flex-1 min-w-0">
                    <strong className="text-sm font-medium block truncate">
                      {l.product?.name}
                    </strong>
                    <span className="text-xs text-base-content/60 block">
                      {l.variant?.colorName || 'Màu tiêu chuẩn'} • Size{' '}
                      {l.variant?.size || 'M'} • SL: {l.quantity}
                    </span>
                  </div>
                  <b className="text-sm font-semibold whitespace-nowrap">
                    {money((l.variant?.price || l.product?.price || 0) * l.quantity)}
                  </b>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-field bg-base-200/60 border border-base-300 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-neutral">
                <span>Phương tiện đã chọn:</span>
                <span className="text-primary">{activeTransportObj.name}</span>
              </div>
              <div className="text-base-content/60">
                Lộ trình: {activeTransportObj.originName} → Học viện Công nghệ Bưu chính Viễn thông ({activeTransportObj.totalDistanceKm} km)
              </div>
            </div>

            <div className="border-t border-base-300 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-base-content/70">
                <span>Tạm tính</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base-content/70">
                <span>Phí vận chuyển ({activeTransportObj.name})</span>
                <span>{shipping ? money(shipping) : 'Miễn phí'}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-base-content pt-3 border-t border-base-300">
                <span>Tổng cộng</span>
                <span className="text-primary font-serif text-xl">
                  {money(subtotal + shipping)}
                </span>
              </div>
            </div>

            {/* Secondary Direct Submit Button from Sidebar */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => formRef.current?.requestSubmit()}
              className="btn btn-primary btn-block text-base shadow-md"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <span>Xác nhận Đặt hàng ngay</span>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
