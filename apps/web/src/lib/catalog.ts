import crawledCatalog from '@/data/crawled-catalog.json';

export type Variant = { variantId:string; sku:string; colorCode:string; colorName:string; size:string; price:number; stock:number };
export type ProductSource = { retailer:string; sourcePage:string; productPage:string; images:string[] };
export type Product = {
  productId:string; handle:string; name:string; category:string; categorySlug:string; price:number;
  description:string; image:string; imageAlt:string; colors:string[]; match?:number;
  variants:Variant[]; source:ProductSource;
};

export const products = crawledCatalog.products as Product[];
export const catalogMeta = { generatedAt:crawledCatalog.generatedAt, source:crawledCatalog.source, note:crawledCatalog.note };
export const categories = [
  {slug:'ao',label:'Áo',description:'Sơ mi và phom áo nhẹ'},
  {slug:'quan',label:'Quần',description:'Phom suông, barrel và tailored'},
  {slug:'vay',label:'Váy',description:'Những đường cắt tối giản'},
  {slug:'ao-khoac',label:'Áo khoác',description:'Layer có cấu trúc'},
  {slug:'giay',label:'Giày',description:'Hoàn thiện bộ đồ'},
  {slug:'phu-kien',label:'Phụ kiện',description:'Chi tiết dùng mỗi ngày'},
];
export const money = (value:number) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(value);
export const productsByCategory = (slug:string) => products.filter(product => product.categorySlug === slug);
