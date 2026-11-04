/**
 * PACKAGE: controller — SearchController, SearchOrchestrator, QueryService, SearchService, RankingService
 * Locked to SYSTEM_DESIGN_LOCKED.md (v2.0 — Chuẩn PTIT)
 */

import type {
  BoundingBox,
  HardFilters,
  Modality,
  Order,
  Product,
  QueryRepresentation,
  RetrievalResult,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from '@/domain/models';
import {
  KeywordIndex,
  VectorIndex,
  normalizeVietnamese,
} from '@/dao/indexes';
import {
  OrderRepository,
  ProductRepository,
  orderRepository,
  productRepository,
} from '@/dao/repositories';
import {
  ClipImageEncoder,
  ImageEncoder,
  LlmQueryParser,
  QueryParser,
  SpeechToText,
  WebSpeechAdapter,
} from './interfaces';

const COLOR_DISPLAY_NAMES: Record<string, string> = {
  trang: 'Trắng / Kem',
  den: 'Đen',
  xam: 'Xám / Ghi',
  be: 'Be / Cát',
  nau: 'Nâu / Camel',
  xanh: 'Xanh',
  do: 'Đỏ / Rượu',
  hong: 'Hồng',
  vang: 'Vàng',
};

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  ao: 'Áo',
  quan: 'Quần',
  vay: 'Váy',
  'ao-khoac': 'Áo khoác',
  giay: 'Giày',
  'phu-kien': 'Phụ kiện',
};

export class QueryService {
  constructor(
    private readonly parser: QueryParser,
    private readonly encoder: ImageEncoder
  ) {}

  public build(
    text: string,
    image: File | string | null,
    modality: Modality,
    box?: BoundingBox,
    uiOverrides?: Partial<HardFilters>
  ): QueryRepresentation {
    const queryId = `qry-${Date.now()}`;
    const parsed = this.parser.parse(text || '');

    const hardFilters: HardFilters = {
      ...parsed.hardFilters,
    };

    if (modality === 'image' && box?.categorySlug && !hardFilters.categorySlug) {
      hardFilters.categorySlug = box.categorySlug;
    }

    // Exception 3: UI filters override extracted query filters
    if (uiOverrides) {
      if (uiOverrides.categorySlug !== undefined) {
        hardFilters.categorySlug = uiOverrides.categorySlug || undefined;
      }
      if (uiOverrides.size !== undefined) {
        hardFilters.size = uiOverrides.size || undefined;
      }
      if (uiOverrides.minPrice !== undefined) {
        hardFilters.minPrice = uiOverrides.minPrice;
      }
      if (uiOverrides.maxPrice !== undefined) {
        hardFilters.maxPrice = uiOverrides.maxPrice;
      }
      if (uiOverrides.color !== undefined) {
        hardFilters.color = uiOverrides.color || undefined;
      }
    }

    const vector =
      modality === 'image'
        ? this.encoder.encode(image, box, text)
        : parsed.textVector;

    const softTokens = [...parsed.softTokens];
    if (modality === 'image' && box) {
      softTokens.push(box.categorySlug, normalizeVietnamese(box.label));
    }

    return {
      queryId,
      rawText: text,
      modality,
      hardFilters,
      softTokens,
      relaxedFilters: [],
      vector,
      selectedBox: box,
      createdAt: new Date().toISOString(),
    };
  }
}

export class SearchService {
  private indexedCount = 0;

  constructor(
    private readonly productRepo: ProductRepository,
    private readonly keywordIndex: KeywordIndex,
    private readonly vectorIndex: VectorIndex
  ) {
    this.rebuildIndexes();
  }

  public rebuildIndexes(): void {
    const all = this.productRepo.listAll();
    if (this.indexedCount === all.length && this.indexedCount > 0) {
      return;
    }
    this.indexedCount = all.length;
    this.keywordIndex.build(all);
    this.vectorIndex.add(
      all.map((p) => p.productId),
      all.map((p) => p.textEmbedding || [])
    );
  }

