import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import {
  evaluateBuildCompatibility,
  generateUpgradeStages,
  recommendBuildByBudget,
  type BuildSlotsSelection,
  type ComponentSpecInput,
} from "@/lib/domain/compatibility";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { sumCents } from "@/lib/domain/money";

const slotSchema = z.object({
  cpuId: z.string().nullable().optional(),
  motherboardId: z.string().nullable().optional(),
  ramId: z.string().nullable().optional(),
  gpuId: z.string().nullable().optional(),
  storageId: z.string().nullable().optional(),
  psuId: z.string().nullable().optional(),
  caseId: z.string().nullable().optional(),
  coolerId: z.string().nullable().optional(),
  peripheralIds: z.array(z.string()).optional(),
});

const evaluateSchema = z.object({
  action: z.enum(["evaluate", "recommend", "save"]).default("evaluate"),
  buildMode: z.enum(["NEW_PC", "UPGRADE"]).default("NEW_PC"),
  primaryUse: z
    .enum(["GAMING", "STUDY_WORK", "CONTENT_CREATION", "OFFICE_PYME"])
    .default("GAMING"),
  budgetCents: z.number().int().min(100000).max(50000000).default(550000),
  gamesOrPrograms: z.string().optional().default(""),
  currentEquipmentNotes: z.string().optional().default(""),
  includeAssembly: z.boolean().default(true),
  name: z.string().optional().default("Configuración ClickTech"),
  requestTechnicalReview: z.boolean().default(false),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  slots: slotSchema.optional(),
});

async function loadAllComponents(): Promise<ComponentSpecInput[]> {
  const rows = await prisma.product.findMany({
    where: {
      isPublished: true,
      compatibilitySpec: { isNot: null },
    },
    include: { compatibilitySpec: true },
  });

  return rows.map((p) => {
    const s = p.compatibilitySpec!;
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      model: p.model,
      priceCents: p.promoPriceCents ?? p.priceCents,
      stockAvailable: getAvailableStock(p),
      componentType: s.componentType,
      socket: s.socket,
      chipset: s.chipset,
      biosVersionRequired: s.biosVersionRequired,
      supportedCpuSeries: (s.supportedCpuSeries as string[] | null) ?? null,
      ramGeneration: s.ramGeneration,
      ramSlots: s.ramSlots,
      ramModulesCount: s.ramModulesCount,
      ramCapacityGb: s.ramCapacityGb,
      maxRamGb: s.maxRamGb,
      formFactor: s.formFactor,
      supportedFormFactors: (s.supportedFormFactors as string[] | null) ?? null,
      tdpWatts: s.tdpWatts,
      recommendedPsuWatts: s.recommendedPsuWatts,
      psuWatts: s.psuWatts,
      pcie8PinConnectors: s.pcie8PinConnectors,
      pcie12Vhpwr: s.pcie12Vhpwr,
      gpuLengthMm: s.gpuLengthMm,
      caseMaxGpuLengthMm: s.caseMaxGpuLengthMm,
      coolerHeightMm: s.coolerHeightMm,
      caseMaxCoolerHeightMm: s.caseMaxCoolerHeightMm,
      supportedSockets: (s.supportedSockets as string[] | null) ?? null,
      m2Slots: s.m2Slots,
      sataPorts: s.sataPorts,
      storageInterface: s.storageInterface,
      hasIntegratedGraphics: s.hasIntegratedGraphics,
    };
  });
}

