import { Injectable } from '@nestjs/common';
import { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database.service';
import { StylistRecommendDto } from './stylist.dto';

type Variant = {
  variantId: string;
  productId: string;
  sku: string;
  colorCode: string;
  colorName: string;
  size: string;
  price: number;
  stock: number;
  stockQuantity: number;
};

type Product = {
  productId: string;
  handle: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  basePrice: number;
  description: string;
  soldCount: number;
  rating: number;
  image: string;
  imageAlt: string;
  colors: string[];
  variants: Variant[];
  source: { retailer: string; sourcePage: string; productPage: string; images: string[] };
};

interface ProductRow extends QueryResultRow {
  product_id: string;
  name: string;
  base_price: string | number;
  description: string;
  sold_count: number;
  rating: number;
  image_url: string;
  category_name: string;
  category_slug: string;
  colors: string[];
  variants: Array<{
    variantId: string;
    sku: string;
    colorCode: string;
    colorName: string;
    size: string;
    price: string | number;
    stock: number;
  }>;
}

export interface Preferences {
  occasion: string;
  styleVibe: string;
  fitGoal: string;
  budgetLimit: number;
  preferredColors: string[];
  preferredMaterials: string[];
  preferredSize?: string;
  rawVoiceNote: string;
}

interface Slot {
  category: string;
  role: 'Áo chủ đạo' | 'Quần / Chân váy' | 'Áo khoác Layer' | 'Phụ kiện / Giày';
  main: boolean;
}

interface CandidateOutfit {
  title: string;
  note: string;
  items: Array<{ product: Product; variant: Variant; slot: Slot }>;
  totalPrice: number;
  matchScore: number;
  badges: string[];
}

const MATERIALS: Record<string, string[]> = {
  'Lụa / satin': ['lua', 'silk', 'satin'],
  'Linen / đũi': ['linen', 'dui', 'flax'],
  Cotton: ['cotton', 'bong', 'oxford'],
  'Len / dạ': ['len', 'wool', 'tweed', 'knit'],
  Denim: ['denim', 'jean'],
  Da: ['da', 'leather', 'suede'],
};

const COLORS: Record<string, string[]> = {
  trang: ['trang', 'kem', 'nga', 'ivory', 'cream', 'white'],
  den: ['den', 'black', 'onyx', 'charcoal'],
  be: ['be', 'beige', 'sand', 'oat', 'taupe', 'nude'],
  xam: ['xam', 'ghi', 'grey', 'gray', 'slate'],
  xanh: ['xanh', 'blue', 'green', 'navy', 'olive', 'sage'],
  nau: ['nau', 'brown', 'camel', 'caramel', 'chocolate'],
  do: ['do', 'red', 'wine', 'burgundy', 'cherry'],
  hong: ['hong', 'pink', 'rose', 'blush'],
  vang: ['vang', 'yellow', 'gold', 'mustard', 'butter'],
};

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsTerm(text: string, term: string): boolean {
  return ` ${normalize(text)} `.includes(` ${normalize(term)} `);
}

function inferPreferences(dto: StylistRecommendDto): Preferences {
  const answers = dto.inputMode === 'quiz' ? dto.quizAnswers : undefined;
  const text = dto.voiceText ?? '';
  const norm = normalize(text);
  const budgetMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(triệu|trieu|tr|k|nghìn|nghin)\b/i);
  const voiceBudget = budgetMatch
    ? Math.round(Number(budgetMatch[1].replace(',', '.')) * (/^(k|nghìn|nghin)$/i.test(budgetMatch[2]) ? 1000 : 1_000_000))
    : undefined;

  const occasion = answers?.occasion ?? (
    /tiec|hen ho|su kien/.test(norm) ? 'Tiệc tối & Sự kiện sang trọng'
      : /dao pho|ca phe|cuoi tuan/.test(norm) ? 'Dạo phố & Cà phê cuối tuần'
        : /du lich|nghi duong|bien/.test(norm) ? 'Du lịch & Nghỉ dưỡng'
          : 'Công sở & Gặp đối tác'
  );
  const styleVibe = answers?.styleVibe ?? (
    /nu tinh|mem mai|romantic|lua/.test(norm) ? 'Nữ tính & Mềm mại (Romantic Silk)'
      : /ca tinh|hien dai|sac sao|tailored/.test(norm) ? 'Hiện đại & Sắc sảo (Modern Tailored)'
        : /phong khoang|nang dong|thoai mai|casual/.test(norm) ? 'Phóng khoáng (Smart-Casual)'
          : 'Thanh lịch tối giản (Minimalist)'
  );
  const fitGoal = answers?.fitGoal ?? (
    /bap tay|vai/.test(norm) ? 'Che khuyết điểm bắp tay & Cân đối bờ vai'
      : /bung|vong 2|hong|suong/.test(norm) ? 'Phom suông che vòng 2 & Thoải mái di chuyển'
        : 'Tôn vòng eo & Kéo dài đôi chân'
  );
  const preferredMaterials = answers?.preferredMaterials ?? Object.keys(MATERIALS).filter((material) =>
    MATERIALS[material].some((keyword) => containsTerm(norm, keyword))
  );
  const preferredColors = answers?.preferredColors ?? Object.keys(COLORS).filter((color) =>
    COLORS[color].some((keyword) => containsTerm(norm, keyword))
  );
  const sizeMatch = norm.match(/\bsize\s*(xxl|xs|s|m|l|xl)\b/);

  return {
    occasion,
    styleVibe,
    fitGoal,
    budgetLimit: answers?.budgetLimit ?? voiceBudget ?? 4_500_000,
    preferredColors,
    preferredMaterials,
    preferredSize: answers?.preferredSize ?? sizeMatch?.[1]?.toUpperCase(),
    rawVoiceNote: text,
  };
}

