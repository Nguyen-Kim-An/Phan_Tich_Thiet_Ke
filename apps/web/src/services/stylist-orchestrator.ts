/**
 * PACKAGE: controller — StylistController, StylistOrchestrator, BodyAnalysisService, CostumeMixerService, WearsonTryOnService
 * Locked to SYSTEM_DESIGN_LOCKED.md (v2.0 — Chuẩn PTIT)
 */

import type {
  BodyAnalysisProfile,
  Outfit,
  OutfitItem,
  Product,
  StylistPreferences,
  StylistRequest,
  StylistSession,
  TryOnSession,
} from '@/domain/models';
import { normalizeVietnamese } from '@/dao/indexes';
import {
  ProductRepository,
  StylistRepository,
  productRepository,
  stylistRepository,
} from '@/dao/repositories';
import {
  LlmQueryParser,
  QueryParser,
  SpeechToText,
  TryOnEngine,
  WearsonTryOnAdapter,
  DecartTryOnAdapter,
  WebSpeechAdapter,
} from './interfaces';

const MATERIAL_OPTIONS = [
  { label: 'Lụa / satin', keywords: ['lua', 'silk', 'satin'] },
  { label: 'Linen / đũi', keywords: ['linen', 'dui', 'flax'] },
  { label: 'Cotton', keywords: ['cotton', 'bong', 'oxford'] },
  { label: 'Len / dạ', keywords: ['len', 'wool', 'tweed', 'knit'] },
  { label: 'Denim', keywords: ['denim', 'jean'] },
  { label: 'Da', keywords: ['da', 'leather', 'suede'] },
];

function includesTerm(text: string, term: string): boolean {
  return ` ${normalizeVietnamese(text)} `.includes(
    ` ${normalizeVietnamese(term)} `
  );
}

export class BodyAnalysisService {
  private readonly profiles: BodyAnalysisProfile[] = [
    {
      bodyShape: 'Đồng hồ cát (Hourglass)',
      shoulderHipRatio: '0.98 : 1.00 (Cân đối vai – hông, thắt eo rõ)',
      undertone: 'Warm Ivory (Ấm)',
      heightEstimate: '1m63 – 1m67',
      recommendedFit:
        'Ưu tiên thiết kế chiết eo nhẹ, quần suông cạp cao và blazer cấu trúc mềm ôm vừa bờ vai.',
      avoidNote: 'Tránh phom oversized thùng thình che mất đường eo tự nhiên.',
    },
    {
      bodyShape: 'Quả lê (Pear)',
      shoulderHipRatio: '0.89 : 1.00 (Vai nhỏ thanh mảnh, hông nở)',
      undertone: 'Cool Neutral (Trung tính lạnh)',
      heightEstimate: '1m58 – 1m63',
      recommendedFit:
        'Tạo điểm nhấn ở phần thân trên bằng sơ mi cổ V hoặc blazer đệm vai nhẹ; kết hợp quần ống suông hoặc chân váy chữ A rủ mềm.',
      avoidNote: 'Hạn chế quần bó sát hông hoặc túi hộp to ở phần đùi.',
    },
    {
      bodyShape: 'Chữ nhật (Rectangle)',
      shoulderHipRatio: '0.96 : 0.97 (Tỷ lệ thanh mảnh hiện đại)',
      undertone: 'Olive Natural (Tự nhiên)',
      heightEstimate: '1m64 – 1m69',
      recommendedFit:
        'Phối nhiều tầng (layering) cùng áo khoác lửng, đầm lụa nhấn eo hoặc quần barrel tạo đường cong thị giác.',
      avoidNote: 'Tránh đầm suông thẳng một màu thiếu điểm nhấn ở thắt lưng.',
    },
  ];

  public analyze(photoUrl: string): BodyAnalysisProfile {
    if (!photoUrl) return this.profiles[0];
    let hash = 0;
    for (let i = 0; i < photoUrl.length; i++) {
      hash = (hash * 31 + photoUrl.charCodeAt(i)) % 997;
    }
    return this.profiles[hash % this.profiles.length];
  }
}

