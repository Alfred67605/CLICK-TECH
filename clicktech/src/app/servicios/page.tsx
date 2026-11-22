import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import {
  ServiceIntakeClient,
  type ServiceCatalogItem,
} from "@/components/services/ServiceIntakeClient";

export const dynamic = "force-dynamic";

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const sp = await searchParams;
  const [servicesRaw, user] = await Promise.all([
    prisma.serviceCatalog.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getCurrentUser(),
  ]);

  const services: ServiceCatalogItem[] = servicesRaw.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category,
    description: s.description,
    scope: s.scope,
    pricingType: s.pricingType,
    basePriceCents: s.basePriceCents,
    estimatedDurationHours: s.estimatedDurationHours,
    conditions: s.conditions,
    imageUrl: s.imageUrl,
  }));

  return (
    <ServiceIntakeClient
      services={services}
      initialSlug={sp.service ?? ""}
      currentUser={
        user ? { name: user.name, email: user.email, phone: user.phone } : null
      }
    />
  );
}