@Injectable()
export class StylistService {
  constructor(private readonly db: DatabaseService) {}

  async recommend(dto: StylistRecommendDto) {
    const preferences = inferPreferences(dto);
    return this.db.transaction(async (client) => {
      const products = await this.loadProducts(client);
      const outfits = this.composeOutfits(products, preferences);
      const sessionResult = await client.query<{ stylist_session_id: string; created_at: Date }>(
        `INSERT INTO stylist_sessions(user_photo_url,input_mode,body_shape,preferences,voice_transcript)
         VALUES('', $1, 'Chưa phân tích', $2::jsonb, $3) RETURNING stylist_session_id,created_at`,
        [dto.inputMode, JSON.stringify(preferences), dto.inputMode === 'voice' ? dto.voiceText ?? '' : null]
      );
      const stylistSessionId = sessionResult.rows[0].stylist_session_id;
      const recommendedOutfits = [];

      for (const outfit of outfits) {
        const insertedOutfit = await client.query<{ outfit_id: string }>(
          `INSERT INTO outfits(stylist_session_id,title,style_tag,occasion,stylist_note,total_price)
           VALUES($1,$2,$3,$4,$5,$6) RETURNING outfit_id`,
          [stylistSessionId, outfit.title, preferences.styleVibe, preferences.occasion, outfit.note, outfit.totalPrice]
        );
        const outfitId = insertedOutfit.rows[0].outfit_id;
        const items = [];

        for (const item of outfit.items) {
          const insertedItem = await client.query<{ outfit_item_id: string }>(
            `INSERT INTO outfit_items(outfit_id,product_id,variant_id,slot_role,is_main_item)
             VALUES($1,$2,$3,$4,$5) RETURNING outfit_item_id`,
            [outfitId, item.product.productId, item.variant.variantId, item.slot.role, item.slot.main]
          );
          items.push({
            outfitItemId: insertedItem.rows[0].outfit_item_id,
            outfitId,
            productId: item.product.productId,
            variantId: item.variant.variantId,
            slotRole: item.slot.role,
            isMainItem: item.slot.main,
            product: item.product,
            variant: item.variant,
          });
        }

        recommendedOutfits.push({
          outfitId,
          stylistSessionId,
          title: outfit.title,
          styleTag: preferences.styleVibe,
          occasion: preferences.occasion,
          stylistNote: outfit.note,
          matchScore: outfit.matchScore,
          matchBadges: outfit.badges,
          totalPrice: outfit.totalPrice,
          items,
        });
      }

      return {
        stylistSessionId,
        userPhotoUrl: '',
        inputMode: dto.inputMode,
        bodyShape: 'Chưa phân tích',
        occasion: preferences.occasion,
        styleVibe: preferences.styleVibe,
        budgetLimit: preferences.budgetLimit,
        preferences,
        voiceTranscript: dto.inputMode === 'voice' ? dto.voiceText ?? '' : undefined,
        recommendedOutfits,
        createdAt: sessionResult.rows[0].created_at.toISOString(),
      };
    });
  }