export class StylingIntentService {
  constructor(private readonly parser: QueryParser) {}

  public extractFromVoice(voiceText: string): StylistPreferences {
    const norm = normalizeVietnamese(voiceText);
    const parsed = this.parser.parse(voiceText);

    let occasion = 'Công sở & Gặp đối tác';
    if (norm.includes('tiec') || norm.includes('hen ho') || norm.includes('su kien')) {
      occasion = 'Tiệc tối & Sự kiện sang trọng';
    } else if (
      norm.includes('dao pho') ||
      norm.includes('ca phe') ||
      norm.includes('cuoi tuan')
    ) {
      occasion = 'Dạo phố & Cà phê cuối tuần';
    } else if (norm.includes('du lich') || norm.includes('nghi duong') || norm.includes('bien')) {
      occasion = 'Du lịch & Nghỉ dưỡng';
    }

    let styleVibe = 'Thanh lịch tối giản (Minimalist)';
    if (norm.includes('nu tinh') || norm.includes('mem mai') || norm.includes('lua')) {
      styleVibe = 'Nữ tính & Mềm mại (Romantic Silk)';
    } else if (
      norm.includes('ca tinh') ||
      norm.includes('hien dai') ||
      norm.includes('sac sao')
    ) {
      styleVibe = 'Hiện đại & Sắc sảo (Modern Tailored)';
    } else if (norm.includes('phong khoang') || norm.includes('nang dong') || norm.includes('thoai mai')) {
      styleVibe = 'Phóng khoáng (Smart-Casual)';
    }

    let fitGoal = 'Tôn vòng eo & Kéo dài đôi chân';
    if (norm.includes('bap tay') || norm.includes('vai')) {
      fitGoal = 'Che khuyết điểm bắp tay & Cân đối bờ vai';
    } else if (norm.includes('bung') || norm.includes('vong 2') || norm.includes('hong') || norm.includes('suong')) {
      fitGoal = 'Phom suông che vòng 2 & Thoải mái di chuyển';
    }

    const budgetLimit = parsed.hardFilters.maxPrice || 4500000;
    const preferredColors = parsed.hardFilters.color
      ? [parsed.hardFilters.color]
      : ['trang', 'den', 'be', 'xam', 'xanh'];
    const preferredMaterials = MATERIAL_OPTIONS
      .filter(({ keywords }) => keywords.some((keyword) => includesTerm(norm, keyword)))
      .map(({ label }) => label);

    return {
      occasion,
      styleVibe,
      fitGoal,
      budgetLimit,
      preferredColors,
      preferredMaterials,
      preferredSize: parsed.hardFilters.size,
      rawVoiceNote: voiceText,
    };
  }
}

export class CostumeMixerService {
  constructor(private readonly productRepo: ProductRepository) {}

  private scoreProductForPreferences(
    product: Product,
    preferences: StylistPreferences,
    seedOffset: number
  ): number {
    const prodText = normalizeVietnamese(
      `${product.name} ${product.description} ${product.colors.join(' ')}`
    );
    const prefText = normalizeVietnamese(
      `${preferences.occasion} ${preferences.styleVibe} ${preferences.fitGoal} ${
        preferences.rawVoiceNote || ''
      }`
    );

    let score = 0;

    // Color match bonus
    for (const c of preferences.preferredColors) {
      if (includesTerm(prodText, c)) {
        score += 18;
      }
    }

    for (const material of preferences.preferredMaterials) {
      const rule = MATERIAL_OPTIONS.find((option) => option.label === material);
      if (rule?.keywords.some((keyword) => includesTerm(prodText, keyword))) {
        score += 24;
      }
    }

    // Keyword overlap with occasion / styleVibe / voice tokens
    const tokens = prefText.split(' ').filter((w) => w.length >= 3);
    for (const tok of tokens) {
      if (prodText.includes(tok)) {
        score += 6;
      }
    }

    // Budget friendliness bonus (each item ideally <= 45% of total outfit budget)
    const targetItemPrice = preferences.budgetLimit * 0.42;
    if (product.price <= targetItemPrice) {
      score += 12;
    }

    // Deterministic variety seed based on preferences + productId so different quiz/voice selections surface diverse items from the 334 catalog
    const idTail = Number(product.productId.slice(-4)) || 100;
    const varietyTieBreaker = ((idTail + seedOffset * 37) % 29) * 0.35;

    return score + varietyTieBreaker;
  }

