/**
 * PACKAGE: DAO — productDAO, orderDAO, stylistDAO
 * Locked to SYSTEM_DESIGN_LOCKED.md (v2.0 — Chuẩn PTIT)
 */

import crawledCatalog from '@/data/crawled-catalog.json';
import type {
  Category,
  HardFilters,
  Order,
  OrderStatus,
  Product,
  StylistSession,
  TryOnSession,
} from '@/domain/models';
import { computeProductFeatureVector, normalizeVietnamese } from './indexes';

export interface ProductRepository {
  get(id: string): Product | undefined;
  listAll(): Product[];
  findIds(hardFilters: HardFilters): string[];
  subtreeSlugs(slug: string): string[];
  save(product: Product): Product;
  updateVariantStock(variantId: string, newStock: number): Product | undefined;
  listCategories(): Category[];
  saveCategory(category: Category): Category;
  deleteCategory(categoryId: string): boolean;
}

const INITIAL_CATEGORIES: Category[] = [
  {
    categoryId: 'cat-root-top',
    parentId: null,
    slug: 'trang-phuc-tren',
    name: 'Trang phục thân trên',
    description: 'Nhóm danh mục cho Áo & Áo khoác',
  },
  {
    categoryId: 'cat-root-bottom',
    parentId: null,
    slug: 'trang-phuc-duoi',
    name: 'Trang phục thân dưới & Đầm',
    description: 'Nhóm danh mục cho Quần & Váy',
  },
  {
    categoryId: 'cat-root-acc',
    parentId: null,
    slug: 'phu-kien-giay',
    name: 'Giày & Phụ kiện',
    description: 'Nhóm danh mục cho Giày & Phụ kiện',
  },
  {
    categoryId: 'cat-ao',
    parentId: 'cat-root-top',
    slug: 'ao',
    name: 'Áo',
    description: 'Sơ mi, blouse lụa, áo phông và áo dệt kim',
  },
  {
    categoryId: 'cat-ao-khoac',
    parentId: 'cat-root-top',
    slug: 'ao-khoac',
    name: 'Áo khoác',
    description: 'Blazer, trench coat và áo khoác cấu trúc',
  },
  {
    categoryId: 'cat-quan',
    parentId: 'cat-root-bottom',
    slug: 'quan',
    name: 'Quần',
    description: 'Quần âu ống suông, phom barrel và quần jeans cạp cao',
  },
  {
    categoryId: 'cat-vay',
    parentId: 'cat-root-bottom',
    slug: 'vay',
    name: 'Váy',
    description: 'Đầm midi, maxi, slip dress và chân váy thanh lịch',
  },
  {
    categoryId: 'cat-giay',
    parentId: 'cat-root-acc',
    slug: 'giay',
    name: 'Giày',
    description: 'Giày loafer da mềm, giày bệt, boots và cao gót',
  },
  {
    categoryId: 'cat-phu-kien',
    parentId: 'cat-root-acc',
    slug: 'phu-kien',
    name: 'Phụ kiện',
    description: 'Túi da thủ công, khăn choàng, thắt lưng và mũ',
  },
];

const COLOR_SYNONYMS: Record<string, string[]> = {
  trang: ['trang', 'kem', 'nga', 'white', 'ivory', 'cream', 'bone', 'canvas'],
  den: ['den', 'than', 'black', 'charcoal', 'dark', 'onyx', 'ink'],
  xam: ['xam', 'ghi', 'grey', 'gray', 'silver', 'da', 'heather', 'slate'],
  be: ['be', 'beige', 'cat', 'sand', 'oat', 'nude', 'kem', 'taupe', 'khaki'],
  nau: ['nau', 'camel', 'ca phe', 'brown', 'chocolate', 'mocha', 'caramel', 'cognac', 'toffee', 'walnut'],
  xanh: ['xanh', 'navy', 'lam', 'reu', 'blue', 'green', 'sky', 'mint', 'cobalt', 'olive', 'sage', 'indigo', 'denim'],
  do: ['do', 'ruou', 'burgundy', 'red', 'wine', 'maroon', 'cherry', 'rust', 'terracotta'],
  hong: ['hong', 'pink', 'rose', 'blush', 'pastel', 'coral', 'peony', 'berry'],
  vang: ['vang', 'gold', 'yellow', 'mustard', 'bo', 'butter', 'amber'],
};

function optimizeCdnImageUrl(url: string, targetWidth = 540): string {
  if (!url || !url.includes('cdn.shopify.com')) return url;
  const updated = url.replace(/width=\d+/, `width=${targetWidth}`);
  return updated.includes('format=') ? updated : `${updated}&format=webp`;
}

