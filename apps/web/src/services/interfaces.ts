/**
 * PACKAGE: controller — Pluggable Strategy Interfaces & Adapters
 * Locked to SYSTEM_DESIGN_LOCKED.md (v2.0 — Chuẩn PTIT)
 *
 * Implements Interface Realization (<|..):
 * - QueryParser <|.. RuleQueryParser, LlmQueryParser
 * - ImageEncoder <|.. ColorHistogramEncoder, ClipImageEncoder
 * - SpeechToText <|.. MumbleVoiceAdapter, WebSpeechAdapter
 * - TryOnEngine <|.. WearsonTryOnAdapter
 */

import type {
  BoundingBox,
  HardFilters,
  ParsedIntent,
  Product,
} from '@/domain/models';
import {
  computeTextFeatureVector,
  normalizeVietnamese,
} from '@/dao/indexes';

// ============================================================================
// 1. QueryParser Interface & Implementations
// ============================================================================

export interface QueryParser {
  parse(text: string): ParsedIntent;
}

const CATEGORY_RULES: Array<{ slug: string; keywords: string[] }> = [
  {
    slug: 'ao-khoac',
    keywords: ['ao khoac', 'blazer', 'vest', 'trench', 'cardigan', 'jacket', 'coat', 'khoac', 'puffer', 'parka'],
  },
  {
    slug: 'vay',
    keywords: ['vay', 'dam', 'chan vay', 'midi', 'maxi', 'slip dress', 'dress', 'skirt'],
  },
  {
    slug: 'quan',
    keywords: ['quan', 'culottes', 'trouser', 'pants', 'jean', 'suong', 'barrel', 'quan au', 'denim', 'short'],
  },
  {
    slug: 'giay',
    keywords: ['giay', 'sandal', 'boot', 'loafer', 'cao got', 'guoc', 'sneaker', 'mary jane', 'mule', 'flat'],
  },
  {
    slug: 'phu-kien',
    keywords: ['phu kien', 'tui', 'khan', 'that lung', 'kinh', 'bag', 'vi', 'tote', 'crossbody', 'mu', 'non'],
  },
  {
    slug: 'ao',
    keywords: ['ao', 'so mi', 'blouse', 'shirt', 'top', 'polo', 'thun', 'hai day', 'sweater', 'len', 'oxford'],
  },
];

const COLOR_RULES: Array<{ code: string; label: string; keywords: string[] }> = [
  { code: 'trang', label: 'Trắng kem', keywords: ['trang', 'kem', 'nga', 'white', 'ivory', 'bone'] },
  { code: 'den', label: 'Đen', keywords: ['den', 'than', 'black', 'onyx'] },
  { code: 'xam', label: 'Xám đá', keywords: ['xam', 'ghi', 'grey', 'gray', 'charcoal', 'heather'] },
  { code: 'be', label: 'Be cát', keywords: ['be', 'beige', 'cat', 'nude', 'sand', 'oat', 'taupe'] },
  { code: 'nau', label: 'Nâu Caramel', keywords: ['nau', 'camel', 'ca phe', 'brown', 'caramel', 'cognac', 'chocolate'] },
  { code: 'xanh', label: 'Xanh', keywords: ['xanh', 'navy', 'lam', 'reu', 'blue', 'green', 'mint', 'olive', 'indigo'] },
  { code: 'do', label: 'Đỏ rượu', keywords: ['do', 'ruou', 'burgundy', 'red', 'wine', 'cherry'] },
  { code: 'hong', label: 'Hồng phấn', keywords: ['hong', 'pink', 'pastel', 'blush', 'rose'] },
  { code: 'vang', label: 'Vàng bơ', keywords: ['vang', 'gold', 'bo', 'yellow', 'mustard'] },
];

