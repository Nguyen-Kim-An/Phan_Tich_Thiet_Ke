import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'apps', 'web', 'src', 'data', 'crawled-catalog.json');
const SOURCE = 'https://www.everlane.com';
const USER_AGENT =
  'Mozilla/5.0 (compatible; SmartFashionAcademicCrawler/2.0; +coursework)';

const categorySources = [
  {
    category: 'ao',
    label: 'Áo',
    limit: 56,
    feeds: ['womens-tops', 'womens-sweaters'],
    basePrice: 950000,
  },
  {
    category: 'quan',
    label: 'Quần',
    limit: 56,
    feeds: ['womens-pants-trousers', 'womens-jeans'],
    basePrice: 1290000,
  },
  {
    category: 'vay',
    label: 'Váy',
    limit: 56,
    feeds: ['womens-dresses', 'womens-skirts-shorts'],
    basePrice: 1490000,
  },
  {
    category: 'ao-khoac',
    label: 'Áo khoác',
    limit: 56,
    feeds: ['womens-outerwear'],
    basePrice: 2290000,
  },
  {
    category: 'giay',
    label: 'Giày',
    limit: 55,
    feeds: ['womens-shoes'],
    basePrice: 1790000,
  },
  {
    category: 'phu-kien',
    label: 'Phụ kiện',
    limit: 55,
    feeds: ['womens-bags', 'womens-all-accessories'],
    basePrice: 890000,
  },
];

const COLOR_HEX_MAP = [
  { match: /white|ivory|bone|cream|canvas|chalk|ecru|pearl/i, vn: 'Trắng kem', hex: '#f4f1ea', tag: 'white' },
  { match: /black|onyx|ink|caviar|coal/i, vn: 'Đen', hex: '#1e1e1e', tag: 'black' },
  { match: /grey|gray|heather|charcoal|slate|silver|ash|stone/i, vn: 'Xám đá', hex: '#8b8c89', tag: 'grey' },
  { match: /navy|blue|indigo|denim|sky|cobalt|marine|cerulean|chambray/i, vn: 'Xanh dương', hex: '#3b5978', tag: 'blue' },
  { match: /green|olive|sage|moss|forest|khaki|pine|kelly/i, vn: 'Xanh rêu', hex: '#586f56', tag: 'green' },
  { match: /red|burgundy|wine|crimson|cherry|garnet|rust|terracotta|brick/i, vn: 'Đỏ rượu', hex: '#8c2d2d', tag: 'red' },
  { match: /pink|rose|blush|coral|peony|berry|mauve/i, vn: 'Hồng phấn', hex: '#d89ca3', tag: 'pink' },
  { match: /yellow|gold|mustard|butter|lemon|ochre|amber/i, vn: 'Vàng bơ', hex: '#d9b44a', tag: 'yellow' },
  { match: /brown|camel|cognac|chocolate|espresso|toffee|walnut|cocoa|tan|pecan|caramel/i, vn: 'Nâu Caramel', hex: '#7a5234', tag: 'brown' },
  { match: /beige|sand|oat|taupe|khaki|natural|flax|wheat|dune|bisque/i, vn: 'Be cát', hex: '#cbbba0', tag: 'beige' },
];

const VN_SILHOUETTE_MAP = [
  [/oxford|button-down|shirt|poplin/i, 'Áo Sơ Mi Thanh Lịch'],
  [/blouse|silk|satin|camisole|shell/i, 'Áo Lụa Mềm Mại'],
  [/cardigan|sweater|crew|turtleneck|cashmere|knit|polo/i, 'Áo Dệt Kim Thu Đông'],
  [/tee|t-shirt|tank|bodysuit|henley|top/i, 'Áo Phông & Top Tối Giản'],
  [/blazer|jacket|coat|trench|parka|puffer|vest|anorak|overshirt/i, 'Áo Khoác Cấu Trúc'],
  [/wide-leg|drape|trouser|tailored|pant|chino/i, 'Quần Âu Ống Suông'],
  [/barrel|utility|cargo|ankle/i, 'Quần Phom Barrel Hiện Đại'],
  [/jean|denim|90s|cheeky|way-high|baggy/i, 'Quần Jeans Cạp Cao'],
  [/midi dress|maxi dress|slip dress|shirt dress|wrap dress|dress/i, 'Đầm Thiết Kế Tôn Dáng'],
  [/skirt|skort/i, 'Chân Váy Thanh Lịch'],
  [/short/i, 'Quần Short Tinh Gọn'],
  [/loafer|flat|ballet|mary jane|mule/i, 'Giày Bệt & Loafer Da Mềm'],
  [/boot|chelsea|ankle boot/i, 'Giày Boots Cổ Thấp'],
  [/heel|slingback|sandal|pump/i, 'Giày Cao Gót & Sandal'],
  [/sneaker|trainer/i, 'Giày Sneaker Năng Động'],
  [/tote|crossbody|shoulder bag|bag|clutch|backpack|pouch/i, 'Túi Da Thủ Công'],
  [/belt|scarf|hat|beanie|cap|sock|sunglass|wallet/i, 'Phụ Kiện Phối Đồ'],
];

