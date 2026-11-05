import { forwardImageSearch } from '@/services/image-search-proxy';
export const runtime = 'nodejs';
export const POST = (request: Request) => forwardImageSearch(request);