  public mixCostumes(
    bodyProfile: BodyAnalysisProfile,
    preferences: StylistPreferences
  ): Outfit[] {
    const allProducts = this.productRepo
      .listAll()
      .filter((p) => p.variants.some((v) => v.stock > 0));

    const prefSignature = normalizeVietnamese(
      `${bodyProfile.bodyShape}-${preferences.occasion}-${preferences.styleVibe}-${preferences.fitGoal}-${preferences.budgetLimit}-${preferences.rawVoiceNote || ''}`
    );
    let seed = 0;
    for (let i = 0; i < prefSignature.length; i++) {
      seed = (seed * 31 + prefSignature.charCodeAt(i)) % 997;
    }

    const rankedByCat = (slug: string): Product[] => {
      const list = allProducts.filter((p) => p.categorySlug === slug);
      const pool = list.length > 0 ? list : allProducts;
      return [...pool].sort(
        (a, b) =>
          this.scoreProductForPreferences(b, preferences, seed) -
          this.scoreProductForPreferences(a, preferences, seed)
      );
    };

    const tops = rankedByCat('ao');
    const bottoms = rankedByCat('quan');
    const dresses = rankedByCat('vay');
    const outers = rankedByCat('ao-khoac');
    const shoes = rankedByCat('giay');
    const bags = rankedByCat('phu-kien');

    const sessionId = `sty-${Date.now()}`;
    const budget = preferences.budgetLimit > 0 ? preferences.budgetLimit : Infinity;
    const usedProductIds = new Set<string>();
    const templates = [
      {
        title: 'Thành Thị Thanh Lịch',
        note: `Phối theo phong cách ${preferences.styleVibe} cho dịp ${preferences.occasion}, ưu tiên ${preferences.fitGoal.toLowerCase()}.`,
        slots: [
          { products: outers, role: 'Áo khoác Layer' as const, main: true },
          { products: tops, role: 'Áo chủ đạo' as const, main: false },
          { products: bottoms, role: 'Quần / Chân váy' as const, main: false },
        ],
      },
      {
        title: 'Đường Cắt Tinh Khôi',
        note: `Một lựa chọn ${preferences.styleVibe.toLowerCase()} cho ${preferences.occasion.toLowerCase()}, cân bằng phom dáng và tính ứng dụng.`,
        slots: [
          { products: dresses, role: 'Quần / Chân váy' as const, main: true },
          { products: outers, role: 'Áo khoác Layer' as const, main: false },
          { products: shoes, role: 'Phụ kiện / Giày' as const, main: false },
        ],
      },
      {
        title: 'Phóng Khoáng Hiện Đại',
        note: `Set đồ linh hoạt để mặc ${preferences.occasion.toLowerCase()}, phối theo ưu tiên ${preferences.fitGoal.toLowerCase()}.`,
        slots: [
          { products: tops, role: 'Áo chủ đạo' as const, main: true },
          { products: bottoms, role: 'Quần / Chân váy' as const, main: false },
          { products: bags, role: 'Phụ kiện / Giày' as const, main: false },
        ],
      },
    ];

    return templates.flatMap((template, templateIndex) => {
      const outfitId = `${sessionId}-costume-${templateIndex + 1}`;
      const choices = template.slots.map(({ products }) => {
        const available = (products.length > 0 ? products : allProducts).filter((product) =>
          product.variants.some((variant) => variant.stock > 0)
        );
        const relevant = [...available].sort(
          (a, b) =>
            this.scoreProductForPreferences(b, preferences, seed + templateIndex) -
            this.scoreProductForPreferences(a, preferences, seed + templateIndex)
        );
        const affordable = [...available].sort((a, b) => {
          const aPrice = Math.min(...a.variants.filter((v) => v.stock > 0).map((v) => v.price));
          const bPrice = Math.min(...b.variants.filter((v) => v.stock > 0).map((v) => v.price));
          return aPrice - bPrice;
        });
        const candidateMap = new Map<string, Product>();
        for (const product of [...relevant.slice(0, 24), ...affordable.slice(0, 12)]) {
          candidateMap.set(product.productId, product);
        }
        return [...candidateMap.values()];
      });

      if (choices.some((list) => list.length === 0)) return [];

      let best: { items: OutfitItem[]; score: number; totalPrice: number } | undefined;
      const selected: OutfitItem[] = [];
      const search = (slotIndex: number) => {
        if (slotIndex === template.slots.length) {
          const totalPrice = selected.reduce((sum, item) => sum + item.variant.price, 0);
          if (totalPrice > budget) return;
          const score = selected.reduce(
            (sum, item) =>
              sum +
              this.scoreProductForPreferences(item.product, preferences, seed + templateIndex) -
              (usedProductIds.has(item.productId) ? 32 : 0),
            0
          );
          if (!best || score > best.score) {
            best = { items: [...selected], score, totalPrice };
          }
          return;
        }

        for (const product of choices[slotIndex]) {
          if (selected.some((item) => item.productId === product.productId)) continue;
          const variant = [...product.variants]
            .filter((item) => item.stock > 0)
            .sort((a, b) => {
              const aSize = preferences.preferredSize && a.size.toUpperCase() === preferences.preferredSize ? 1 : 0;
              const bSize = preferences.preferredSize && b.size.toUpperCase() === preferences.preferredSize ? 1 : 0;
              return bSize - aSize || a.price - b.price;
            })[0];
          if (!variant) continue;
          const slot = template.slots[slotIndex];
          selected.push({
            outfitItemId: `oi-${outfitId}-${slotIndex}`,
            outfitId,
            productId: product.productId,
            variantId: variant.variantId,
            slotRole: slot.role,
            isMainItem: slot.main,
            product,
            variant,
          });
          search(slotIndex + 1);
          selected.pop();
        }
      };
      search(0);

      const winning = best as
        | { items: OutfitItem[]; score: number; totalPrice: number }
        | undefined;
      if (!winning) return [];
      winning.items.forEach((item) => usedProductIds.add(item.productId));
      const matchScore = Math.min(99, Math.max(50, Math.round(50 + winning.score / winning.items.length)));
      const materialBadges = preferences.preferredMaterials.slice(0, 2);

      return [{
        outfitId,
        stylistSessionId: sessionId,
        title: `Bộ 0${templateIndex + 1} — ${template.title}`,
        styleTag: preferences.styleVibe,
        occasion: preferences.occasion,
        stylistNote: template.note,
        matchScore,
        matchBadges: [preferences.occasion, preferences.styleVibe, ...materialBadges, ...(winning.totalPrice <= budget ? ['Trong ngân sách'] : [])],
        totalPrice: winning.totalPrice,
        items: winning.items,
      }];
    });
  }
}