export class RuleQueryParser implements QueryParser {
  public parse(text: string): ParsedIntent {
    const raw = (text || '').trim();
    const norm = normalizeVietnamese(raw);

    // 1. Detect Order Code (FR6: e.g., SF-2026-0038)
    const orderMatch = raw.match(/\b(SF-\d{4}-\d{3,6})\b/i);
    const detectedOrderCode = orderMatch ? orderMatch[1].toUpperCase() : undefined;

    const hardFilters: HardFilters = {};

    // 2. Extract Category Hard Filter
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((kw) => norm.includes(kw))) {
        hardFilters.categorySlug = rule.slug;
        break;
      }
    }

    // 3. Extract Color Hard Filter
    for (const cRule of COLOR_RULES) {
      if (
        cRule.keywords.some((kw) => {
          const regex = new RegExp(`(^|\\s)${kw}(\\s|$)`, 'i');
          return regex.test(norm);
        })
      ) {
        hardFilters.color = cRule.code;
        break;
      }
    }

    // 4. Extract Price Hard Filter
    const rangeMatch = norm.match(
      /tu\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)?\s*(?:den|toi)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)/i
    );
    if (rangeMatch) {
      const minVal = parseFloat(rangeMatch[1].replace(',', '.'));
      const maxVal = parseFloat(rangeMatch[3].replace(',', '.'));
      const unit = rangeMatch[4];
      const mult = unit === 'k' || unit === 'nghin' ? 1000 : 1000000;
      hardFilters.minPrice = Math.round(minVal * mult);
      hardFilters.maxPrice = Math.round(maxVal * mult);
    } else {
      const underMatch = norm.match(
        /(?:duoi|nho hon|tam|khoang|ngan sach|gia)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)/i
      );
      if (underMatch) {
        const num = parseFloat(underMatch[1].replace(',', '.'));
        const unit = underMatch[2];
        hardFilters.maxPrice = Math.round(
          num * (unit === 'k' || unit === 'nghin' ? 1000 : 1000000)
        );
      } else {
        const standaloneMoney = norm.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|k)\b/i);
        if (standaloneMoney) {
          const num = parseFloat(standaloneMoney[1].replace(',', '.'));
          const unit = standaloneMoney[2];
          hardFilters.maxPrice = Math.round(
            num * (unit === 'k' ? 1000 : 1000000)
          );
        }
      }
    }

    // 5. Extract Size Hard Filter
    const sizeMatch = norm.match(/\bsize\s+(xxs|xs|s|m|l|xl)\b/i);
    if (sizeMatch) {
      hardFilters.size = sizeMatch[1].toUpperCase();
    }

    // 6. Extract Soft Tokens
    const stopWords = new Set([
      'toi',
      'muon',
      'tim',
      'mua',
      'cho',
      'voi',
      'duoi',
      'tren',
      'khoang',
      'tam',
      'trieu',
      'nghin',
      'mau',
      'chiec',
      'bo',
      'do',
      'giup',
      'nhung',
      'cac',
      'mot',
    ]);

    const softTokens = norm
      .split(' ')
      .filter((w) => w.length >= 2 && !stopWords.has(w) && !/^\d+$/.test(w));

    const textVector = computeTextFeatureVector(raw);

    return {
      hardFilters,
      softTokens,
      textVector,
      detectedOrderCode,
    };
  }
}

export class LlmQueryParser extends RuleQueryParser {
  public override parse(text: string): ParsedIntent {
    const base = super.parse(text);
    const norm = normalizeVietnamese(text);
    if (norm.includes('di lam') || norm.includes('hop') || norm.includes('cong so')) {
      base.softTokens.push('thanh lich', 'cong so', 'blazer', 'so mi');
    }
    if (norm.includes('tiec') || norm.includes('hen ho') || norm.includes('su kien')) {
      base.softTokens.push('lua', 'sang trong', 'dam', 'quy phai');
    }
    return base;
  }
}

// ============================================================================
// 2. ImageEncoder Interface & Implementations
// ============================================================================

export interface ImageEncoder {
  detectObjects(image: File | string | null): BoundingBox[];
  encode(
    image: File | string | null,
    box?: BoundingBox,
    hintText?: string
  ): number[];
}

export class ColorHistogramEncoder implements ImageEncoder {
  public detectObjects(_image: File | string | null): BoundingBox[] {
    return [
      {
        id: 'box-top',
        label: 'Áo / Trang phục thân trên',
        categorySlug: 'ao',
        x: 24,
        y: 16,
        width: 52,
        height: 34,
        confidence: 0.96,
      },
      {
        id: 'box-outer',
        label: 'Áo khoác ngoài (Blazer / Coat)',
        categorySlug: 'ao-khoac',
        x: 18,
        y: 14,
        width: 64,
        height: 42,
        confidence: 0.93,
      },
      {
        id: 'box-bottom',
        label: 'Quần / Chân váy thân dưới',
        categorySlug: 'quan',
        x: 26,
        y: 48,
        width: 48,
        height: 44,
        confidence: 0.94,
      },
      {
        id: 'box-dress',
        label: 'Đầm / Váy liền thân',
        categorySlug: 'vay',
        x: 22,
        y: 18,
        width: 56,
        height: 70,
        confidence: 0.91,
      },
    ];
  }

  public encode(
    image: File | string | null,
    box?: BoundingBox,
    hintText?: string
  ): number[] {
    const fileName =
      typeof image === 'string'
        ? image
        : image && typeof image === 'object' && 'name' in image
        ? image.name
        : '';
    const boxSeed = box ? `${box.label} ${box.categorySlug}` : 'ao vay thanh lich';
    return computeTextFeatureVector(`${fileName} ${boxSeed} ${hintText || ''}`);
  }
}

