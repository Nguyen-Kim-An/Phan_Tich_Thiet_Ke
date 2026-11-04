import type { StylistRequest, StylistSession } from '@/domain/models';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function requestStylistRecommendations(
  request: Omit<StylistRequest, 'photoUrl'>,
  signal?: AbortSignal
): Promise<StylistSession> {
  const response = await fetch(`${API_BASE_URL}/ai/stylist/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Không thể tạo gợi ý (HTTP ${response.status}).`);
  }

  return response.json() as Promise<StylistSession>;
}