export class WearsonTryOnService {
  constructor(private readonly engine: TryOnEngine) {}

  public async synthesize(
    userPhoto: string,
    garments: Product[],
    outfitId?: string,
    stylistSessionId?: string
  ): Promise<TryOnSession> {
    const resultImageUrl = await this.engine.synthesize(userPhoto, garments);
    return {
      sessionId: `tryon-${Date.now()}`,
      stylistSessionId,
      userImageUrl: userPhoto,
      outfitId,
      variantId: garments[0]?.variants[0]?.variantId,
      resultImageUrl,
      status: 'completed',
      fitConfidence: 0,
      drapeNote: `Đây là ảnh ghép mô phỏng ${garments.length} món đồ (${garments
        .map((g) => g.category)
        .join(' + ')}), chưa phải kết quả thử đồ hoặc phân tích phom dáng bằng AI.`,
      createdAt: new Date().toISOString(),
    };
  }
}

export class StylistOrchestrator {
  constructor(
    private readonly bodyService: BodyAnalysisService,
    private readonly speechService: SpeechToText,
    private readonly intentService: StylingIntentService,
    private readonly mixerService: CostumeMixerService,
    private readonly tryOnService: WearsonTryOnService,
    private readonly stylistRepo: StylistRepository
  ) {}

  public recommendCostumes(
    photoUrl: string,
    quizAnswers: StylistRequest['quizAnswers'],
    voiceText: string,
    mode: 'quiz' | 'voice'
  ): StylistSession {
    const bodyProfile = this.bodyService.analyze(photoUrl);

    const preferences: StylistPreferences =
      mode === 'voice' && voiceText.trim()
        ? this.intentService.extractFromVoice(voiceText)
        : {
            occasion: quizAnswers?.occasion || 'Công sở & Gặp đối tác',
            styleVibe:
              quizAnswers?.styleVibe || 'Thanh lịch tối giản (Minimalist)',
            fitGoal:
              quizAnswers?.fitGoal || 'Tôn vòng eo & Kéo dài đôi chân',
            budgetLimit: quizAnswers?.budgetLimit || 4500000,
            preferredColors: quizAnswers?.preferredColors ?? ['trang', 'den', 'be'],
            preferredMaterials: quizAnswers?.preferredMaterials || [],
            preferredSize: quizAnswers?.preferredSize,
          };

    const recommendedOutfits = this.mixerService.mixCostumes(
      bodyProfile,
      preferences
    );

    const session: StylistSession = {
      stylistSessionId: recommendedOutfits[0]?.stylistSessionId || `sty-${Date.now()}`,
      userPhotoUrl: photoUrl,
      inputMode: mode,
      bodyShape: bodyProfile.bodyShape,
      bodyProfile,
      occasion: preferences.occasion,
      styleVibe: preferences.styleVibe,
      budgetLimit: preferences.budgetLimit,
      preferences,
      voiceTranscript: mode === 'voice' ? voiceText : undefined,
      recommendedOutfits,
      createdAt: new Date().toISOString(),
    };

    this.stylistRepo.saveSession(session);
    return session;
  }

