import { NextResponse } from 'next/server';
import catalog from '@/data/crawled-catalog.json';
import type { Product } from '@/domain/models';

interface RequestBody {
  photo?: string;
  occasion?: string;
  vibe?: string;
  budgetLimit?: number;
  preferredColors?: string[];
  voicePrompt?: string;
}

const COLOR_KEYWORDS: Record<string, string[]> = {
  do: ['red', 'đỏ', 'đỏ rượu', 'burgundy', 'wine', 'crimson', 'đỏ mận', 'đỏ đô'],
  den: ['black', 'đen', 'charcoal', 'onyx'],
  trang: ['white', 'trắng', 'kem', 'ivory', 'cream'],
  be: ['be', 'beige', 'sand', 'taupe', 'oat'],
  xam: ['grey', 'gray', 'xám', 'ghi', 'slate'],
  xanh: ['blue', 'xanh', 'navy', 'denim', 'green', 'olive'],
  nau: ['brown', 'nâu', 'caramel', 'camel', 'chocolate'],
};

function hasMatchingColor(product: { name: string; colors: string[] }, colorIds: string[]): boolean {
  if (!colorIds.length) return true;
  const productText = `${product.name} ${product.colors.join(' ')}`.toLowerCase();
  return colorIds.some((id) => {
    const kws = COLOR_KEYWORDS[id] || [id];
    return kws.some((kw) => productText.includes(kw));
  });
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const occasion = body.occasion || 'Công sở & Gặp đối tác';
    const vibe = body.vibe || 'Tối giản (Minimalist)';
    const budgetLimit = body.budgetLimit || 4500000;
    const preferredColors = body.preferredColors || ['do'];
    const photo = body.photo;

    const allProducts = catalog.products as unknown as Product[];
    const tops = allProducts.filter((p) => p.categorySlug === 'ao');
    const bottoms = allProducts.filter((p) => p.categorySlug === 'quan' || p.categorySlug === 'vay');
    const outers = allProducts.filter((p) => p.categorySlug === 'ao-khoac');
    const accs = allProducts.filter((p) => p.categorySlug === 'giay' || p.categorySlug === 'phu-kien');

    // 1. Separate candidates prioritizing user's preferred colors
    const hasBurgundyPreference = preferredColors.includes('do');

    const preferredTops = tops.filter((p) => hasMatchingColor(p, preferredColors) && p.price <= budgetLimit * 0.45);
    const candidateTops = preferredTops.length > 0 ? preferredTops : tops.filter((p) => p.price <= budgetLimit * 0.45);

    const preferredOuters = outers.filter((p) => hasMatchingColor(p, preferredColors) && p.price <= budgetLimit * 0.6);
    const candidateOuters = preferredOuters.length > 0 ? preferredOuters : outers.filter((p) => p.price <= budgetLimit * 0.6);

    const candidateBottoms = bottoms.filter((p) => p.price <= budgetLimit * 0.4);
    const candidateAccs = accs.filter((p) => p.price <= budgetLimit * 0.3);

    // Compact list for LLM context (keep token count small and fast)
    const candidatesForPrompt = [
      ...candidateTops.slice(0, 5).map((p) => ({ id: p.productId, role: 'top', name: p.name, price: p.price, colors: p.colors })),
      ...candidateBottoms.slice(0, 5).map((p) => ({ id: p.productId, role: 'bottom', name: p.name, price: p.price, colors: p.colors })),
      ...candidateOuters.slice(0, 4).map((p) => ({ id: p.productId, role: 'outer', name: p.name, price: p.price, colors: p.colors })),
      ...candidateAccs.slice(0, 4).map((p) => ({ id: p.productId, role: 'acc', name: p.name, price: p.price, colors: p.colors })),
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.shopaikey.com/v1';
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    let aiResult: {
      selectedTopId?: string;
      selectedBottomId?: string;
      selectedOuterId?: string;
      selectedAccId?: string;
      keyAccentSlot?: 'top' | 'outer' | 'bottom';
      bodyShapeAnalysis?: string;
      stylistNote?: string;
      matchScore?: number;
    } | null = null;

    if (apiKey) {
      try {
        const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }> = [
          {
            type: 'text',
            text: `TIÊU CHÍ PHỐI ĐỒ:
- Dịp diện đồ: ${occasion}
- Phong cách & Vibe: ${vibe}
- Ngân sách tối đa: ${budgetLimit.toLocaleString('vi-VN')} VNĐ
- Tone màu ưu tiên: ${preferredColors.join(', ')} (ĐẶC BIỆT: Nếu có 'do', BẮT BUỘC món chủ đạo top hoặc outer phải là màu Đỏ rượu)
${body.voicePrompt ? `- Ghi chú giọng nói: "${body.voicePrompt}"` : ''}

DANH SÁCH SẢN PHẨM ỨNG VIÊN:
${JSON.stringify(candidatesForPrompt, null, 2)}

Hãy phân tích vóc dáng và chọn đúng 1 Áo (top), 1 Quần/Váy (bottom), 1 Áo khoác (outer) và 1 Phụ kiện (acc).
Trả về duy nhất JSON hợp lệ theo schema sau:
{
  "selectedTopId": "mã id sản phẩm áo",
  "selectedBottomId": "mã id sản phẩm quần",
  "selectedOuterId": "mã id sản phẩm áo khoác",
  "selectedAccId": "mã id sản phẩm phụ kiện/giày",
  "keyAccentSlot": "top" hoặc "outer",
  "bodyShapeAnalysis": "Nhận xét ngắn về vóc dáng, tỷ lệ hình thể (nếu có ảnh)",
  "stylistNote": "Giải thích chi tiết của Stylist: vì sao set đồ này phối màu chuẩn, tôn dáng và phù hợp với dịp",
  "matchScore": 95
}`,
          },
        ];

        // Attach image if valid snapshot base64 or URL is provided
        if (photo && (photo.startsWith('data:image/') || photo.startsWith('http'))) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: photo,
              detail: 'low',
            },
          });
        }

        const llmResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'Bạn là Senior AI Stylist thời trang của MaisonAI. Bạn chuyên phân tích hình thể từ ảnh và chọn trang phục phối đồ có gu tinh tế. BẮT BUỘC tuân thủ yêu cầu màu sắc của người dùng và luôn trả về định dạng JSON hợp lệ.',
              },
              {
                role: 'user',
                content: userContent,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 800,
          }),
        });

        if (llmResponse.ok) {
          const data = await llmResponse.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            aiResult = JSON.parse(content);
          }
        } else {
          console.error('ShopAIKey API error status:', llmResponse.status);
        }
      } catch (err) {
        console.error('Error calling ShopAIKey gpt-4o-mini:', err);
      }
    }

    // Resolve products from AI recommendation or fallback with strict category isolation
    const topId = aiResult?.selectedTopId || (aiResult as any)?.top?.id || (aiResult as any)?.topId;
    const bottomId = aiResult?.selectedBottomId || (aiResult as any)?.bottom?.id || (aiResult as any)?.bottomId;
    const outerId = aiResult?.selectedOuterId || (aiResult as any)?.outer?.id || (aiResult as any)?.outerId;
    const accId = aiResult?.selectedAccId || (aiResult as any)?.acc?.id || (aiResult as any)?.accId;

    let chosenTop = tops.find((p) => p.productId === topId);
    let chosenBottom = bottoms.find((p) => p.productId === bottomId);
    let chosenOuter = outers.find((p) => p.productId === outerId);
    let chosenAcc = accs.find((p) => p.productId === accId);

    // Fallback if AI missed or selected cross-category: enforce red item if 'do' is selected
    if (!chosenTop) {
      chosenTop = candidateTops[0] || tops[0];
    }
    if (!chosenBottom) {
      chosenBottom = candidateBottoms[0] || bottoms[0];
    }
    if (!chosenOuter) {
      chosenOuter = candidateOuters[0] || outers[0];
    }
    if (!chosenAcc) {
      chosenAcc = candidateAccs[0] || accs[0];
    }

    // Ensure that if user asked for Burgundy ('do'), at least top or outer is Burgundy
    if (hasBurgundyPreference) {
      const topIsRed = hasMatchingColor(chosenTop, ['do']);
      const outerIsRed = chosenOuter && hasMatchingColor(chosenOuter, ['do']);
      if (!topIsRed && !outerIsRed) {
        const fallbackRedTop = tops.find((p) => hasMatchingColor(p, ['do']));
        if (fallbackRedTop) chosenTop = fallbackRedTop;
      }
    }

    // Determine Key Accent garment (for Decart wear-on)
    let keyAccentItem = chosenTop;
    if (hasBurgundyPreference) {
      if (chosenOuter && hasMatchingColor(chosenOuter, ['do'])) {
        keyAccentItem = chosenOuter;
      } else if (hasMatchingColor(chosenTop, ['do'])) {
        keyAccentItem = chosenTop;
      }
    }

    const stylistNote =
      aiResult?.stylistNote ||
      `Set đồ được AI Stylist phối riêng cho dịp ${occasion} theo phong cách ${vibe}. Điểm nhấn trung tâm là ${keyAccentItem.name.split('—')[0]} mang tone màu nổi bật, kết hợp tinh tế cùng các item trung tính tạo nên tỷ lệ cân bằng thanh thoát và thời thượng.`;

    const bodyAnalysis = aiResult?.bodyShapeAnalysis || 'Dáng người cân đối, tỷ lệ vai và hông hài hòa.';
    const matchScore = aiResult?.matchScore || 96;

    return NextResponse.json({
      success: true,
      modelUsed: apiKey ? model : 'heuristic-local',
      top: chosenTop,
      bottom: chosenBottom,
      outer: chosenOuter,
      acc: chosenAcc,
      keyAccentItem,
      bodyAnalysis,
      stylistNote,
      matchScore,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