function enrichRawProduct(raw: any, index: number): Product {
  const variants = (raw.variants || []).map((v: any) => ({
    ...v,
    productId: raw.productId,
    stock: typeof v.stock === 'number' ? v.stock : 8,
    stockQuantity: typeof v.stock === 'number' ? v.stock : 8,
  }));

  const optImage = optimizeCdnImageUrl(raw.image, 540);
  const optImageAlt = optimizeCdnImageUrl(raw.imageAlt || raw.image, 540);

  const p: Product = {
    productId: raw.productId,
    categoryId: `cat-${raw.categorySlug}`,
    handle: raw.handle || raw.productId,
    name: raw.name,
    category: raw.category,
    categorySlug: raw.categorySlug,
    price: raw.price,
    basePrice: raw.price,
    description: raw.description || '',
    soldCount: 28 + ((index * 19) % 240),
    rating: Number((4.5 + ((index * 3) % 6) * 0.08).toFixed(1)),
    image: optImage,
    imageAlt: optImageAlt,
    colors: raw.colors || [],
    variants,
    source: raw.source || {
      retailer: 'Everlane',
      sourcePage: '',
      productPage: '',
      images: [optImage],
    },
  };

  const vec = computeProductFeatureVector(p);
  p.textEmbedding = vec;
  p.imageEmbedding = vec;
  return p;
}

const STORAGE_KEYS = {
  PRODUCTS: 'smartfashion_dao_products_v4_fast_webp',
  CATEGORIES: 'smartfashion_dao_categories_v3',
  ORDERS: 'smartfashion_dao_orders_v4_ptit',
  STYLIST_SESSIONS: 'smartfashion_dao_stylist_v3',
};

export class JsonProductRepository implements ProductRepository {
  private products: Product[];
  private productMap: Map<string, Product> = new Map();
  private categories: Category[];
  private hydrated = false;
  private version = 1;

  constructor() {
    const baseProducts = (crawledCatalog.products as any[]).map((raw, idx) =>
      enrichRawProduct(raw, idx)
    );
    this.products = baseProducts;
    this.rebuildMap();
    this.categories = [...INITIAL_CATEGORIES];
    this.hydrateFromClientStorage();
  }

  public getVersion(): number {
    return this.version;
  }

  private rebuildMap(): void {
    this.productMap.clear();
    for (const p of this.products) {
      this.productMap.set(p.productId, p);
    }
  }

