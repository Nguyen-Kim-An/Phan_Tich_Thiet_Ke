'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import type { Category, Order, OrderStatus, Product } from '@/domain/models';
import { money } from '@/lib/catalog';
import { orderRepository, productRepository } from '@/dao/repositories';
import { Icon } from '@/components/icons';

type AdminTab = 'products' | 'categories' | 'orders';

export default function AdminDashboardUI() {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>(() =>
    productRepository.listAll()
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    productRepository.listCategories()
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    orderRepository.listAll()
  );

  // Manage Product Form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategorySlug, setProdCategorySlug] = useState('ao');
  const [prodPrice, setProdPrice] = useState(1250000);
  const [prodColor, setProdColor] = useState('Trắng ngà');
  const [prodSize, setProdSize] = useState('M');
  const [prodStock, setProdStock] = useState(10);

  // Manage Category Form state
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState<string>('cat-root-top');
  const [catDesc, setCatDesc] = useState('');

  const refreshData = () => {
    setProducts(productRepository.listAll());
    setCategories(productRepository.listCategories());
    setOrders(orderRepository.listAll());
  };

  const handleAddProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const id = `prod-${Date.now()}`;
    const catObj = categories.find((c) => c.slug === prodCategorySlug);
    const sampleImg = products[0]?.image || '';

    const newProd: Product = {
      productId: id,
      categoryId: catObj?.categoryId || 'cat-ao',
      handle: id,
      name: prodName.trim(),
      category: catObj?.name || 'Áo',
      categorySlug: prodCategorySlug,
      price: Number(prodPrice),
      basePrice: Number(prodPrice),
      description: `${prodName.trim()} thuộc bộ sưu tập MaisonAI 2026.`,
      soldCount: 1,
      rating: 4.9,
      image: sampleImg,
      imageAlt: sampleImg,
      colors: ['#f5f3ef'],
      variants: [
        {
          variantId: `var-${id}-1`,
          productId: id,
          sku: `SKU-${Date.now().toString().slice(-5)}`,
          colorCode: '#f5f3ef',
          colorName: prodColor,
          size: prodSize,
          price: Number(prodPrice),
          stock: Number(prodStock),
          stockQuantity: Number(prodStock),
        },
      ],
      source: {
        retailer: 'MaisonAI Atelier',
        sourcePage: '',
        productPage: '',
        images: [sampleImg],
      },
    };

    productRepository.save(newProd);
    refreshData();
    setProdName('');
    setShowAddProduct(false);
  };

  const handleStockChange = (variantId: string, newStock: number) => {
    productRepository.updateVariantStock(variantId, newStock);
    refreshData();
  };

  const handleSaveCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;
    const newCat: Category = {
      categoryId: `cat-${catSlug.trim()}`,
      parentId: catParentId || null,
      slug: catSlug.trim().toLowerCase(),
      name: catName.trim(),
      description: catDesc.trim() || `Danh mục ${catName.trim()}`,
    };
    productRepository.saveCategory(newCat);
    refreshData();
    setCatName('');
    setCatSlug('');
    setCatDesc('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    productRepository.deleteCategory(categoryId);
    refreshData();
  };

  const handleUpdateOrderStatus = (orderCode: string, status: OrderStatus) => {
    orderRepository.updateStatus(orderCode, status);
    refreshData();
  };

  const lowStockCount = products.reduce(
    (acc, p) => acc + p.variants.filter((v) => v.stock <= 3).length,
    0
  );

  return (
    <div className="admin-shell min-h-screen bg-base-200/50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-neutral text-neutral-content p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="text-xl font-bold tracking-tight mb-2">
            MAISON
            <span className="font-serif italic font-normal text-accent ml-1">
              Admin
            </span>
          </div>
          <p className="text-xs text-neutral-content/60 mb-6">
            Trung tâm Quản trị Cửa hàng
          </p>

          <ul className="menu w-full px-0 gap-1.5 text-sm text-neutral-content/80">
            <li>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={
                  activeTab === 'products'
                    ? 'active font-semibold text-neutral-content bg-neutral-content/15'
                    : ''
                }
              >
                <span>Quản lý sản phẩm & Kho</span>
                {lowStockCount > 0 && (
                  <span className="badge badge-warning badge-xs">
                    {lowStockCount}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={
                  activeTab === 'categories'
                    ? 'active font-semibold text-neutral-content bg-neutral-content/15'
                    : ''
                }
              >
                <span>Quản lý danh mục</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={
                  activeTab === 'orders'
                    ? 'active font-semibold text-neutral-content bg-neutral-content/15'
                    : ''
                }
              >
                <span>Quản lý đơn hàng</span>
                <span className="badge badge-info badge-xs">{orders.length}</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="pt-8 border-t border-neutral-content/20 mt-8 space-y-2">
          <Link
            href="/account"
            className="btn btn-ghost btn-xs btn-block text-neutral-content/70"
          >
            Tài khoản & Phân quyền
          </Link>
          <Link
            href="/"
            className="btn btn-outline btn-sm btn-block text-neutral-content border-neutral-content/30 hover:border-accent hover:text-accent"
          >
            Về cửa hàng chính
          </Link>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl space-y-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-xs text-base-content/60 block">
              Bảng Điều Khiển Quản Trị Hệ Thống
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral mt-1">
              {activeTab === 'products' && 'Quản lý sản phẩm & Tồn kho'}
              {activeTab === 'categories' &&
                'Quản lý cây danh mục (Cha – Con)'}
              {activeTab === 'orders' && 'Quản lý & Cập nhật đơn hàng'}
            </h1>
          </div>

          {activeTab === 'products' && (
            <button
              type="button"
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="btn btn-primary btn-sm gap-2"
            >
              <Icon name="plus" size={15} />
              <span>Thêm sản phẩm mới</span>
            </button>
          )}
        </header>

        {/* Stats Component */}
        <section className="stats stats-vertical lg:stats-horizontal shadow-sm border border-base-300 w-full bg-base-100">
          <div className="stat">
            <div className="stat-title text-xs">Tổng số sản phẩm</div>
            <div className="stat-value text-primary font-serif text-3xl">
              {products.length} mẫu
            </div>
            <div className="stat-desc text-success">
              Đang đồng bộ trên 6 danh mục thời trang
            </div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs">Cây danh mục</div>
            <div className="stat-value text-neutral font-serif text-3xl">
              {categories.length} nhóm
            </div>
            <div className="stat-desc">
              {categories.filter((c) => !c.parentId).length} danh mục cha •{' '}
              {categories.filter((c) => c.parentId).length} danh mục con
            </div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs">Tổng đơn đặt hàng</div>
            <div className="stat-value text-info font-serif text-3xl">
              {orders.length} đơn
            </div>
            <div className="stat-desc">
              Tra cứu tức thì qua mã SF-2026-xxxx
            </div>
          </div>

          <div className="stat">
            <div className="stat-title text-xs">Cảnh báo tồn kho thấp</div>
            <div className="stat-value text-warning font-serif text-3xl">
              {lowStockCount} SKU
            </div>
            <div className="stat-desc text-warning">
              Các biến thể có tồn kho dưới 3 sản phẩm
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TAB 1: MANAGE PRODUCT & INVENTORY                                 */}
        {/* ================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {showAddProduct && (
              <form
                onSubmit={handleAddProduct}
                className="card bg-base-100 border-2 border-primary/40 p-6 shadow-md space-y-4"
              >
                <h3 className="font-serif text-xl text-neutral">
                  Thêm sản phẩm mới vào kho hàng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tên sản phẩm *</label>
                    <input
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="VD: Áo Sơ Mi Lụa Cổ Đức"
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Danh mục</label>
                    <select
                      value={prodCategorySlug}
                      onChange={(e) => setProdCategorySlug(e.target.value)}
                      className="select select-bordered select-sm w-full"
                    >
                      {categories
                        .filter((c) => c.parentId !== null)
                        .map((c) => (
                          <option key={c.categoryId} value={c.slug}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Giá bán (VNĐ)</label>
                    <input
                      type="number"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Màu sắc biến thể</label>
                    <input
                      value={prodColor}
                      onChange={(e) => setProdColor(e.target.value)}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Size</label>
                    <select
                      value={prodSize}
                      onChange={(e) => setProdSize(e.target.value)}
                      className="select select-bordered select-sm w-full"
                    >
                      {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Số lượng tồn kho</label>
                    <input
                      type="number"
                      min={0}
                      value={prodStock}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Lưu sản phẩm
                  </button>
                </div>
              </form>
            )}

            <div className="card bg-base-100 border border-base-300 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-base-300 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h3 className="font-serif text-xl font-normal">
                    Bảng tồn kho theo biến thể
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Điều chỉnh số lượng tồn kho trực tiếp theo từng mã SKU sản phẩm.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-base-300 text-base-content/70">
                      <th>Mã SKU</th>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Màu & Size</th>
                      <th>Giá bán</th>
                      <th>Tồn kho</th>
                      <th>Trạng thái</th>
                      <th>Điều chỉnh tồn kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 24).map((p) => {
                      const v = p.variants[0];
                      if (!v) return null;
                      return (
                        <tr key={v.variantId}>
                          <td className="font-mono text-xs">{v.sku}</td>
                          <td>
                            <Link
                              href={`/product/${p.productId}`}
                              className="font-medium hover:text-primary underline"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td>{p.category}</td>
                          <td>
                            {v.colorName} / {v.size}
                          </td>
                          <td>{money(v.price)}</td>
                          <td className="font-bold">{v.stock}</td>
                          <td>
                            <span
                              className={`badge badge-sm ${
                                v.stock <= 0
                                  ? 'badge-error'
                                  : v.stock <= 3
                                  ? 'badge-warning'
                                  : 'badge-success'
                              }`}
                            >
                              {v.stock <= 0
                                ? 'Hết hàng'
                                : v.stock <= 3
                                ? 'Sắp hết'
                                : 'Còn hàng'}
                            </span>
                          </td>
                          <td>
                            <div className="join">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStockChange(v.variantId, v.stock - 1)
                                }
                                className="btn btn-outline btn-xs join-item"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStockChange(v.variantId, v.stock + 1)
                                }
                                className="btn btn-outline btn-xs join-item"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStockChange(
                                    v.variantId,
                                    v.stock > 0 ? 0 : 10
                                  )
                                }
                                className="btn btn-ghost btn-xs join-item text-xs"
                              >
                                {v.stock > 0 ? 'Đặt = 0' : 'Nhập +10'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: MANAGE CATEGORY                                            */}
        {/* ================================================================= */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleSaveCategory}
              className="lg:col-span-5 card bg-base-100 border border-base-300 p-6 shadow-xs space-y-4"
            >
              <h3 className="font-serif text-xl text-neutral">
                Thêm danh mục mới
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-medium">Tên danh mục *</label>
                <input
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="VD: Áo Len Cashmere"
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Slug định danh *</label>
                <input
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="VD: ao-len"
                  className="input input-bordered input-sm w-full font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Danh mục cha
                </label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">-- Không có (Danh mục gốc cấp 1) --</option>
                  {categories
                    .filter((c) => c.parentId === null)
                    .map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Mô tả</label>
                <input
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn..."
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm btn-block"
              >
                Lưu danh mục
              </button>
            </form>

            <div className="lg:col-span-7 card bg-base-100 border border-base-300 p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-xl text-neutral">
                Cấu trúc cây danh mục hiện tại
              </h3>
              <div className="space-y-4">
                {categories
                  .filter((root) => root.parentId === null)
                  .map((root) => {
                    const children = categories.filter(
                      (c) => c.parentId === root.categoryId
                    );
                    return (
                      <div
                        key={root.categoryId}
                        className="card bg-base-200/50 border border-base-300 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="badge badge-neutral badge-xs mr-2">
                              Danh mục Cha
                            </span>
                            <strong className="text-sm">{root.name}</strong>
                            <span className="text-xs font-mono text-base-content/60 ml-2">
                              /{root.slug}
                            </span>
                          </div>
                          <span className="text-xs text-base-content/60">
                            {children.length} danh mục con
                          </span>
                        </div>

                        <div className="pl-4 border-l-2 border-primary/30 space-y-1.5 pt-1">
                          {children.map((child) => (
                            <div
                              key={child.categoryId}
                              className="flex items-center justify-between bg-base-100 p-2 rounded-field border border-base-300 text-xs"
                            >
                              <div>
                                <strong>{child.name}</strong>{' '}
                                <span className="font-mono text-base-content/60">
                                  ({child.slug})
                                </span>{' '}
                                — {child.description}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCategory(child.categoryId)
                                }
                                className="btn btn-ghost btn-xs text-error"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: MANAGE ORDER                                               */}
        {/* ================================================================= */}
        {activeTab === 'orders' && (
          <div className="card bg-base-100 border border-base-300 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-base-300">
              <h3 className="font-serif text-xl font-normal">
                Danh sách đơn đặt hàng
              </h3>
              <p className="text-xs text-base-content/60">
                Cập nhật trạng thái đơn hàng tại đây sẽ phản ánh ngay lập tức khi khách hàng tra cứu mã đơn trên thanh tìm kiếm.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-base-300 text-base-content/70">
                    <th>Mã vận đơn</th>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái hiện tại</th>
                    <th>Cập nhật tiến trình</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.orderId}>
                      <td className="font-mono font-bold text-primary">
                        <Link
                          href={`/shop?q=${encodeURIComponent(ord.orderCode)}`}
                          className="underline"
                        >
                          {ord.orderCode}
                        </Link>
                      </td>
                      <td>
                        <div className="font-medium">
                          {ord.shippingAddress.recipientName}
                        </div>
                        <div className="text-xs text-base-content/60">
                          {ord.shippingAddress.phone} • {ord.shippingAddress.city}
                        </div>
                      </td>
                      <td>
                        {ord.items.map((it) => (
                          <div key={it.orderItemId} className="text-xs">
                            • {it.productName} ({it.size}) × {it.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="font-semibold">
                        {money(ord.totalAmount + ord.shippingFee)}
                      </td>
                      <td>
                        <span className="badge badge-outline badge-sm uppercase">
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td>
                        <select
                          value={ord.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrderStatus(
                              ord.orderCode,
                              e.target.value as OrderStatus
                            )
                          }
                          aria-label={`Trạng thái đơn ${ord.orderCode}`}
                          className="select select-bordered select-xs"
                        >
                          <option value="new">Mới tạo</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="shipping">Đang giao hàng</option>
                          <option value="completed">Hoàn tất</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
