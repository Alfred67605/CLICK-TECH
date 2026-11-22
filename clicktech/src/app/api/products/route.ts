import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { canRoleSeeInternalCost } from "@/lib/domain/service-rules";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const canSeeCost = canRoleSeeInternalCost(user?.role);

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const category = sp.get("category")?.trim() ?? "";
  const brand = sp.get("brand")?.trim() ?? "";
  const socket = sp.get("socket")?.trim() ?? "";
  const ramGen = sp.get("ramGen")?.trim() ?? "";
  const inStockOnly = sp.get("inStock") === "true";
  const minBs = sp.get("minBs") ? Number(sp.get("minBs")) : null;
  const maxBs = sp.get("maxBs") ? Number(sp.get("maxBs")) : null;
  const sort = sp.get("sort") ?? "featured";
  const includeUnpublished = sp.get("includeUnpublished") === "true" && canSeeCost;

  const where: Record<string, unknown> = {};
  if (!includeUnpublished) {
    where.isPublished = true;
  }
  if (category) {
    where.category = { slug: category };
  }
  if (brand) {
    where.brand = { slug: brand };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (minBs !== null && Number.isFinite(minBs)) {
    where.priceCents = { ...(where.priceCents as object | undefined), gte: Math.round(minBs * 100) };
  }
  if (maxBs !== null && Number.isFinite(maxBs)) {
    where.priceCents = { ...(where.priceCents as object | undefined), lte: Math.round(maxBs * 100) };
  }
  if (socket || ramGen) {
    where.compatibilitySpec = {
      ...(socket ? { socket } : {}),
      ...(ramGen ? { ramGeneration: ramGen } : {}),
    };
  }

  let orderBy: Record<string, string>[] = [{ isFeatured: "desc" }, { createdAt: "desc" }];
  if (sort === "price-asc") orderBy = [{ priceCents: "asc" }];
  else if (sort === "price-desc") orderBy = [{ priceCents: "desc" }];
  else if (sort === "newest") orderBy = [{ createdAt: "desc" }];

  const rows = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      category: { select: { id: true, slug: true, name: true } },
      brand: { select: { id: true, slug: true, name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      compatibilitySpec: true,
    },
  });

  const products = rows
    .map((p) => {
      const stockAvailable = Math.max(0, p.stockOnHand - p.stockReserved);
      return {
        id: p.id,
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        model: p.model,
        description: p.description,
        shortSpecs: p.shortSpecsJson,
        priceCents: p.priceCents,
        promoPriceCents: p.promoPriceCents,
        promoLabel: p.promoLabel,
        ...(canSeeCost ? { costCents: p.costCents } : {}),
        stockOnHand: p.stockOnHand,
        stockReserved: p.stockReserved,
        stockAvailable,
        minStockAlert: p.minStockAlert,
        warrantyMonths: p.warrantyMonths,
        warrantyTerms: p.warrantyTerms,
        isPublished: p.isPublished,
        isFeatured: p.isFeatured,
        isPrebuiltPc: p.isPrebuiltPc,
        prebuiltTier: p.prebuiltTier,
        category: p.category,
        brand: p.brand,
        images: p.images,
        compatibilitySpec: p.compatibilitySpec,
      };
    })
    .filter((p) => (inStockOnly ? p.stockAvailable > 0 : true));

  return NextResponse.json({ products });
}
