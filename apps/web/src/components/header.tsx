'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, cartActions } from '@/store/store';
import { categories } from '@/lib/catalog';
import { Icon } from './icons';

export function Header() {
  const count = useSelector((state: RootState) =>
    state.cart.lines.reduce((total, line) => total + line.quantity, 0)
  );
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="announcement-bar bg-neutral text-neutral-content py-2 px-4 text-xs font-medium tracking-wide flex justify-center items-center gap-6 border-b border-neutral/20">
        <span>Miễn phí giao hàng cho đơn từ 1.500.000₫</span>
        <span className="hidden sm:inline opacity-60">•</span>
        <span className="hidden sm:inline">Đổi size tận nơi trong 14 ngày</span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-base-100/95 backdrop-blur-md border-b border-base-300">
        <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 h-18">
          <div className="navbar-start gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-circle lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Icon name="menu" size={20} />
            </button>
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-neutral font-sans flex items-center"
            >
              MAISON
              <span className="font-serif italic font-normal text-primary ml-1">
                AI
              </span>
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-1 text-sm font-medium">
              <li>
                <Link href="/shop" className="hover:text-primary">
                  Hàng mới
                </Link>
              </li>
              {categories.slice(0, 4).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="hover:text-primary"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/outfits"
                  className="hover:text-primary"
                >
                  Phối đồ
                </Link>
              </li>
              <li>
                <Link
                  href="/try-on"
                  className="text-primary font-semibold flex items-center gap-1.5 hover:opacity-80"
                >
                  <span>Thử đồ trực tuyến</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="navbar-end gap-1">
            <Link
              href="/shop"
              className="btn btn-ghost btn-circle"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Icon name="search" size={20} />
            </Link>
            <Link
              href="/account"
              className="btn btn-ghost btn-circle"
              aria-label="Tài khoản cá nhân"
            >
              <Icon name="user" size={20} />
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-circle indicator"
              onClick={() => dispatch(cartActions.toggle(true))}
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
            >
              <Icon name="bag" size={20} />
              {count > 0 && (
                <span className="badge badge-primary badge-xs indicator-item">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-neutral/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-base-100 p-6 shadow-2xl flex flex-col justify-between border-r border-base-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-base-300">
                <Link
                  href="/"
                  className="text-xl font-bold tracking-tight text-neutral"
                  onClick={() => setMobileOpen(false)}
                >
                  MAISON<span className="font-serif italic font-normal text-primary ml-1">AI</span>
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-circle btn-sm"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Đóng menu"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <ul className="menu w-full px-0 py-4 gap-1 text-base">
                <li>
                  <Link href="/shop" onClick={() => setMobileOpen(false)}>
                    Hàng mới
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/shop?category=${category.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex justify-between"
                    >
                      <span>{category.label}</span>
                      <Icon name="chevron" size={16} />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/outfits" onClick={() => setMobileOpen(false)}>
                    Gợi ý phối đồ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/try-on"
                    onClick={() => setMobileOpen(false)}
                    className="text-primary font-semibold flex items-center gap-2"
                  >
                    <span>Phòng thử đồ trực tuyến</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="border-t border-base-300 pt-4 flex flex-col gap-2">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="btn btn-outline btn-block text-sm"
              >
                <Icon name="user" size={16} />
                Tài khoản của tôi
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="btn btn-ghost btn-sm text-xs text-base-content/60"
              >
                Cổng quản trị nội bộ
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
