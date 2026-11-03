import { ShopCatalog } from '@/components/shop-catalog';

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string; category?: string }>;
}) {
  const params = await searchParams;
  return (
    <ShopCatalog
      initialQuery={params.q ?? ''}
      initialMode={params.mode ?? ''}
      initialCategory={params.category ?? ''}
    />
  );
}