  public retrieve(rep: QueryRepresentation): RetrievalResult {
    this.rebuildIndexes();

    // Step 9: Filter by hardFilters
    let allowedIds = this.productRepo.findIds(rep.hardFilters);
    let isRelaxed = false;
    let relaxedNotice: string | undefined;

    // Step 10a (Ngoại lệ 1): If < 3 products match and there is a color filter, relax color filter to soft preference
    if (allowedIds.length < 3 && rep.hardFilters.color) {
      const relaxedColor = rep.hardFilters.color;
      const colorLabel = COLOR_DISPLAY_NAMES[relaxedColor] || relaxedColor;
      rep.relaxedFilters.push(`Màu: ${colorLabel}`);
      rep.softTokens.push(relaxedColor);

      const relaxedHardFilters: HardFilters = {
        ...rep.hardFilters,
        color: undefined,
      };
      const relaxedIds = this.productRepo.findIds(relaxedHardFilters);
      if (relaxedIds.length > allowedIds.length) {
        allowedIds = relaxedIds;
        isRelaxed = true;
        relaxedNotice = `Chỉ có dưới 3 sản phẩm khớp tuyệt đối màu "${colorLabel}". Hệ thống đã tự động nới lỏng bộ lọc màu sắc thành tiêu chí ưu tiên mềm (Soft Preference) để hiển thị thêm các lựa chọn phù hợp.`;
      }
    }

    // Also if still < 3 and maxPrice was very tight from natural text, relax price slightly if category matched
    if (
      allowedIds.length === 0 &&
      rep.hardFilters.maxPrice &&
      rep.hardFilters.categorySlug
    ) {
      const prevMax = rep.hardFilters.maxPrice;
      const relaxedHardFilters: HardFilters = {
        ...rep.hardFilters,
        color: undefined,
        maxPrice: undefined,
      };
      const relaxedIds = this.productRepo.findIds(relaxedHardFilters);
      if (relaxedIds.length > 0) {
        allowedIds = relaxedIds;
        isRelaxed = true;
        rep.relaxedFilters.push(
          `Giá < ${new Intl.NumberFormat('vi-VN').format(prevMax)}₫`
        );
        relaxedNotice = `Không tìm thấy sản phẩm trong mức giá dưới ${new Intl.NumberFormat('vi-VN').format(prevMax)}₫. Hệ thống đã tự động nới lỏng điều kiện giá để gợi ý các mẫu gần nhất trong cùng danh mục.`;
      }
    }

    if (allowedIds.length === 0) {
      return {
        queryId: rep.queryId,
        allowedIds: [],
        isRelaxed,
        relaxedNotice,
        keywordScores: new Map(),
        vectorScores: new Map(),
      };
    }

    const k = Math.max(24, allowedIds.length);
    const keywordScores = this.keywordIndex.search(
      rep.softTokens,
      k,
      allowedIds
    );
    const vectorScores = this.vectorIndex.search(rep.vector, k, allowedIds);

    return {
      queryId: rep.queryId,
      allowedIds,
      isRelaxed,
      relaxedNotice,
      keywordScores,
      vectorScores,
    };
  }
}

export class RankingService {
  constructor(private readonly productRepo: ProductRepository) {}

  public generateBadges(
    product: Product,
    rep: QueryRepresentation
  ): string[] {
    const badges: string[] = [];

    if (
      rep.hardFilters.categorySlug &&
      product.categorySlug === rep.hardFilters.categorySlug
    ) {
      badges.push(
        `Đúng danh mục ${CATEGORY_DISPLAY_NAMES[product.categorySlug] || product.category}`
      );
    }

    const activeColor = rep.hardFilters.color;
    if (activeColor) {
      const prodText = normalizeVietnamese(
        `${product.name} ${product.variants.map((v) => v.colorName).join(' ')}`
      );
      if (prodText.includes(activeColor)) {
        badges.push(`Khớp màu ${COLOR_DISPLAY_NAMES[activeColor] || activeColor}`);
      }
    }

    if (rep.hardFilters.maxPrice && product.price <= rep.hardFilters.maxPrice) {
      badges.push('Trong tầm ngân sách');
    }

    if (rep.modality === 'image') {
      badges.push(
        rep.selectedBox
          ? `Tương đồng vùng: ${rep.selectedBox.label}`
          : 'Tương đồng thị giác AI'
      );
    } else if (rep.modality === 'voice') {
      badges.push('Khớp ngữ cảnh giọng nói');
    }

    if (badges.length === 0) {
      badges.push(`Phù hợp phong cách ${product.category}`);
    }

    return badges.slice(0, 3);
  }