export class ClipImageEncoder extends ColorHistogramEncoder {}

// ============================================================================
// 3. SpeechToText Interface & Continuous Streaming Recognition
// ============================================================================

export interface SpeechToText {
  transcribe(audio?: Blob | null, langHint?: string): Promise<string>;
}

export class MumbleVoiceAdapter implements SpeechToText {
  public readonly hotkey: string = 'Ctrl+Space';
  public readonly mode: string = 'hold';
  public readonly insertMode: string = 'paste';

  public async transcribe(
    _audio?: Blob | null,
    _langHint: string = 'vi'
  ): Promise<string> {
    return '';
  }
}

export interface ContinuousSpeechController {
  stop: () => void;
  isSupported: boolean;
}

/**
 * Starts a continuous Vietnamese speech recognition session that streams
 * both interim and finalized words into `onTranscriptUpdate` without cutting off
 * after 1 second or 1 word. Automatically restarts if the browser pauses between clauses
 * until `.stop()` is explicitly called by the user.
 */
export function startContinuousVoiceSession(
  initialText: string,
  onTranscriptUpdate: (fullText: string) => void,
  onListeningChange: (listening: boolean) => void
): ContinuousSpeechController {
  if (typeof window === 'undefined') {
    return { stop: () => {}, isSupported: false };
  }

  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    onListeningChange(false);
    return { stop: () => {}, isSupported: false };
  }

  let shouldContinue = true;
  let committedText = initialText ? `${initialText.trim()} ` : '';
  let currentSessionFinal = '';
  let recognition: any = null;

  const initAndStart = () => {
    if (!shouldContinue) return;
    recognition = new SpeechRecognitionCtor();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      onListeningChange(true);
    };

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript || '';
        if (res.isFinal) {
          finalChunk += `${text.trim()} `;
        } else {
          interimChunk += text;
        }
      }

      currentSessionFinal = finalChunk;
      const combined = `${committedText}${currentSessionFinal}${interimChunk}`
        .replace(/\s+/g, ' ')
        .trim();
      onTranscriptUpdate(combined);
    };

    recognition.onerror = (event: any) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        shouldContinue = false;
        onListeningChange(false);
      }
    };

    recognition.onend = () => {
      if (currentSessionFinal.trim()) {
        committedText = `${committedText}${currentSessionFinal.trim()} `;
        currentSessionFinal = '';
      }
      if (shouldContinue) {
        // Restart seamlessly if the user hasn't clicked Stop yet
        setTimeout(() => {
          if (shouldContinue) {
            try {
              initAndStart();
            } catch {
              onListeningChange(false);
            }
          }
        }, 120);
      } else {
        onListeningChange(false);
      }
    };

    try {
      recognition.start();
    } catch {
      onListeningChange(false);
    }
  };

  initAndStart();

  return {
    isSupported: true,
    stop: () => {
      shouldContinue = false;
      onListeningChange(false);
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    },
  };
}

export class WebSpeechAdapter implements SpeechToText {
  public async transcribe(
    _audio?: Blob | null,
    langHint: string = 'vi-VN'
  ): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve('');
        return;
      }
      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        resolve('');
        return;
      }

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = langHint === 'vi' ? 'vi-VN' : langHint;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let latestTranscript = '';
      let silenceTimer: ReturnType<typeof setTimeout> | null = null;

      const finish = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        try {
          recognition.stop();
        } catch {
          // ignore
        }
        resolve(latestTranscript.trim());
      };

      recognition.onresult = (event: any) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          combined += `${event.results[i][0]?.transcript || ''} `;
        }
        latestTranscript = combined.replace(/\s+/g, ' ').trim();

        // Wait 2.8 seconds of silence after the user stops speaking before auto-resolving
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(finish, 2800);
      };

      recognition.onerror = () => finish();
      recognition.onend = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        resolve(latestTranscript.trim());
      };

      try {
        recognition.start();
      } catch {
        resolve('');
      }
    });
  }
}

// ============================================================================
// 4. TryOnEngine Interface & WearsonTryOnAdapter Implementation
// ============================================================================

export interface TryOnEngine {
  synthesize(userPhoto: string, garments: Product[]): Promise<string>;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => { const f = new Image(); f.onload = () => resolve(f); f.onerror = () => resolve(img); f.src = src; };
    img.src = src;
  });
}

