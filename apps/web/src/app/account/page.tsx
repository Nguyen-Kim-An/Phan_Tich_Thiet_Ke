import Link from 'next/link';
import { Icon } from '@/components/icons';

export default function Account() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Menu */}
        <aside className="lg:col-span-3">
          <div className="card bg-base-100 border border-base-300 p-4 shadow-xs">
            <div className="flex items-center gap-3 p-3 mb-2 border-b border-base-300">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                HL
              </div>
              <div>
                <h3 className="font-semibold text-sm">Hà Linh</h3>
                <p className="text-xs text-base-content/60">halinh@example.com</p>
              </div>
            </div>

            <ul className="menu w-full px-0 gap-1 text-sm">
              <li>
                <a className="active font-medium" href="#profile">
                  <Icon name="user" size={16} />
                  <span>Hồ sơ cá nhân</span>
                </a>
              </li>
              <li>
                <a href="#orders">
                  <Icon name="bag" size={16} />
                  <span>Lịch sử đơn hàng</span>
                </a>
              </li>
              <li>
                <a href="#sizes">
                  <Icon name="spark" size={16} />
                  <span>Hồ sơ dáng & Stylist AI</span>
                </a>
              </li>
              <li>
                <a href="#privacy">
                  <Icon name="close" size={16} />
                  <span>Quyền riêng tư dữ liệu</span>
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <section id="profile" className="lg:col-span-9 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
              Trung tâm tài khoản
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral">
              Xin chào, Hà Linh
            </h1>
          </div>

          {/* Recent Orders Block */}
          <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-normal text-neutral">
                Đơn hàng gần đây
              </h2>
              <Link href="/shop" className="btn btn-ghost btn-xs text-primary">
                Xem toàn bộ lịch sử
              </Link>
            </div>

            <div className="card bg-base-200/40 border border-base-300 p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-semibold">SF-2026-0038</strong>
                  <span className="badge badge-info badge-sm">Đang vận chuyển</span>
                </div>
                <p className="text-xs text-base-content/60">
                  Đặt lúc: 24.10.2026 • 2 sản phẩm (Áo lụa + Quần suông)
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <strong className="text-base font-bold text-neutral">
                  1.580.000₫
                </strong>
                <button type="button" className="btn btn-outline btn-sm">
                  Theo dõi đơn
                </button>
              </div>
            </div>
          </div>

          {/* AI Style & Measurements Preferences */}
          <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-neutral">
                  Hồ sơ phong cách cá nhân
                </h2>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Được đồng bộ với thuật toán gợi ý đồ Stylist AI
                </p>
              </div>
              <button type="button" className="btn btn-outline btn-sm">
                Cập nhật sở thích
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="card bg-base-200/50 p-4 border border-base-300">
                <span className="text-xs text-base-content/60 block mb-1">
                  Gu thẩm mỹ
                </span>
                <strong className="text-sm text-neutral">Minimalist / Clean</strong>
              </div>

              <div className="card bg-base-200/50 p-4 border border-base-300">
                <span className="text-xs text-base-content/60 block mb-1">
                  Tông màu chủ đạo
                </span>
                <strong className="text-sm text-neutral">Màu trung tính & Lạnh</strong>
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