export async function POST(req: NextRequest) {
  const parsed = evaluateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de configuración inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const allComponents = await loadAllComponents();
  const byId = new Map(allComponents.map((c) => [c.productId, c]));

  const assemblySrv = await prisma.serviceCatalog.findUnique({
    where: { slug: "ensamblaje-personalizado" },
  });
  const assemblyFeeCents = data.includeAssembly ? assemblySrv?.basePriceCents ?? 18000 : 0;

  let selection: BuildSlotsSelection = {};
  let advisorNote: string | null = null;

  if (data.action === "recommend") {
    const rec = recommendBuildByBudget(data.budgetCents, data.primaryUse, allComponents);
    selection = rec.selection;
    advisorNote = rec.note;
  } else {
    const sl = data.slots ?? {};
    selection = {
      cpu: sl.cpuId ? byId.get(sl.cpuId) ?? null : null,
      motherboard: sl.motherboardId ? byId.get(sl.motherboardId) ?? null : null,
      ram: sl.ramId ? byId.get(sl.ramId) ?? null : null,
      gpu: sl.gpuId ? byId.get(sl.gpuId) ?? null : null,
      storage: sl.storageId ? byId.get(sl.storageId) ?? null : null,
      psu: sl.psuId ? byId.get(sl.psuId) ?? null : null,
      pcCase: sl.caseId ? byId.get(sl.caseId) ?? null : null,
      cooler: sl.coolerId ? byId.get(sl.coolerId) ?? null : null,
      peripherals: (sl.peripheralIds ?? [])
        .map((id) => byId.get(id))
        .filter((x): x is ComponentSpecInput => Boolean(x)),
    };
  }

  const evaluation = evaluateBuildCompatibility(selection, data.buildMode);
  const upgradeStages = generateUpgradeStages(
    selection,
    data.budgetCents,
    data.primaryUse,
    allComponents
  );
  const totalCents = sumCents(evaluation.partsSubtotalCents, assemblyFeeCents);
  const budgetDifferenceCents = data.budgetCents - totalCents;

  if (data.action !== "save") {
    return NextResponse.json({
      selection,
      advisorNote,
      evaluation,
      upgradeStages,
      assemblyFeeCents,
      totalCents,
      budgetDifferenceCents,
    });
  }

  // Persist configuration and optionally create a technical Quote for review
  const user = await getCurrentUser();
  const shareToken = crypto.randomBytes(8).toString("hex");
  const selectedArray = [
    selection.cpu,
    selection.motherboard,
    selection.ram,
    selection.gpu,
    selection.storage,
    selection.psu,
    selection.pcCase,
    selection.cooler,
    ...(selection.peripherals ?? []),
  ].filter((x): x is ComponentSpecInput => Boolean(x));

  if (selectedArray.length === 0) {
    return NextResponse.json(
      { error: "Selecciona al menos un componente antes de guardar." },
      { status: 400 }
    );
  }

  const saved = await prisma.$transaction(async (tx) => {
    const config = await tx.pcConfiguration.create({
      data: {
        shareToken,
        userId: user?.id ?? null,
        name: data.name.trim() || "Mi PC ClickTech",
        buildMode: data.buildMode,
        budgetCents: data.budgetCents,
        primaryUse: data.primaryUse,
        gamesOrPrograms: data.gamesOrPrograms || null,
        currentEquipmentNotes: data.currentEquipmentNotes || null,
        itemsJson: selectedArray.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          componentType: item.componentType,
          priceCents: item.priceCents,
        })) as Prisma.InputJsonValue,
        compatibilityStatus: evaluation.status,
        compatibilityReportJson: evaluation.findings as unknown as Prisma.InputJsonValue,
        upgradeStagesJson: upgradeStages as unknown as Prisma.InputJsonValue,
        subtotalCents: evaluation.partsSubtotalCents,
        assemblyFeeCents,
        totalCents,
      },
    });

    let quote = null;
    if (data.requestTechnicalReview) {
      const custName = data.customerName?.trim() || user?.name || "Visitante Configurador";
      const custEmail = data.customerEmail?.trim() || user?.email || "sin-correo@clicktech.example";
      const custPhone = data.customerPhone?.trim() || user?.phone || "Pendiente";
      const quoteNumber = `COT-PC-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      quote = await tx.quote.create({
        data: {
          quoteNumber,
          type: "PC_BUILD",
          userId: user?.id ?? null,
          customerName: custName,
          customerEmail: custEmail,
          customerPhone: custPhone,
          notes: `Estado compatibilidad: ${evaluation.statusLabel}. Uso: ${data.primaryUse}. ${data.gamesOrPrograms}`,
          status: "SENT_PENDING_APPROVAL",
          currentVersion: 1,
          validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          pcConfigurationId: config.id,
          versions: {
            create: {
              version: 1,
              itemsSnapshotJson: selectedArray.map((item) => ({
                kind: "PRODUCT",
                productId: item.productId,
                sku: item.sku,
                label: item.name,
                quantity: 1,
                unitPriceCents: item.priceCents,
                lineTotalCents: item.priceCents,
              })) as Prisma.InputJsonValue,
              subtotalCents: evaluation.partsSubtotalCents,
              assemblyOrLaborCents: assemblyFeeCents,
              totalCents,
              termsSnapshot:
                evaluation.status === "COMPATIBLE"
                  ? "Configuración compatible según datos de catálogo. Sujeta a disponibilidad al confirmar."
                  : "Configuración enviada a revisión técnica humana para validar compatibilidad o stock.",
              changeReason: "Cotización generada desde configurador Arma tu PC",
              status: "PENDING",
              createdById: user?.id ?? null,
            },
          },
        },
      });
    }

    return { config, quote };
  });

  return NextResponse.json(
    {
      config: saved.config,
      quote: saved.quote,
      shareUrl: `/arma-tu-pc?share=${saved.config.shareToken}`,
      evaluation,
      upgradeStages,
      assemblyFeeCents,
      totalCents,
      budgetDifferenceCents,
    },
    { status: 201 }
  );
}
