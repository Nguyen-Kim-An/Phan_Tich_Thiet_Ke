/**
 * PACKAGE: model (Domain Entity Classes)
 * Locked to SYSTEM_DESIGN_LOCKED.md (v2.0 — Chuẩn PTIT)
 */

export type Modality = 'text' | 'voice' | 'image';

export type UserRole = 'customer' | 'admin';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  categoryId: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string;
}

export interface ProductVariant {
  variantId: string;
  productId?: string;
  sku: string;
  colorCode: string;
  colorName: string;
  size: string;
  price: number;
  stock: number; // Alias compatible with catalog
  stockQuantity: number;
}

export interface ProductSource {
  retailer: string;
  sourcePage: string;
  productPage: string;
  images: string[];
}

export interface Product {
  productId: string;
  categoryId?: string;
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
  match?: number;
  badges?: string[];
  textEmbedding?: number[];
  imageEmbedding?: number[];
  variants: ProductVariant[];
  source: ProductSource;
}

export interface BoundingBox {
  id: string;
  label: string;
  categorySlug: string;
  x: number; // percentage 0..100
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface HardFilters {
  categorySlug?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  size?: string;
}

export interface QueryRepresentation {
  queryId: string;
  userId?: string;
  rawText: string;
  modality: Modality;
  hardFilters: HardFilters;
  softTokens: string[];
  relaxedFilters: string[];
  vector: number[];
  selectedBox?: BoundingBox;
  createdAt: string;
}

export interface SearchResult {
  resultId: string;
  queryId: string;
  productId: string;
  rank: number;
  score: number;
  badges: string[];
  product: Product;
}

export interface BodyAnalysisProfile {
  bodyShape: 'Đồng hồ cát (Hourglass)' | 'Quả lê (Pear)' | 'Chữ nhật (Rectangle)' | 'Tam giác ngược (Inverted Triangle)';
  shoulderHipRatio: string;
  undertone: 'Warm Ivory (Ấm)' | 'Cool Neutral (Trung tính lạnh)' | 'Olive Natural (Tự nhiên)';
  heightEstimate: string;
  recommendedFit: string;
  avoidNote: string;
}

export interface StylistPreferences {
  occasion: string;
  styleVibe: string;
  fitGoal: string;
  budgetLimit: number;
  preferredColors: string[];
  rawVoiceNote?: string;
}

export interface OutfitItem {
  outfitItemId: string;
  outfitId: string;
  productId: string;
  variantId: string;
  slotRole: 'Áo chủ đạo' | 'Quần / Chân váy' | 'Áo khoác Layer' | 'Phụ kiện / Giày';
  isMainItem: boolean;
  product: Product;
  variant: ProductVariant;
}

export interface Outfit {
  outfitId: string;
  stylistSessionId: string;
  title: string;
  styleTag: string;
  occasion: string;
  stylistNote: string;
  matchScore: number;
  matchBadges: string[];
  totalPrice: number;
  items: OutfitItem[];
}

export interface StylistSession {
  stylistSessionId: string;
  userId?: string;
  userPhotoUrl: string;
  inputMode: 'quiz' | 'voice';
  bodyShape: string;
  bodyProfile: BodyAnalysisProfile;
  occasion: string;
  styleVibe: string;
  budgetLimit: number;
  preferences: StylistPreferences;
  voiceTranscript?: string;
  recommendedOutfits: Outfit[];
  createdAt: string;
}

export interface TryOnSession {
  sessionId: string;
  stylistSessionId?: string;
  userId?: string;
  userImageUrl: string;
  outfitId?: string;
  variantId?: string;
  resultImageUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  fitConfidence: number;
  drapeNote: string;
  createdAt: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ShippingMethodId =
  | 'motorbike'
  | 'bicycle'
  | 'car'
  | 'drone'
  | 'autonomous'
  | 'airplane';

export interface OrderItem {
  orderItemId: string;
  orderId: string;
  variantId: string;
  productId: string;
  productName: string;
  colorName: string;
  size: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  streetAddress: string;
  district: string;
  city: string;
  paymentMethod: 'cod' | 'online';
  shippingMethod?: ShippingMethodId;
  originAddress?: string;
}

export interface Order {
  orderId: string;
  orderCode: string;
  userId: string;
  totalAmount: number;
  shippingFee: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  createdAt: string;
}

export interface ParsedIntent {
  hardFilters: HardFilters;
  softTokens: string[];
  textVector: number[];
  detectedOrderCode?: string;
}

export interface RetrievalResult {
  queryId: string;
  allowedIds: string[];
  isRelaxed: boolean;
  relaxedNotice?: string;
  keywordScores: Map<string, number>;
  vectorScores: Map<string, number>;
}

export interface SearchRequest {
  text?: string;
  modality?: Modality;
  imageFile?: File | null;
  selectedBox?: BoundingBox;
  uiOverrides?: Partial<HardFilters>;
}

export interface SearchResponse {
  queryRepresentation: QueryRepresentation;
  results: SearchResult[];
  isRelaxed: boolean;
  relaxedNotice?: string;
  matchedOrder?: Order | null;
  orderLookupCode?: string;
}

export interface StylistRequest {
  photoUrl: string;
  inputMode: 'quiz' | 'voice';
  quizAnswers?: {
    occasion: string;
    styleVibe: string;
    fitGoal: string;
    budgetLimit: number;
  };
  voiceText?: string;
}