const stripHtml = (value) =>
  (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function inferColorInfo(title, tags) {
  const combined = `${title} ${(tags || []).join(' ')}`;
  for (const rule of COLOR_HEX_MAP) {
    if (rule.match.test(combined)) {
      return rule;
    }
  }
  return { vn: 'Be trung tính', hex: '#d8d4cd', tag: 'beige' };
}

function buildVietnameseTitle(rawTitle, categoryLabel, colorVn) {
  const parts = rawTitle.split('|').map((s) => s.trim());
  const baseTitle = parts[0].replace(/^The\s+/i, '').trim();
  let prefix = categoryLabel;
  for (const [regex, vnPrefix] of VN_SILHOUETTE_MAP) {
    if (regex.test(baseTitle)) {
      prefix = vnPrefix;
      break;
    }
  }
  return `${prefix} ${baseTitle} — ${colorVn}`;
}

function buildVietnameseDescription(rawHtml, vnTitle, categoryLabel, colorVn) {
  const cleanEn = stripHtml(rawHtml);
  const occasions =
    categoryLabel === 'Áo khoác' || categoryLabel === 'Quần'
      ? 'phù hợp mặc đi làm công sở, gặp đối tác hoặc dạo phố thanh lịch'
      : categoryLabel === 'Váy'
      ? 'tôn vòng eo và kéo dài tỷ lệ cơ thể cho cả công sở lẫn tiệc tối sang trọng'
      : 'dễ dàng phối nhiều lớp (layering) trong tủ đồ tối giản hiện đại';
  return `${vnTitle} với sắc ${colorVn.toLowerCase()} tinh tế, đường cắt chuẩn xác ${occasions}. ${cleanEn}`;
}

function optimizeShopifyImage(src) {
  if (!src) return '';
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}width=900`;
}

async function fetchFeed(handle) {
  const url = `${SOURCE}/collections/${handle}/products.json?limit=250`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const data = await response.json();
  return data.products || [];
}

function selectDiverseProducts(rawProducts, limit) {
  const valid = rawProducts.filter(
    (p) => p.images?.length >= 1 && p.variants?.length >= 1
  );

  // Group by base model name (before '|') so we pick diverse models first before repeating colorways
  const byModel = new Map();
  for (const p of valid) {
    const modelKey = p.title.split('|')[0].trim().toLowerCase();
    if (!byModel.has(modelKey)) byModel.set(modelKey, []);
    byModel.get(modelKey).push(p);
  }

  const picked = [];
  const pickedIds = new Set();
  let round = 0;

  while (picked.length < limit) {
    let addedInRound = 0;
    for (const group of byModel.values()) {
      if (round < group.length) {
        const candidate = group[round];
        if (!pickedIds.has(String(candidate.id))) {
          picked.push(candidate);
          pickedIds.add(String(candidate.id));
          addedInRound++;
          if (picked.length >= limit) break;
        }
      }
    }
    if (addedInRound === 0) break;
    round++;
  }

  return picked;
}

async function main() {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const catalog = [];
  const globalSeenIds = new Set();

  for (const group of categorySources) {
    let combinedRaw = [];
    for (const handle of group.feeds) {
      console.log(`Fetching feed: ${handle}...`);
      const items = await fetchFeed(handle);
      combinedRaw.push(
        ...items.filter((it) => !globalSeenIds.has(String(it.id)))
      );
    }

    const selected = selectDiverseProducts(combinedRaw, group.limit);
    console.log(
      `-> Selected ${selected.length} diverse products for category "${group.label}" (${group.category})`
    );

    selected.forEach((product, idx) => {
      globalSeenIds.add(String(product.id));
      const colorInfo = inferColorInfo(product.title, product.tags || []);
      const vnName = buildVietnameseTitle(
        product.title,
        group.label,
        colorInfo.vn
      );
      const vnDesc = buildVietnameseDescription(
        product.body_html,
        vnName,
        group.label,
        colorInfo.vn
      );

      // Vary prices realistically between 590,000 VND and 4,890,000 VND
      const priceStep = ((idx * 13 + Number(String(product.id).slice(-3))) % 22) * 120000;
      const demoPrice = group.basePrice + priceStep;

      const primaryImg = optimizeShopifyImage(product.images[0]?.src);
      const altImg = optimizeShopifyImage(
        product.images[1]?.src || product.images[0]?.src
      );

      const availableVariants = product.variants.filter((v) => v.available);
      const chosenVariants = (
        availableVariants.length ? availableVariants : product.variants
      ).slice(0, 5);

      const standardSizes = ['XS', 'S', 'M', 'L', 'XL'];

      catalog.push({
        productId: String(product.id),
        handle: product.handle,
        name: vnName,
        category: group.label,
        categorySlug: group.category,
        price: demoPrice,
        description: vnDesc,
        image: primaryImg,
        imageAlt: altImg,
        colors: [colorInfo.tag, colorInfo.vn],
        variants: chosenVariants.map((variant, vIdx) => {
          const cleanSize =
            /^(XXS|XS|S|M|L|XL|XXL|\d+)$/i.test(variant.title.trim())
              ? variant.title.trim().toUpperCase()
              : standardSizes[vIdx % standardSizes.length];
          return {
            variantId: String(variant.id),
            sku: variant.sku || `SF-${product.id}-${vIdx + 1}`,
            colorCode: colorInfo.hex,
            colorName: colorInfo.vn,
            size: cleanSize,
            price: demoPrice,
            stock: 4 + ((Number(String(variant.id).slice(-2)) + vIdx) % 14),
          };
        }),
        source: {
          retailer: 'Everlane',
          sourcePage: `${SOURCE}/collections/${group.feeds[0]}`,
          productPage: `${SOURCE}/products/${product.handle}`,
          images: [primaryImg, altImg],
        },
      });
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      name: 'Everlane',
      collection: `${SOURCE}/collections/womens-new-arrivals`,
      robots: `${SOURCE}/robots.txt`,
    },
    note: 'Curated 330+ real fashion products across 6 categories (55+ per category) with high-res photography and Vietnamese metadata.',
    products: catalog,
  };

  await writeFile(DATA_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`SUCCESS: Wrote ${catalog.length} products to ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
