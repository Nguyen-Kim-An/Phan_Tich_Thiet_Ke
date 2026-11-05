import { ShopCatalog } from '@/components/shop-catalog';

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    mode?: string;
    category?: string;
    boxCat?: string;
    boxLabel?: string;
    imageSearch?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <ShopCatalog
      initialQuery={params.q ?? ''}
      initialMode={params.mode ?? ''}
      initialImageSearchId={params.imageSearch ?? ''}
      initialCategory={params.category ?? ''}
      initialBoxCat={params.boxCat ?? ''}
      initialBoxLabel={params.boxLabel ?? ''}
    />
  );
}
