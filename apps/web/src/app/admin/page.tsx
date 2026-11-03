import Link from 'next/link';

const inventory = [
  ['SM-LIN-WHT-S', 'Sơ mi Linen Form Rộng', 'Trắng ngà / S', '12'],
  ['SM-LIN-WHT-M', 'Sơ mi Linen Form Rộng', 'Trắng ngà / M', '8'],
  ['V-LUA-BLU-S', 'Váy Lụa No. 07', 'Xanh khói / S', '5'],
  ['BLZ-GRY-M', 'Blazer Cấu Trúc Mềm', 'Xám đá / M', '3'],
];

export default function Admin() {
  return (
    <div className="admin-shell min-h-screen bg-base-200/50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-neutral text-neutral-content p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="text-xl font-bold tracking-tight mb-8">
            SF<span className="font-serif italic font-normal text-accent ml-1">Admin</span>
          </div>

          <ul className="menu w-full px-0 gap-1 text-sm text-neutral-content/80">
            <li>
              <a className="active font-semibold text-neutral-content bg-neutral-content/10">
                Tổng quan vận hành
              </a>
            </li>
            <li>
              <a>Quản lý sản phẩm</a>
            </li>
            <li>
              <a className="flex justify-between">
                <span>Kho hàng</span>
                <span className="badge badge-warning badge-xs">2</span>
              </a>
            </li>
            <li>
              <a>Đơn đặt hàng</a>
            </li>
            <li>
              <a>Chiến dịch khuyến mãi</a>
            </li>
            <li>
              <a>Phân tích dữ liệu AI</a>
            </li>
          </ul>
        </div>

        <div className="pt-8 border-t border-neutral-content/20 mt-8">
          <Link
            href="/"
            className="btn btn-outline btn-sm btn-block text-neutral-content border-neutral-content/30 hover:border-accent hover:text-accent"
          >
            ← Về cửa hàng chính
          </Link>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <span className="text-xs text-base-content/60 block">
              Thứ Ba, 03.11.2026 • Hệ thống hoạt động bình thường
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral mt-1">
              Tổng quan vận hành
            </h1>
          </div>
          <button type="button" className="btn btn-primary btn-sm gap-2">
            <span>+ Thêm sản phẩm mới</span>
          </button>
        </header>

        {/* DaisyUI Stats Component */}
        <section className="stats stats-vertical lg:stats-horizontal shadow-sm border border-base-300 w-full bg-base-100 mb-8">
          <div className="stat">
            <div className="stat-title text-xs">Doanh thu tháng này</div>
            <div className="stat-value text-primary font-serif text-3xl">284,6 tr</div>
            <div className="stat-desc text-success">↗︎ 12,4% so với tháng trước</div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs">Đơn đặt hàng</div>
            <div className="stat-value text-neutral font-serif text-3xl">428</div>
            <div className="stat-desc">38 đơn đang chờ đóng gói</div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs">Chuyển đổi thử đồ AI</div>
            <div className="stat-value text-info font-serif text-3xl">18,2%</div>
            <div className="stat-desc">1.240 lượt dùng phòng thử ảo</div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs">Cảnh báo kho</div>
            <div className="stat-value text-warning font-serif text-3xl">2 SKU</div>
            <div className="stat-desc text-warning">Cần nhập hàng bổ sung</div>
          </div>
        </section>

        {/* Analytic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-7 card bg-base-100 border border-base-300 p-6 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-serif text-xl font-normal">Doanh thu 7 ngày qua</h3>
                <span className="text-xs text-base-content/60">Doanh thu trung bình theo ngày</span>
              </div>
              <strong className="text-lg font-bold text-primary font-serif">
                68,4 triệu ₫
              </strong>
            </div>

            <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-base-300 px-2">
              {[
                { day: 'T4', h: 42, val: '8.2 tr' },
                { day: 'T5', h: 57, val: '9.4 tr' },
                { day: 'T6', h: 48, val: '8.8 tr' },
                { day: 'T7', h: 74, val: '12.1 tr' },
                { day: 'CN', h: 66, val: '11.0 tr' },
                { day: 'T2', h: 91, val: '14.5 tr' },
                { day: 'T3', h: 80, val: '12.8 tr' },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div
                    className="w-full bg-primary/80 group-hover:bg-primary transition-all rounded-t-xs"
                    style={{ height: `${item.h}%` }}
                    title={`${item.day}: ${item.val}`}
                  />
                  <span className="text-xs text-base-content/60 font-medium">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="lg:col-span-5 card bg-base-100 border border-base-300 p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-xl font-normal">Trạng thái đơn hàng</h3>
            <div className="space-y-4 pt-2">
              {[
                { label: 'Đơn mới tạo', count: 18, pct: '38%', color: 'progress-info' },
                { label: 'Đã xác nhận thanh toán', count: 12, pct: '25%', color: 'progress-success' },
                { label: 'Đang vận chuyển', count: 15, pct: '31%', color: 'progress-primary' },
                { label: 'Cần hỗ trợ đổi size', count: 3, pct: '6%', color: 'progress-warning' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.label}</span>
                    <span>{item.count} đơn ({item.pct})</span>
                  </div>
                  <progress
                    className={`progress ${item.color} w-full`}
                    value={parseInt(item.pct, 10)}
                    max="100"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Table with DaisyUI Table */}
        <div className="card bg-base-100 border border-base-300 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-base-300 flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl font-normal">Tồn kho theo biến thể</h3>
              <p className="text-xs text-base-content/60">Theo dõi mức tồn để kích hoạt bổ sung</p>
            </div>
            <button type="button" className="btn btn-outline btn-xs">
              Xuất báo cáo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-base-300 text-base-content/70">
                  <th>Mã SKU</th>
                  <th>Sản phẩm</th>
                  <th>Phân loại & Size</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row, i) => (
                  <tr key={row[0]}>
                    <td className="font-mono text-xs">{row[0]}</td>
                    <td className="font-medium">{row[1]}</td>
                    <td>{row[2]}</td>
                    <td className="font-semibold">{row[3]}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          i > 2
                            ? 'badge-error'
                            : i > 1
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {i > 2 ? 'Sắp hết hàng' : i > 1 ? 'Theo dõi' : 'Ổn định'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