  private async loadProducts(client: PoolClient): Promise<Product[]> {
    const { rows } = await client.query<ProductRow>(`
      SELECT p.product_id::text,p.name,p.base_price,p.description,p.sold_count,p.rating,
        COALESCE((SELECT image_url FROM product_images i WHERE i.product_id=p.product_id AND i.is_primary ORDER BY i.variant_id NULLS FIRST LIMIT 1),'') image_url,
        c.name category_name,COALESCE(parent.slug,c.slug) category_slug,
        COALESCE((SELECT array_agg(DISTINCT v.color_name) FROM product_variants v WHERE v.product_id=p.product_id AND v.stock_quantity>0),'{}') colors,
        COALESCE((SELECT json_agg(json_build_object(
          'variantId',v.variant_id::text,'sku',v.sku,'colorCode',v.color_code,'colorName',v.color_name,
          'size',v.size,'price',COALESCE(v.price_override,p.base_price),'stock',v.stock_quantity
        ) ORDER BY v.sku) FROM product_variants v WHERE v.product_id=p.product_id AND v.stock_quantity>0),'[]') variants
      FROM products p
      JOIN categories c ON c.category_id=p.category_id
      LEFT JOIN categories parent ON parent.category_id=c.parent_id
      WHERE p.status='active'
        AND EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id=p.product_id AND v.stock_quantity>0)
      ORDER BY p.name`);

    return rows.map((row) => {
      const image = row.image_url ?? '';
      const variants = (row.variants ?? []).map((variant) => ({
        ...variant,
        productId: row.product_id,
        price: Number(variant.price),
        stock: Number(variant.stock),
        stockQuantity: Number(variant.stock),
      }));
      return {
        productId: row.product_id,
        handle: row.product_id,
        name: row.name,
        category: row.category_name,
        categorySlug: row.category_slug,
        price: Number(row.base_price),
        basePrice: Number(row.base_price),
        description: row.description ?? '',
        soldCount: Number(row.sold_count),
        rating: Number(row.rating),
        image,
        imageAlt: image,
        colors: row.colors ?? [],
        variants,
        source: { retailer: 'SmartFashion', sourcePage: '', productPage: '', images: image ? [image] : [] },
      };
    });
  }