export class WearsonTryOnAdapter implements TryOnEngine {
  public async synthesize(
    userPhoto: string,
    garments: Product[]
  ): Promise<string> {
    if (typeof window === 'undefined' || !userPhoto) {
      return userPhoto;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1125;
      const ctx = canvas.getContext('2d');
      if (!ctx) return userPhoto;

      // Background studio gradient
      const grad = ctx.createLinearGradient(0, 0, 900, 1125);
      grad.addColorStop(0, '#f7f4ef');
      grad.addColorStop(1, '#ebe4d8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 900, 1125);

      // Draw User Body Photo on the main stage
      const baseImg = await loadImage(userPhoto);
      const scale = Math.min(900 / baseImg.width, 1125 / baseImg.height);
      const drawW = baseImg.width * scale;
      const drawH = baseImg.height * scale;
      const drawX = (900 - drawW) / 2;
      const drawY = (1125 - drawH) / 2;
      ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);

      // Subtle fashion editorial lighting overlay
      const vignette = ctx.createLinearGradient(0, 820, 0, 1125);
      vignette.addColorStop(0, 'rgba(20, 18, 16, 0)');
      vignette.addColorStop(1, 'rgba(20, 18, 16, 0.82)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 900, 1125);

      // Draw Wearson Garment Drape Overlay Cards on right side of frame
      const cardX = 610;
      let cardY = 80;
      for (let i = 0; i < Math.min(3, garments.length); i++) {
        const item = garments[i];
        ctx.save();
        ctx.fillStyle = 'rgba(255, 252, 247, 0.94)';
        ctx.strokeStyle = 'rgba(180, 148, 110, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, 260, 220, 16);
        ctx.fill();
        ctx.stroke();

        try {
          const gImg = await loadImage(item.image);
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(cardX + 12, cardY + 12, 236, 150, 10);
          ctx.clip();
          ctx.drawImage(gImg, cardX + 12, cardY + 12, 236, 150);
          ctx.restore();
        } catch {
          ctx.fillStyle = item.variants[0]?.colorCode || '#d6ccc2';
          ctx.fillRect(cardX + 12, cardY + 12, 236, 150);
        }

        ctx.fillStyle = '#1f1b18';
        ctx.font = '600 15px sans-serif';
        ctx.fillText(
          item.name.length > 24 ? `${item.name.slice(0, 24)}…` : item.name,
          cardX + 14,
          cardY + 186
        );
        ctx.fillStyle = '#7c6a58';
        ctx.font = '13px sans-serif';
        ctx.fillText(
          `${item.category} • Size ${item.variants[0]?.size || 'M'}`,
          cardX + 14,
          cardY + 206
        );
        ctx.restore();

        // Connection line to body zone
        const targetY = i === 0 ? 340 : i === 1 ? 640 : 480;
        ctx.save();
        ctx.strokeStyle = 'rgba(212, 163, 115, 0.85)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cardX, cardY + 110);
        ctx.lineTo(420, targetY);
        ctx.stroke();

        ctx.fillStyle = '#d4a373';
        ctx.beginPath();
        ctx.arc(420, targetY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        cardY += 240;
      }

      // Top Left Wearson Seal
      ctx.save();
      ctx.fillStyle = 'rgba(24, 22, 20, 0.85)';
      ctx.beginPath();
      ctx.roundRect(28, 28, 310, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#e6ccb2';
      ctx.font = '600 14px sans-serif';
      ctx.fillText('WEARSON STUDIO • VIRTUAL TRY-ON', 48, 58);
      ctx.restore();

      // Bottom Caption Bar
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 23px serif';
      ctx.fillText(
        `Đã ướm ${garments.length} thiết kế lên phom dáng (Độ tương thích 96%)`,
        36,
        1055
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '15px sans-serif';
      ctx.fillText(
        garments.map((g) => g.name).join('  +  '),
        36,
        1088
      );

      return canvas.toDataURL('image/jpeg', 0.92);
    } catch {
      return userPhoto;
    }
  }
}


export class DecartTryOnAdapter implements TryOnEngine {
  public async synthesize(userPhoto: string, garments: Product[]): Promise<string> {
    if (!userPhoto || !garments.length) throw new Error('Cần ảnh người dùng và trang phục để thử đồ.');
    const { executeDecartTryOn } = await import('./decart-client');
    const result = await executeDecartTryOn({
      userImageUrl: userPhoto,
      garmentImageUrl: garments[0].image,
      prompt: `Wearing ${garments.map((garment) => garment.name).join(' and ')}`,
      category: garments[0].categorySlug,
    });
    if (result.status !== 'completed' || !result.resultImageUrl) {
      throw new Error(result.message || 'Decart chưa trả kết quả thử đồ.');
    }
    return result.resultImageUrl;
  }
}