  public async tryOnCostume(
    photoUrl: string,
    outfit: Outfit
  ): Promise<TryOnSession> {
    const garments = outfit.items.map((it) => it.product);
    const tryOnSession = await this.tryOnService.synthesize(
      photoUrl,
      garments,
      outfit.outfitId,
      outfit.stylistSessionId
    );
    this.stylistRepo.saveTryOn(tryOnSession);
    return tryOnSession;
  }

  public async tryOnSingleProduct(
    photoUrl: string,
    product: Product
  ): Promise<TryOnSession> {
    const tryOnSession = await this.tryOnService.synthesize(photoUrl, [
      product,
    ]);
    this.stylistRepo.saveTryOn(tryOnSession);
    return tryOnSession;
  }

  public async recordAndTranscribeVoice(): Promise<string> {
    return this.speechService.transcribe(null, 'vi-VN');
  }
}

export class StylistController {
  constructor(private readonly stylistOrchestrator: StylistOrchestrator) {}

  public recommend(request: StylistRequest): StylistSession {
    return this.stylistOrchestrator.recommendCostumes(
      request.photoUrl,
      request.quizAnswers,
      request.voiceText || '',
      request.inputMode
    );
  }

  public async tryOn(
    userPhoto: string,
    outfit: Outfit
  ): Promise<TryOnSession> {
    return this.stylistOrchestrator.tryOnCostume(userPhoto, outfit);
  }

  public async tryOnProduct(
    userPhoto: string,
    product: Product
  ): Promise<TryOnSession> {
    return this.stylistOrchestrator.tryOnSingleProduct(userPhoto, product);
  }
}

const bodyAnalysisService = new BodyAnalysisService();
const stylingIntentService = new StylingIntentService(new LlmQueryParser());
const costumeMixerService = new CostumeMixerService(productRepository);
const wearsonTryOnService = new WearsonTryOnService(new DecartTryOnAdapter());

export const stylistOrchestrator = new StylistOrchestrator(
  bodyAnalysisService,
  new WebSpeechAdapter(),
  stylingIntentService,
  costumeMixerService,
  wearsonTryOnService,
  stylistRepository
);

export const stylistController = new StylistController(stylistOrchestrator);
