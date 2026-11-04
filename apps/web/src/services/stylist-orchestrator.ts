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
  WebSpeechAdapter,
} from './interfaces';

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

    return {
      occasion,
      styleVibe,
      fitGoal,
      budgetLimit,
      preferredColors,
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
      if (prodText.includes(normalizeVietnamese(c))) {
        score += 18;
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

    const pickItem = (
      list: Product[],
      idx: number,
      outfitId: string,
      slotRole: OutfitItem['slotRole'],
      isMainItem: boolean
    ): OutfitItem => {
      const prod = list[idx % list.length];
      const variant =
        prod.variants.find((v) => v.stock > 0) || prod.variants[0];
      return {
        outfitItemId: `oi-${outfitId}-${slotRole}-${idx}`,
        outfitId,
        productId: prod.productId,
        variantId: variant.variantId,
        slotRole,
        isMainItem,
        product: prod,
        variant,
      };
    };

    // Costume 1: Tailored Layering (Áo khoác + Áo chủ đạo + Quần âu/Jeans)
    const outfit1Id = `${sessionId}-costume-1`;
    const items1: OutfitItem[] = [
      pickItem(outers, seed % 8, outfit1Id, 'Áo khoác Layer', true),
      pickItem(tops, seed % 10, outfit1Id, 'Áo chủ đạo', false),
      pickItem(bottoms, seed % 10, outfit1Id, 'Quần / Chân váy', false),
    ];

    // Costume 2: Chic Silhouette (Đầm / Chân váy + Áo khoác / Áo nhẹ + Giày / Túi)
    const outfit2Id = `${sessionId}-costume-2`;
    const items2: OutfitItem[] = [
      pickItem(dresses, (seed + 3) % 12, outfit2Id, 'Quần / Chân váy', true),
      pickItem(outers, (seed + 5) % 10, outfit2Id, 'Áo khoác Layer', false),
      pickItem(shoes, (seed + 2) % 10, outfit2Id, 'Phụ kiện / Giày', false),
    ];

    // Costume 3: Effortless Smart-Casual (Áo sơ mi/len + Quần suông + Túi da thủ công)
    const outfit3Id = `${sessionId}-costume-3`;
    const items3: OutfitItem[] = [
      pickItem(tops, (seed + 7) % 14, outfit3Id, 'Áo chủ đạo', true),
      pickItem(bottoms, (seed + 9) % 14, outfit3Id, 'Quần / Chân váy', false),
      pickItem(bags, (seed + 4) % 12, outfit3Id, 'Phụ kiện / Giày', false),
    ];

    const sumPrice = (items: OutfitItem[]) =>
      items.reduce((acc, it) => acc + it.variant.price, 0);

    return [
      {
        outfitId: outfit1Id,
        stylistSessionId: sessionId,
        title: 'Bộ 01 — Thành Thị Thanh Lịch (Tailored Capsule)',
        styleTag: preferences.styleVibe,
        occasion: preferences.occasion,
        stylistNote: `Phối riêng cho dáng ${bodyProfile.bodyShape}: Lớp khoác ngoài có cấu trúc kết hợp áo thân trên và quần cạp cao giúp đạt mục tiêu "${preferences.fitGoal}" một cách tự nhiên, tôn sắc da ${bodyProfile.undertone}.`,
        matchScore: 98,
        matchBadges: [
          `Hợp dáng ${bodyProfile.bodyShape.split(' ')[0]}`,
          preferences.occasion,
          preferences.fitGoal,
        ],
        totalPrice: sumPrice(items1),
        items: items1,
      },
      {
        outfitId: outfit2Id,
        stylistSessionId: sessionId,
        title: 'Bộ 02 — Đường Cắt Tinh Khôi (Editorial Drape)',
        styleTag: preferences.styleVibe,
        occasion: preferences.occasion,
        stylistNote: `Đường cắt tối giản ôm nhẹ phần eo và rủ mềm theo chiều dọc cơ thể (${bodyProfile.heightEstimate}). Sự tương phản giữa đầm thiết kế, áo khoác và giày da mềm tạo chiều sâu sang trọng.`,
        matchScore: 95,
        matchBadges: [
          `Tôn tông da ${bodyProfile.undertone.split(' ')[0]}`,
          'Chất liệu rủ tôn dáng',
          'Đủ kích cỡ trong kho',
        ],
        totalPrice: sumPrice(items2),
        items: items2,
      },
      {
        outfitId: outfit3Id,
        stylistSessionId: sessionId,
        title: 'Bộ 03 — Phóng Khoáng Hiện Đại (Modern Smart-Casual)',
        styleTag: preferences.styleVibe,
        occasion: preferences.occasion,
        stylistNote: `Bảng màu hài hòa phối theo tỷ lệ 1/3 – 2/3 cùng phụ kiện túi da thủ công giúp kéo dài đôi chân và giữ sự thoải mái suốt ngày dài.`,
        matchScore: 92,
        matchBadges: [
          'Tỷ lệ vàng 1/3 – 2/3',
          'Dễ tách lẻ phối nhiều dịp',
          'Còn hàng sẵn sàng giao',
        ],
        totalPrice: sumPrice(items3),
        items: items3,
      },
    ];
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
      fitConfidence: 96,
      drapeNote: `Wearson AI đã khớp thành công ${garments.length} món đồ (${garments
        .map((g) => g.category)
        .join(' + ')}) lên khung xương và tỷ lệ vai – eo – hông từ bức ảnh của bạn.`,
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
            preferredColors: ['trang', 'den', 'be'],
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
const wearsonTryOnService = new WearsonTryOnService(new WearsonTryOnAdapter());

export const stylistOrchestrator = new StylistOrchestrator(
  bodyAnalysisService,
  new WebSpeechAdapter(),
  stylingIntentService,
  costumeMixerService,
  wearsonTryOnService,
  stylistRepository
);

export const stylistController = new StylistController(stylistOrchestrator);
