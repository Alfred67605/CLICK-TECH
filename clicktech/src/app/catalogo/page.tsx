import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { CatalogExplorer, type CatalogItem } from "@/components/catalog/CatalogExplorer";

export const dynamic = "force-dynamic";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;

  const [productsRaw, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: {
        category: { select: { slug: true, name: true } },
        brand: { select: { slug: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        compatibilitySpec: { select: { socket: true, ramGeneration: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  const products: CatalogItem[] = productsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    model: p.model,
    brandName: p.brand.name,
    brandSlug: p.brand.slug,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.altText ?? p.name,
    isIllustrative: p.images[0]?.isIllustrative ?? true,
    priceCents: p.priceCents,
    promoPriceCents: p.promoPriceCents,
    promoLabel: p.promoLabel,
    stockAvailable: getAvailableStock(p),
    socket: p.compatibilitySpec?.socket ?? null,
    ramGeneration: p.compatibilitySpec?.ramGeneration ?? null,
    isPrebuiltPc: p.isPrebuiltPc,
    shortSpecsJson: (p.shortSpecsJson as Record<string, string> | null) ?? null,
  }));

  return (
    <CatalogExplorer
      initialProducts={products}
      categories={categories}
      brands={brands}
      initialQuery={sp.q ?? ""}
      initialCategory={sp.category ?? ""}
    />
  );
}
