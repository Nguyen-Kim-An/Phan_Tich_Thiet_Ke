/**
 * PACKAGE: DAO — indexDAO (VectorIndex & KeywordIndex)
 * Locked to SYSTEM_DESIGN_LOCKED.md (v2.0 — Chuẩn PTIT)
 */

import type { Product } from '@/domain/models';

export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SEMANTIC_AXES: string[][] = [
  ['ao', 'so mi', 'blouse', 'shirt', 'top', 'polo', 'cardigan'],
  ['quan', 'suong', 'au', 'jean', 'trouser', 'pants', 'barrel', 'culottes'],
  ['vay', 'dam', 'chan vay', 'dress', 'skirt', 'midi', 'maxi', 'slip'],
  ['khoac', 'blazer', 'vest', 'trench', 'jacket', 'coat', 'layer'],
  ['giay', 'boot', 'sandal', 'loafer', 'cao got', 'heel'],
  ['phu kien', 'tui', 'khan', 'that lung', 'bag', 'kính', 'vong'],
  ['trang', 'kem', 'nga', 'be', 'white', 'ivory', 'cream', 'beige'],
  ['den', 'xam', 'ghi', 'than', 'black', 'grey', 'charcoal', 'dark'],
  ['xanh', 'navy', 'lam', 'reu', 'blue', 'green', 'mint', 'sky'],
  ['do', 'hong', 'nau', 'vang', 'cam', 'red', 'pink', 'brown', 'camel'],
  ['lua', 'silk', 'satin', 'bong', 'mem', 'ru'],
  ['linen', 'dui', 'cotton', 'thoang', 'mat', 'tu nhien'],
  ['len', 'da', 'tweed', 'wool', 'knit', 'am', 'thu dong'],
  ['cong so', 'di lam', 'thanh lich', 'lich su', 'minimal', 'toi gian', 'tailored'],
  ['du tiec', 'tiec toi', 'hen ho', 'sang trong', 'quy phai', 'party', 'evening'],
  ['dao pho', 'cuoi tuan', 'nang dong', 'tre trung', 'casual', 'street', 'du lich'],
];

export function computeTextFeatureVector(rawText: string): number[] {
  const norm = normalizeVietnamese(rawText);
  const vec = SEMANTIC_AXES.map((keywords) => {
    let hits = 0;
    for (const kw of keywords) {
      if (norm.includes(kw)) hits += 1;
    }
    return hits;
  });

  const mag = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  if (mag === 0) {
    return vec.map((_, i) => (i === 0 ? 0.5 : 0.1));
  }
  return vec.map((v) => Number((v / mag).toFixed(4)));
}

export function computeProductFeatureVector(product: Product): number[] {
  const colorNames = product.variants.map((v) => v.colorName).join(' ');
  const combined = `${product.name} ${product.category} ${product.categorySlug} ${product.description} ${colorNames}`;
  return computeTextFeatureVector(combined);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorIndex {
  private store: Map<string, number[]> = new Map();

  public add(ids: string[], vectors: number[][]): void {
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] && vectors[i]) {
        this.store.set(ids[i], vectors[i]);
      }
    }
  }

  public search(
    vector: number[],
    k: number,
    allowedIds: string[]
  ): Map<string, number> {
    const allowedSet = new Set(allowedIds);
    const scored: Array<[string, number]> = [];

    for (const [id, docVec] of this.store.entries()) {
      if (allowedSet.size > 0 && !allowedSet.has(id)) continue;
      const sim = Math.max(0, cosineSimilarity(vector, docVec));
      scored.push([id, sim]);
    }

    scored.sort((a, b) => b[1] - a[1]);
    return new Map(scored.slice(0, k));
  }
}

export class KeywordIndex {
  private docs: Map<string, { raw: string; norm: string; tokens: Set<string> }> =
    new Map();

  public build(products: Product[]): void {
    this.docs.clear();
    for (const p of products) {
      const variantColors = p.variants.map((v) => v.colorName).join(' ');
      const fullText = `${p.name} ${p.category} ${p.description} ${variantColors}`;
      const norm = normalizeVietnamese(fullText);
      const tokens = new Set(norm.split(' ').filter(Boolean));
      this.docs.set(p.productId, {
        raw: fullText.toLowerCase(),
        norm,
        tokens,
      });
    }
  }

  public search(
    tokens: string[],
    k: number,
    allowedIds: string[]
  ): Map<string, number> {
    const allowedSet = new Set(allowedIds);
    const normalizedQueryTokens = tokens
      .map((t) => normalizeVietnamese(t))
      .filter(Boolean);

    const scored: Array<[string, number]> = [];

    for (const [id, doc] of this.docs.entries()) {
      if (allowedSet.size > 0 && !allowedSet.has(id)) continue;

      if (normalizedQueryTokens.length === 0) {
        scored.push([id, 0.5]);
        continue;
      }

      let matchCount = 0;
      for (const qToken of normalizedQueryTokens) {
        if (doc.norm.includes(qToken)) {
          matchCount += qToken.includes(' ') ? 2.0 : 1.0;
        } else {
          const subWords = qToken.split(' ').filter(Boolean);
          const subHits = subWords.filter((w) => doc.tokens.has(w)).length;
          if (subHits > 0) {
            matchCount += (subHits / subWords.length) * 0.8;
          }
        }
      }

      const normalizedScore = Math.min(
        1,
        matchCount / Math.max(1, normalizedQueryTokens.length)
      );
      scored.push([id, normalizedScore]);
    }

    scored.sort((a, b) => b[1] - a[1]);
    return new Map(scored.slice(0, k));
  }
}