  private hydrateFromClientStorage(): void {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;
    try {
      const savedCats = window.localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCats) {
        this.categories = JSON.parse(savedCats);
      }
      const savedProds = window.localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProds) {
        const parsed = JSON.parse(savedProds) as Product[];
        if (Array.isArray(parsed) && parsed.length >= this.products.length) {
          this.products = parsed;
          this.rebuildMap();
          this.version += 1;
        }
      }
    } catch {
      // Fallback to in-memory catalog
    }
  }

  private persistToClientStorage(): void {
    this.rebuildMap();
    this.version += 1;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(this.products)
      );
      window.localStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(this.categories)
      );
    } catch {
      // Ignore storage quota errors
    }
  }

  public get(id: string): Product | undefined {
    this.hydrateFromClientStorage();
    return this.productMap.get(id);
  }

  public listAll(): Product[] {
    this.hydrateFromClientStorage();
    return this.products;
  }

  public subtreeSlugs(slug: string): string[] {
    if (!slug) return [];
    const target = this.categories.find((c) => c.slug === slug);
    if (!target) return [slug];

    const result = new Set<string>([target.slug]);
    const queue = [target.categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      for (const cat of this.categories) {
        if (cat.parentId === currentId && !result.has(cat.slug)) {
          result.add(cat.slug);
          queue.push(cat.categoryId);
        }
      }
    }
    return Array.from(result);
  }

  public findIds(hardFilters: HardFilters): string[] {
    this.hydrateFromClientStorage();
    const allowedSlugs = hardFilters.categorySlug
      ? new Set(this.subtreeSlugs(hardFilters.categorySlug))
      : null;

    const colorFilterNorm = hardFilters.color
      ? normalizeVietnamese(hardFilters.color)
      : '';
    const colorCandidates = colorFilterNorm
      ? COLOR_SYNONYMS[colorFilterNorm] || [colorFilterNorm]
      : [];

    return this.products
      .filter((product) => {
        if (allowedSlugs && !allowedSlugs.has(product.categorySlug)) {
          return false;
        }

        if (
          typeof hardFilters.maxPrice === 'number' &&
          product.price > hardFilters.maxPrice
        ) {
          return false;
        }

        if (
          typeof hardFilters.minPrice === 'number' &&
          product.price < hardFilters.minPrice
        ) {
          return false;
        }

        if (hardFilters.size) {
          const targetSize = hardFilters.size.toUpperCase();
          const hasSize = product.variants.some((v) =>
            v.size
              .toUpperCase()
              .split(/\s*\/\s*|\s+/)
              .includes(targetSize)
          );
          if (!hasSize) return false;
        }

        if (colorCandidates.length > 0) {
          const prodText = normalizeVietnamese(
            `${product.name} ${product.description} ${product.colors.join(' ')} ${product.variants
              .map((v) => v.colorName)
              .join(' ')}`
          );
          const matchesColor = colorCandidates.some((c) => prodText.includes(c));
          if (!matchesColor) return false;
        }

        return true;
      })
      .map((p) => p.productId);
  }

  public save(product: Product): Product {
    this.hydrateFromClientStorage();
    const vec = computeProductFeatureVector(product);
    const enriched: Product = {
      ...product,
      textEmbedding: vec,
      imageEmbedding: vec,
    };
    const idx = this.products.findIndex(
      (p) => p.productId === enriched.productId
    );
    if (idx >= 0) {
      this.products[idx] = enriched;
    } else {
      this.products.unshift(enriched);
    }
    this.persistToClientStorage();
    return enriched;
  }

  public updateVariantStock(
    variantId: string,
    newStock: number
  ): Product | undefined {
    this.hydrateFromClientStorage();
    for (const product of this.products) {
      const variant = product.variants.find((v) => v.variantId === variantId);
      if (variant) {
        const clamped = Math.max(0, newStock);
        variant.stock = clamped;
        variant.stockQuantity = clamped;
        this.persistToClientStorage();
        return product;
      }
    }
    return undefined;
  }

  public listCategories(): Category[] {
    this.hydrateFromClientStorage();
    return [...this.categories];
  }

  public saveCategory(category: Category): Category {
    this.hydrateFromClientStorage();
    const idx = this.categories.findIndex(
      (c) => c.categoryId === category.categoryId || c.slug === category.slug
    );
    if (idx >= 0) {
      this.categories[idx] = category;
    } else {
      this.categories.push(category);
    }
    this.persistToClientStorage();
    return category;
  }

  public deleteCategory(categoryId: string): boolean {
    this.hydrateFromClientStorage();
    const hasChildren = this.categories.some((c) => c.parentId === categoryId);
    if (hasChildren) return false;
    const before = this.categories.length;
    this.categories = this.categories.filter((c) => c.categoryId !== categoryId);
    this.persistToClientStorage();
    return this.categories.length < before;
  }
}

export class PostgresProductRepository extends JsonProductRepository {}

export class OrderRepository {
  private orders: Order[];

