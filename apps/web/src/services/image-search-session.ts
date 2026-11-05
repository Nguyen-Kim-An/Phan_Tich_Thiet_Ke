import type { ImageSearchResult, ImageSearchMatch } from './image-search-types';

export interface ImageSearchSession extends ImageSearchResult {
  fileName: string;
  createdAt: number;
}
const PREFIX = 'maison_image_search_v2_';

export function saveImageSearch(session: ImageSearchSession): string {
  const id = crypto.randomUUID();
  // Keep grounded product snapshots and analysis in this tab, never the photo or API key.
  sessionStorage.setItem(PREFIX + id, JSON.stringify(session));
  return id;
}

export function readImageSearch(id: string): ImageSearchSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(PREFIX + id) || 'null');
    if (!value || !Number.isFinite(value.createdAt) || Date.now() - value.createdAt > 30 * 60 * 1000 ||
      !Array.isArray(value.matches) || value.matches.length > 12 ||
      value.strategy !== 'vision-rag' ||
      !value.matches.every((item: ImageSearchMatch) => typeof item.productId === 'string' && Number.isFinite(item.score))) return null;
    return value;
  } catch { return null; }
}
