import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import {
  PcConfiguratorClient,
  type BuilderCatalogOption,
} from "@/components/builder/PcConfiguratorClient";

export const dynamic = "force-dynamic";

export default async function ArmaTuPcPage({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const sp = await searchParams;

  const [products, assemblyService, sharedConfig] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, compatibilitySpec: { isNot: null } },
      orderBy: { priceCents: "asc" },
      include: { brand: true, compatibilitySpec: true },
    }),
    prisma.serviceCatalog.findUnique({ where: { slug: "ensamblaje-personalizado" } }),
    sp.share
      ? prisma.pcConfiguration.findUnique({ where: { shareToken: sp.share } })
      : Promise.resolve(null),
  ]);

  const components: BuilderCatalogOption[] = products.map((p) => {
    const s = p.compatibilitySpec!;
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      model: p.model,
      brandName: p.brand.name,
      priceCents: p.promoPriceCents ?? p.priceCents,
      stockAvailable: getAvailableStock(p),
      componentType: s.componentType,
      socket: s.socket,
      chipset: s.chipset,
      biosVersionRequired: s.biosVersionRequired,
      ramGeneration: s.ramGeneration,
      formFactor: s.formFactor,
      gpuLengthMm: s.gpuLengthMm,
      caseMaxGpuLengthMm: s.caseMaxGpuLengthMm,
      psuWatts: s.psuWatts,
      hasIntegratedGraphics: s.hasIntegratedGraphics,
    };
  });

  let initialShareConfig = null;
  if (sharedConfig) {
    const items = (sharedConfig.itemsJson as Array<{ productId: string; componentType: string }>) ?? [];
    const slotMap: Record<string, string> = {};
    for (const it of items) {
      if (it.componentType === "CPU") slotMap.cpuId = it.productId;
      else if (it.componentType === "MOTHERBOARD") slotMap.motherboardId = it.productId;
      else if (it.componentType === "RAM") slotMap.ramId = it.productId;
      else if (it.componentType === "GPU") slotMap.gpuId = it.productId;
      else if (it.componentType === "STORAGE") slotMap.storageId = it.productId;
      else if (it.componentType === "PSU") slotMap.psuId = it.productId;
      else if (it.componentType === "CASE") slotMap.caseId = it.productId;
      else if (it.componentType === "COOLER") slotMap.coolerId = it.productId;
    }
    initialShareConfig = {
      name: sharedConfig.name,
      buildMode: sharedConfig.buildMode,
      primaryUse: sharedConfig.primaryUse,
      budgetCents: sharedConfig.budgetCents,
      gamesOrPrograms: sharedConfig.gamesOrPrograms ?? "",
      currentEquipmentNotes: sharedConfig.currentEquipmentNotes ?? "",
      slots: slotMap,
    };
  }

  return (
    <PcConfiguratorClient
      components={components}
      assemblyFeeCents={assemblyService?.basePriceCents ?? 18000}
      initialShareConfig={initialShareConfig}
    />
  );
}
