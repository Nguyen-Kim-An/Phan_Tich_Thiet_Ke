'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { User, UserRole } from '@/domain/models';
import { money } from '@/lib/catalog';
import { orderRepository } from '@/dao/repositories';

const ACTORS: Record<UserRole, User> = {
  customer: {
    userId: 'usr-halinh',
    fullName: 'Nguyễn Hà Linh',
    email: 'halinh@maisonai.vn',
    phone: '0987 654 321',
    role: 'customer',
    createdAt: '2026-01-15T08:00:00Z',
  },
  admin: {
    userId: 'usr-admin',
    fullName: 'Quản trị viên Hệ thống',
    email: 'admin@maisonai.vn',
    phone: '0901 234 567',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
  },
};

export default function Account() {
  const [currentUser, setCurrentUser] = useState<User | null>(ACTORS.customer);
  const orders = orderRepository.listAll();

  const handleLoginAs = (role: UserRole) => {
    setCurrentUser(ACTORS[role]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Menu */}
        <aside className="lg:col-span-4">
          <div className="card bg-base-100 border border-base-300 p-5 shadow-xs space-y-5">
            <div>
              <span className="badge badge-primary badge-xs uppercase tracking-wider mb-1">
                Tài khoản & Phiên làm việc
              </span>
              <h2 className="font-serif text-xl text-neutral">
                Phiên đăng nhập hiện tại
              </h2>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3 p-3 rounded-field bg-base-200/70 border border-base-300">
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-lg">
                  {currentUser.role === 'admin' ? 'AD' : 'HL'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      {currentUser.fullName}
                    </h3>
                    <span className="badge badge-primary badge-xs uppercase">
                      {currentUser.role === 'admin' ? 'Quản trị' : 'Khách hàng'}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning alert-soft text-xs">
                Bạn đã đăng xuất khỏi phiên làm việc. Chọn vai trò bên dưới để đăng nhập lại.
              </div>
            )}

            {/* Actor Switcher */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-base-content/60 block">
                Chuyển đổi tài khoản:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoginAs('customer')}
                  className={`btn btn-sm ${
                    currentUser?.role === 'customer'
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => handleLoginAs('admin')}
                  className={`btn btn-sm ${
                    currentUser?.role === 'admin'
                      ? 'btn-neutral'
                      : 'btn-outline'
                  }`}
                >
                  Quản trị viên
                </button>
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setCurrentUser(null)}
                  className="btn btn-ghost btn-xs btn-block text-error"
                >
                  Đăng xuất
                </button>
              )}
            </div>

            {currentUser?.role === 'admin' && (
              <Link href="/admin" className="btn btn-neutral btn-sm btn-block">
                Mở Bảng điều khiển Quản trị
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <section id="profile" className="lg:col-span-8 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
              Trung tâm tài khoản
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral">
              {currentUser
                ? `Xin chào, ${currentUser.fullName}`
                : 'Vui lòng đăng nhập'}
            </h1>
          </div>

          {/* Recent Orders Block */}
          <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-neutral">
                  Lịch sử & Tra cứu đơn hàng
                </h2>
                <p className="text-xs text-base-content/60">
                  Theo dõi trạng thái giao nhận của các đơn đặt hàng gần nhất.
                </p>
              </div>
              <Link href="/shop" className="btn btn-ghost btn-xs text-primary">
                Mua sắm thêm
              </Link>
            </div>

            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="card bg-base-200/40 border border-base-300 p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-mono font-semibold text-primary">
                        {ord.orderCode}
                      </strong>
                      <span className="badge badge-info badge-sm uppercase">
                        {ord.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/60">
                      Đặt lúc:{' '}
                      {new Date(ord.createdAt).toLocaleDateString('vi-VN')} •{' '}
                      {ord.items.map((i) => i.productName).join(' + ')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <strong className="text-base font-bold text-neutral">
                      {money(ord.totalAmount + ord.shippingFee)}
                    </strong>
                    <Link
                      href={`/shop?q=${encodeURIComponent(ord.orderCode)}`}
                      className="btn btn-outline btn-sm"
                    >
                      Xem chi tiết đơn
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Style & Measurements Preferences */}
          <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-neutral">
                  Hồ sơ phong cách & Số đo vóc dáng
                </h2>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Được lưu trữ để gợi ý kích cỡ và phối bộ trang phục phù hợp nhất
                </p>
              </div>
              <Link href="/outfits" className="btn btn-primary btn-sm">
                Mở Phòng Tư Vấn Phối Đồ
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="card bg-base-200/50 p-4 border border-base-300">
                <span className="text-xs text-base-content/60 block mb-1">
                  Dáng người đã phân tích
                </span>
                <strong className="text-sm text-neutral">
                  Đồng hồ cát (Hourglass)
                </strong>
              </div>

              <div className="card bg-base-200/50 p-4 border border-base-300">
                <span className="text-xs text-base-content/60 block mb-1">
                  Tông màu & Sắc độ da
                </span>
                <strong className="text-sm text-neutral">
                  Warm Ivory • Trung tính ấm
                </strong>
              </div>

              <div className="card bg-base-200/50 p-4 border border-base-300">
                <span className="text-xs text-base-content/60 block mb-1">
                  Kích cỡ khuyến nghị
                </span>
                <strong className="text-sm text-neutral">Áo S / Quần M</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
