import type { Product } from '@/domain/models';

export interface ImageSearchMatch {
  productId: string;
  score: number;
  reason?: string;
  product?: Product;
}

export interface ImageSearchResult {
  matches: ImageSearchMatch[];
  source: 'catalog' | 'postgres';
  model: string;
  strategy: 'vision-rag';
  analysis: { description: string; garmentType: string; categorySlug: string; colors: string[]; isClothing: boolean };
}