  public rank(
    rep: QueryRepresentation,
    candidates: RetrievalResult
  ): SearchResult[] {
    const results: SearchResult[] = [];

    for (const id of candidates.allowedIds) {
      const product = this.productRepo.get(id);
      if (!product) continue;

      const kwScore = candidates.keywordScores.get(id) ?? 0.4;
      const vecScore = candidates.vectorScores.get(id) ?? 0.4;

      // Weighted hybrid score (Keyword + Vector + Rating/Popularity bonus)
      const hybrid =
        rep.modality === 'image'
          ? vecScore * 0.75 + kwScore * 0.25
          : kwScore * 0.6 + vecScore * 0.4;

      // Convert to intuitive match percentage (76% .. 99%)
      const hasQuery = Boolean(rep.rawText.trim()) || rep.modality === 'image';
      const matchPct = hasQuery
        ? Math.min(99, Math.max(76, Math.round(74 + hybrid * 25)))
        : undefined;

      const badges = hasQuery ? this.generateBadges(product, rep) : [];

      results.push({
        resultId: `res-${rep.queryId}-${id}`,
        queryId: rep.queryId,
        productId: id,
        rank: 0,
        score: Number(hybrid.toFixed(4)),
        badges,
        product: {
          ...product,
          match: matchPct,
          badges,
        },
      });
    }

    results.sort((a, b) => b.score - a.score);
    results.forEach((item, index) => {
      item.rank = index + 1;
    });

    return results;
  }
}

export class SearchOrchestrator {
  constructor(
    private readonly speechService: SpeechToText,
    private readonly queryService: QueryService,
    private readonly searchService: SearchService,
    private readonly rankingService: RankingService
  ) {}

  public search(
    text: string,
    image: File | string | null,
    modality: Modality,
    box?: BoundingBox,
    uiOverrides?: Partial<HardFilters>
  ): SearchResponse {
    const rep = this.queryService.build(
      text,
      image,
      modality,
      box,
      uiOverrides
    );
    const candidates = this.searchService.retrieve(rep);
    const results = this.rankingService.rank(rep, candidates);

    return {
      queryRepresentation: rep,
      results,
      isRelaxed: candidates.isRelaxed,
      relaxedNotice: candidates.relaxedNotice,
    };
  }

  public async transcribeVoice(audio?: Blob | null): Promise<string> {
    return this.speechService.transcribe(audio, 'vi');
  }
}

export class SearchController {
  constructor(
    private readonly orchestrator: SearchOrchestrator,
    private readonly orderRepo: OrderRepository,
    private readonly parser: QueryParser,
    private readonly encoder: ImageEncoder
  ) {}

  public search(body: SearchRequest): SearchResponse {
    const text = (body.text || '').trim();
    const modality: Modality = body.modality || 'text';

    // FR6 & FR7: Check if Customer entered an Order Code (e.g. "SF-2026-0038" or "kiểm tra đơn SF-2026-0038")
    const parsed = this.parser.parse(text);
    if (parsed.detectedOrderCode) {
      const order = this.lookupOrder(parsed.detectedOrderCode);
      const baseResp = this.orchestrator.search(
        text,
        body.imageFile ?? null,
        modality,
        body.selectedBox,
        body.uiOverrides
      );
      return {
        ...baseResp,
        matchedOrder: order,
        orderLookupCode: parsed.detectedOrderCode,
      };
    }

    return this.orchestrator.search(
      text,
      body.imageFile ?? null,
      modality,
      body.selectedBox,
      body.uiOverrides
    );
  }

  public searchImage(
    image: File | string | null,
    box?: BoundingBox,
    text: string = '',
    uiOverrides?: Partial<HardFilters>
  ): SearchResponse {
    return this.orchestrator.search(text, image, 'image', box, uiOverrides);
  }

  public detectGarmentBoxes(image: File | string | null): BoundingBox[] {
    return this.encoder.detectObjects(image);
  }

  public lookupOrder(orderCode: string): Order | null {
    return this.orderRepo.findByCode(orderCode);
  }
}

// Singleton wiring following Dependency Injection
const queryParser = new LlmQueryParser();
const imageEncoder = new ClipImageEncoder();
const speechAdapter = new WebSpeechAdapter();
const keywordIndex = new KeywordIndex();
const vectorIndex = new VectorIndex();

const queryService = new QueryService(queryParser, imageEncoder);
const searchService = new SearchService(
  productRepository,
  keywordIndex,
  vectorIndex
);
const rankingService = new RankingService(productRepository);

export const searchOrchestrator = new SearchOrchestrator(
  speechAdapter,
  queryService,
  searchService,
  rankingService
);

export const searchController = new SearchController(
  searchOrchestrator,
  orderRepository,
  queryParser,
  imageEncoder
);
