import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicBusinessSettings } from "@/lib/domain/business-config";

export async function GET() {
  const [settings, deliveryZones, categories, brands] = await Promise.all([
    getPublicBusinessSettings(),
    prisma.deliveryZone.findMany({ where: { isAvailable: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    settings,
    deliveryZones,
    categories,
    brands,
  });
}
