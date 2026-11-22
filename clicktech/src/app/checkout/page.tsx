import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { getPublicBusinessSettings } from "@/lib/domain/business-config";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [zones, settings, assemblyService, user] = await Promise.all([
    prisma.deliveryZone.findMany({ where: { isAvailable: true }, orderBy: { name: "asc" } }),
    getPublicBusinessSettings(),
    prisma.serviceCatalog.findUnique({ where: { slug: "ensamblaje-personalizado" } }),
    getCurrentUser(),
  ]);

  return (
    <CheckoutClient
      zones={zones.map((z) => ({
        id: z.id,
        slug: z.slug,
        name: z.name,
        feeCents: z.feeCents,
        estimatedSchedule: z.estimatedSchedule,
      }))}
      settings={settings}
      assemblyFeeCents={assemblyService?.basePriceCents ?? 18000}
      currentUser={
        user
          ? { id: user.id, name: user.name, email: user.email, phone: user.phone }
          : null
      }
    />
  );
}