  private composeOutfits(products: Product[], preferences: Preferences): CandidateOutfit[] {
    if (!products.length) return [];
    const categoryProducts = (category: string) => products.filter((product) => product.categorySlug === category);
    const accessoryCategory = categoryProducts('giay').length ? 'giay' : 'phu-kien';
    const recipes: Array<{ title: string; required: Slot[]; optional?: Slot[] }> = [
      {
        title: 'Thành Thị Thanh Lịch',
        required: [
          { category: 'ao-khoac', role: 'Áo khoác Layer', main: true },
          { category: 'ao', role: 'Áo chủ đạo', main: false },
          { category: 'quan', role: 'Quần / Chân váy', main: false },
        ],
      },
      {
        title: 'Đường Cắt Tinh Khôi',
        required: [
          { category: 'vay', role: 'Quần / Chân váy', main: true },
          { category: 'ao-khoac', role: 'Áo khoác Layer', main: false },
        ],
        optional: [{ category: accessoryCategory, role: 'Phụ kiện / Giày', main: false }],
      },
      {
        title: 'Phóng Khoáng Hiện Đại',
        required: [
          { category: 'ao', role: 'Áo chủ đạo', main: true },
          { category: 'quan', role: 'Quần / Chân váy', main: false },
        ],
        optional: [{ category: accessoryCategory, role: 'Phụ kiện / Giày', main: false }],
      },
    ];

    const tokenList = normalize(`${preferences.occasion} ${preferences.styleVibe} ${preferences.fitGoal} ${preferences.rawVoiceNote}`)
      .split(' ').filter((token) => token.length >= 3 && !/^\d+$/.test(token));
    const budget = preferences.budgetLimit > 0 ? preferences.budgetLimit : Number.POSITIVE_INFINITY;
    const usedProducts = new Set<string>();
    const result: CandidateOutfit[] = [];

    for (const recipe of recipes) {
      if (recipe.required.some((slot) => categoryProducts(slot.category).length === 0)) continue;
      const slots = [...recipe.required, ...(recipe.optional ?? []).filter((slot) => categoryProducts(slot.category).length > 0)];
      const choices = slots.map((slot) => {
        const ranked = [...categoryProducts(slot.category)].sort((a, b) =>
          this.scoreProduct(b, preferences, tokenList) - this.scoreProduct(a, preferences, tokenList)
        );
        const cheap = [...ranked].sort((a, b) => this.cheapestVariant(a, preferences).price - this.cheapestVariant(b, preferences).price);
        const byId = new Map<string, Product>();
        for (const product of [...ranked.slice(0, 20), ...cheap.slice(0, 8)]) {
          byId.set(product.productId, product);
        }
        return [...byId.values()];
      });
      if (choices.some((choice) => choice.length === 0)) continue;

      let best: { items: CandidateOutfit['items']; score: number; totalPrice: number } | undefined;
      const selected: CandidateOutfit['items'] = [];
      const search = (slotIndex: number) => {
        if (slotIndex === slots.length) {
          const totalPrice = selected.reduce((sum, item) => sum + item.variant.price, 0);
          if (totalPrice > budget) return;
          const score = selected.reduce((sum, item) => sum + this.scoreProduct(item.product, preferences, tokenList) - (usedProducts.has(item.product.productId) ? 18 : 0), 0);
          if (!best || score > best.score) best = { items: [...selected], score, totalPrice };
          return;
        }

        for (const product of choices[slotIndex]) {
          if (selected.some((item) => item.product.productId === product.productId)) continue;
          const variant = this.cheapestVariant(product, preferences);
          selected.push({ product, variant, slot: slots[slotIndex] });
          search(slotIndex + 1);
          selected.pop();
        }
      };
      search(0);
      if (!best) continue;
      const winning = best as { items: CandidateOutfit['items']; score: number; totalPrice: number };
      winning.items.forEach((item) => usedProducts.add(item.product.productId));
      const matchedMaterials = preferences.preferredMaterials.filter((material) =>
        winning.items.some((item) => MATERIALS[material]?.some((keyword) => containsTerm(`${item.product.name} ${item.product.description}`, keyword))));
      const matchedColors = preferences.preferredColors.filter((color) =>
        winning.items.some((item) => COLORS[color]?.some((keyword) => containsTerm(item.variant.colorName, keyword))));
      const score = Math.min(98, Math.max(55, Math.round(55 + winning.score / Math.max(1, winning.items.length) * 2)));
      result.push({
        title: recipe.title,
        note: `Set đồ phù hợp cho ${preferences.occasion.toLowerCase()}, theo phong cách ${preferences.styleVibe.toLowerCase()}. Tổng giá đã được giữ trong ngân sách.`,
        items: winning.items,
        totalPrice: winning.totalPrice,
        matchScore: score,
        badges: [preferences.occasion, preferences.styleVibe, ...matchedMaterials, ...matchedColors.map((color) => `Màu ${color}`), 'Trong ngân sách'],
      });
    }

    return result;
  }

  private scoreProduct(product: Product, preferences: Preferences, tokens: string[]): number {
    const text = normalize(`${product.name} ${product.description} ${product.colors.join(' ')}`);
    let score = 0;
    const materialMatched = preferences.preferredMaterials.some((material) =>
      MATERIALS[material]?.some((keyword) => containsTerm(text, keyword)));
    const colorMatched = preferences.preferredColors.some((color) =>
      COLORS[color]?.some((keyword) => containsTerm(text, keyword)));
    if (preferences.preferredMaterials.length) score += materialMatched ? 24 : -4;
    if (preferences.preferredColors.length) score += colorMatched ? 15 : -3;
    for (const token of tokens.slice(0, 18)) {
      if (text.includes(token)) score += 2;
    }
    const price = this.cheapestVariant(product, preferences).price;
    if (price <= preferences.budgetLimit * 0.4) score += 8;
    return score;
  }

  private cheapestVariant(product: Product, preferences: Preferences): Variant {
    return [...product.variants].sort((a, b) => {
      const aSize = preferences.preferredSize && a.size.toUpperCase() === preferences.preferredSize ? 1 : 0;
      const bSize = preferences.preferredSize && b.size.toUpperCase() === preferences.preferredSize ? 1 : 0;
      const aColor = preferences.preferredColors.some((color) => COLORS[color]?.some((keyword) => containsTerm(a.colorName, keyword))) ? 1 : 0;
      const bColor = preferences.preferredColors.some((color) => COLORS[color]?.some((keyword) => containsTerm(b.colorName, keyword))) ? 1 : 0;
      return bSize - aSize || bColor - aColor || a.price - b.price;
    })[0];
  }
}