  constructor(productRepo: ProductRepository) {
    const allProducts = productRepo.listAll();
    const p1 = allProducts[0];
    const p2 = allProducts[58] || allProducts[1];
    const p3 = allProducts[115] || allProducts[2];

    this.orders = [
      {
        orderId: 'ord-0038',
        orderCode: 'SF-2026-0038',
        userId: 'usr-halinh',
        totalAmount: (p1?.price || 1190000) + (p2?.price || 1490000),
        shippingFee: 0,
        orderStatus: 'shipping',
        paymentStatus: 'paid',
        shippingAddress: {
          recipientName: 'Nguyễn Hà Linh',
          phone: '0987 654 321',
          streetAddress:
            'Học viện Công nghệ Bưu chính Viễn thông (Km10, Đường Nguyễn Trãi)',
          district: 'Quận Hà Đông',
          city: 'Thành phố Hà Nội',
          paymentMethod: 'online',
          shippingMethod: 'motorbike',
        },
        items: [
          {
            orderItemId: 'oi-1',
            orderId: 'ord-0038',
            variantId: p1?.variants[0]?.variantId || 'v-1',
            productId: p1?.productId || 'p-1',
            productName: p1?.name || 'Áo Sơ Mi Boxy Oxford',
            colorName: p1?.variants[0]?.colorName || 'Trắng kem',
            size: p1?.variants[0]?.size || 'S',
            imageUrl: p1?.image || '',
            quantity: 1,
            unitPrice: p1?.price || 1190000,
          },
          {
            orderItemId: 'oi-2',
            orderId: 'ord-0038',
            variantId: p2?.variants[0]?.variantId || 'v-2',
            productId: p2?.productId || 'p-2',
            productName: p2?.name || 'Quần Âu Ống Suông',
            colorName: p2?.variants[0]?.colorName || 'Đen',
            size: p2?.variants[0]?.size || 'M',
            imageUrl: p2?.image || '',
            quantity: 1,
            unitPrice: p2?.price || 1490000,
          },
        ],
        createdAt: '2026-10-24T14:30:00+07:00',
      },
      {
        orderId: 'ord-0041',
        orderCode: 'SF-2026-0041',
        userId: 'usr-minhanh',
        totalAmount: p3?.price || 1690000,
        shippingFee: 30000,
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
        shippingAddress: {
          recipientName: 'Trần Minh Anh',
          phone: '0912 345 678',
          streetAddress:
            'Học viện Công nghệ Bưu chính Viễn thông (Km10, Đường Nguyễn Trãi)',
          district: 'Quận Hà Đông',
          city: 'Thành phố Hà Nội',
          paymentMethod: 'online',
          shippingMethod: 'drone',
        },
        items: [
          {
            orderItemId: 'oi-3',
            orderId: 'ord-0041',
            variantId: p3?.variants[0]?.variantId || 'v-3',
            productId: p3?.productId || 'p-3',
            productName: p3?.name || 'Đầm Thiết Kế Tôn Dáng',
            colorName: p3?.variants[0]?.colorName || 'Be trung tính',
            size: p3?.variants[0]?.size || 'M',
            imageUrl: p3?.image || '',
            quantity: 1,
            unitPrice: p3?.price || 1690000,
          },
        ],
        createdAt: '2026-11-01T09:15:00+07:00',
      },
      {
        orderId: 'ord-0042',
        orderCode: 'SF-2026-0042',
        userId: 'usr-halinh',
        totalAmount: (p1?.price || 1190000) * 2,
        shippingFee: 0,
        orderStatus: 'new',
        paymentStatus: 'pending',
        shippingAddress: {
          recipientName: 'Nguyễn Hà Linh',
          phone: '0987 654 321',
          streetAddress:
            'Học viện Công nghệ Bưu chính Viễn thông (Km10, Đường Nguyễn Trãi)',
          district: 'Quận Hà Đông',
          city: 'Thành phố Hà Nội',
          paymentMethod: 'cod',
          shippingMethod: 'autonomous',
        },
        items: [
          {
            orderItemId: 'oi-4',
            orderId: 'ord-0042',
            variantId: p1?.variants[0]?.variantId || 'v-1',
            productId: p1?.productId || 'p-1',
            productName: p1?.name || 'Áo Sơ Mi Boxy Oxford',
            colorName: p1?.variants[0]?.colorName || 'Trắng kem',
            size: p1?.variants[0]?.size || 'M',
            imageUrl: p1?.image || '',
            quantity: 2,
            unitPrice: p1?.price || 1190000,
          },
        ],
        createdAt: '2026-11-03T16:40:00+07:00',
      },
    ];
    this.hydrate();
  }

  private hydrate(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (raw) {
        const parsed = JSON.parse(raw) as Order[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.orders = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.ORDERS,
        JSON.stringify(this.orders)
      );
    } catch {
      // ignore
    }
  }

  public findByCode(orderCode: string): Order | null {
    this.hydrate();
    const cleaned = orderCode.trim().toUpperCase();
    return (
      this.orders.find((o) => o.orderCode.toUpperCase() === cleaned) || null
    );
  }

  public listAll(): Order[] {
    this.hydrate();
    return [...this.orders];
  }

  public create(order: Order): Order {
    this.hydrate();
    this.orders.unshift(order);
    this.persist();
    return order;
  }

  public updateStatus(orderCode: string, status: OrderStatus): Order | null {
    this.hydrate();
    const target = this.orders.find(
      (o) => o.orderCode.toUpperCase() === orderCode.toUpperCase()
    );
    if (!target) return null;
    target.orderStatus = status;
    if (status === 'completed' || status === 'confirmed') {
      target.paymentStatus = 'paid';
    }
    this.persist();
    return target;
  }
}

export class StylistRepository {
  private sessions: StylistSession[] = [];
  private tryOnSessions: TryOnSession[] = [];

  public saveSession(session: StylistSession): StylistSession {
    this.sessions.unshift(session);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          STORAGE_KEYS.STYLIST_SESSIONS,
          JSON.stringify(this.sessions.slice(0, 10))
        );
      } catch {
        // ignore
      }
    }
    return session;
  }

  public getLatestSession(): StylistSession | null {
    if (this.sessions.length > 0) return this.sessions[0];
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.STYLIST_SESSIONS);
        if (raw) {
          const parsed = JSON.parse(raw) as StylistSession[];
          if (parsed.length > 0) return parsed[0];
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  public saveTryOn(tryOn: TryOnSession): TryOnSession {
    this.tryOnSessions.unshift(tryOn);
    return tryOn;
  }
}

export const productRepository = new JsonProductRepository();
export const orderRepository = new OrderRepository(productRepository);
export const stylistRepository = new StylistRepository();
