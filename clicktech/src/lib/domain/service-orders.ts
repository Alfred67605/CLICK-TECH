import crypto from "node:crypto";
import { Prisma, type Role, type ServiceOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/domain/audit";
import { DomainRuleError } from "@/lib/domain/inventory-orders";
import { lineTotalCents, sumCents } from "@/lib/domain/money";
import {
  canTransitionServiceStatus,
  SERVICE_STATUS_LABELS,
  STATUSES_REQUIRING_APPROVED_QUOTE,
} from "@/lib/domain/service-rules";

/**
 * Issues or updates the quote attached to a ServiceOrder.
 * If cost changes after a previous version existed, creates a NEW QuoteVersion (v+1)
 * and moves ServiceOrder to QUOTE_PENDING_APPROVAL so no paid work executes without customer sign-off.
 */
export async function issueServiceQuoteVersionTransactional(input: {
  serviceOrderId: string;
  laborCents: number;
  changeReason?: string | null;
  termsSnapshot?: string | null;
  actorId: string;
  actorRole: Role;
}) {
  return prisma.$transaction(async (tx) => {
    const so = await tx.serviceOrder.findUnique({
      where: { id: input.serviceOrderId },
      include: {
        parts: true,
        quotes: { include: { versions: { orderBy: { version: "desc" } } } },
      },
    });
    if (!so) {
      throw new DomainRuleError("Orden técnica no encontrada.", "SERVICE_ORDER_NOT_FOUND", 404);
    }
    if (so.status === "DELIVERED" || so.status === "CANCELLED") {
      throw new DomainRuleError(
        "No se puede cotizar una orden cerrada o cancelada.",
        "SERVICE_CLOSED",
        409
      );
    }

    const laborCents = Math.max(0, Math.trunc(input.laborCents));
    const partsTotalCents = so.parts.reduce(
      (acc, p) => sumCents(acc, lineTotalCents(p.unitPriceCentsSnapshot, p.quantity)),
      0
    );
    const totalCents = sumCents(laborCents, partsTotalCents);

    const itemsSnapshot = [
      {
        kind: "LABOR",
        label: "Mano de obra técnica y pruebas",
        quantity: 1,
        unitPriceCents: laborCents,
        lineTotalCents: laborCents,
      },
      ...so.parts.map((p) => ({
        kind: "PART",
        sku: p.skuSnapshot,
        label: p.productNameSnapshot,
        quantity: p.quantity,
        unitPriceCents: p.unitPriceCentsSnapshot,
        lineTotalCents: lineTotalCents(p.unitPriceCentsSnapshot, p.quantity),
      })),
    ];

    let quote = so.quotes[0];
    const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const terms =
      input.termsSnapshot ??
      "Cualquier costo adicional por hallazgo técnico o repuesto no contemplado requiere una nueva versión aprobada por el cliente.";

    let newVersionNum = 1;
    if (!quote) {
      quote = await tx.quote.create({
        data: {
          quoteNumber: `COT-ST-${so.ticketNumber}`,
          type: "SERVICE_ORDER",
          userId: so.userId,
          customerName: so.customerName,
          customerEmail: so.customerEmail,
          customerPhone: so.customerPhone,
          status: "SENT_PENDING_APPROVAL",
          currentVersion: 1,
          validUntil,
          serviceOrderId: so.id,
          versions: {
            create: {
              version: 1,
              itemsSnapshotJson: itemsSnapshot as Prisma.InputJsonValue,
              subtotalCents: partsTotalCents,
              assemblyOrLaborCents: laborCents,
              totalCents,
              termsSnapshot: terms,
              changeReason: input.changeReason ?? "Cotización inicial tras diagnóstico",
              status: "PENDING",
              createdById: input.actorId,
            },
          },
        },
        include: { versions: { orderBy: { version: "desc" } } },
      });
    } else {
      newVersionNum = quote.currentVersion + 1;
      await tx.quoteVersion.updateMany({
        where: { quoteId: quote.id, status: "PENDING" },
        data: { status: "SUPERSEDED" },
      });
      await tx.quoteVersion.create({
        data: {
          quoteId: quote.id,
          version: newVersionNum,
          itemsSnapshotJson: itemsSnapshot as Prisma.InputJsonValue,
          subtotalCents: partsTotalCents,
          assemblyOrLaborCents: laborCents,
          totalCents,
          termsSnapshot: terms,
          changeReason: input.changeReason ?? "Actualización de alcance o repuestos",
          status: "PENDING",
          createdById: input.actorId,
        },
      });
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          currentVersion: newVersionNum,
          status: "SENT_PENDING_APPROVAL",
          validUntil,
        },
      });
    }

    const prevStatus = so.status;
    await tx.serviceOrder.update({
      where: { id: so.id },
      data: {
        laborCents,
        partsTotalCents,
        activeQuoteVersion: newVersionNum,
        status: "QUOTE_PENDING_APPROVAL",
      },
    });

    await tx.serviceOrderTimeline.create({
      data: {
        serviceOrderId: so.id,
        fromStatus: prevStatus,
        toStatus: "QUOTE_PENDING_APPROVAL",
        publicMessage: `Se emitió la cotización v${newVersionNum} para revisión y aprobación del cliente.`,
        internalNote: input.changeReason ?? null,
        actorId: input.actorId,
      },
    });

    await recordAuditLog(
      {
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: "SERVICE_QUOTE_VERSION_ISSUED",
        entityType: "SERVICE_ORDER",
        entityId: so.id,
        afterJson: { version: newVersionNum, totalCents, laborCents, partsTotalCents },
      },
      tx
    );

    return { quoteId: quote.id, version: newVersionNum, totalCents };
  });
}

/**
 * Customer (or authorized proxy) accepts or rejects the current ServiceOrder quote version.
 */
export async function decideServiceQuoteTransactional(input: {
  serviceOrderId: string;
  decision: "ACCEPTED" | "REJECTED";
  decidedByUserId: string;
  actorRole: Role;
  notes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const so = await tx.serviceOrder.findUnique({
      where: { id: input.serviceOrderId },
      include: {
        quotes: {
          include: { versions: { orderBy: { version: "desc" } } },
        },
      },
    });
    if (!so) {
      throw new DomainRuleError("Orden técnica no encontrada.", "SERVICE_ORDER_NOT_FOUND", 404);
    }

    const quote = so.quotes[0];
    const latestVersion = quote?.versions[0];
    if (!quote || !latestVersion) {
      throw new DomainRuleError("No existe una cotización pendiente para esta orden.", "QUOTE_NOT_FOUND", 404);
    }
    if (latestVersion.status === input.decision) {
      return { serviceOrder: so, version: latestVersion, deduplicated: true };
    }
    if (latestVersion.status !== "PENDING") {
      throw new DomainRuleError("La versión actual de cotización ya fue decidida.", "QUOTE_ALREADY_DECIDED", 409);
    }

    const now = new Date();
    await tx.quoteVersion.update({
      where: { id: latestVersion.id },
      data: {
        status: input.decision,
        decidedByUserId: input.decidedByUserId,
        decidedAt: now,
        decisionNotes: input.notes ?? null,
      },
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: { status: input.decision },
    });

    const nextStatus: ServiceOrderStatus =
      input.decision === "ACCEPTED" ? "WORK_AUTHORIZED" : "QUOTE_REJECTED";

    const updatedSo = await tx.serviceOrder.update({
      where: { id: so.id },
      data: {
        status: nextStatus,
        totalApprovedCents:
          input.decision === "ACCEPTED" ? latestVersion.totalCents : so.totalApprovedCents,
      },
    });

    await tx.serviceOrderTimeline.create({
      data: {
        serviceOrderId: so.id,
        fromStatus: so.status,
        toStatus: nextStatus,
        publicMessage:
          input.decision === "ACCEPTED"
            ? `Cotización v${latestVersion.version} aprobada por el cliente. Trabajo técnico autorizado.`
            : `Cotización v${latestVersion.version} rechazada por el cliente.`,
        actorId: input.decidedByUserId,
      },
    });

    await recordAuditLog(
      {
        actorId: input.decidedByUserId,
        actorRole: input.actorRole,
        action: `SERVICE_QUOTE_${input.decision}`,
        entityType: "SERVICE_ORDER",
        entityId: so.id,
        afterJson: { version: latestVersion.version, totalCents: latestVersion.totalCents },
      },
      tx
    );

    return { serviceOrder: updatedSo, version: latestVersion, deduplicated: false };
  });
}

/**
 * Uses a spare part from inventory in a ServiceOrder, creating a linked SERVICE_PART_USED movement.
 * Automatically recalculates partsTotalCents; if the new total exceeds totalApprovedCents,
 * creates a new QuoteVersion and forces QUOTE_PENDING_APPROVAL before more work proceeds.
 */
export async function addServiceOrderPartTransactional(input: {
  serviceOrderId: string;
  productId: string;
  quantity: number;
  actorId: string;
  actorRole: Role;
  idempotencyKey: string;
  reason?: string | null;
}) {
  const qty = Math.trunc(input.quantity);
  if (qty <= 0 || qty > 20) {
    throw new DomainRuleError("Cantidad de repuesto inválida.", "INVALID_QTY", 400);
  }

  return prisma.$transaction(async (tx) => {
    const existingMov = await tx.inventoryMovement.findUnique({
      where: { idempotencyKey: `svc-part-${input.idempotencyKey}` },
    });
    if (existingMov) {
      return { deduplicated: true, requiresNewApproval: false };
    }

    const so = await tx.serviceOrder.findUnique({
      where: { id: input.serviceOrderId },
      include: { parts: true },
    });
    if (!so) {
      throw new DomainRuleError("Orden técnica no encontrada.", "SERVICE_ORDER_NOT_FOUND", 404);
    }
    if (so.status === "DELIVERED" || so.status === "CANCELLED") {
      throw new DomainRuleError("Orden cerrada o cancelada.", "SERVICE_CLOSED", 409);
    }

    const prodRows = await tx.$queryRaw<
      Array<{
        id: string;
        sku: string;
        name: string;
        priceCents: number;
        promoPriceCents: number | null;
        costCents: number;
        stockOnHand: number;
        stockReserved: number;
      }>
    >`
      UPDATE "Product"
      SET "stockOnHand" = "stockOnHand" - ${qty}
      WHERE id = ${input.productId} AND ("stockOnHand" - "stockReserved") >= ${qty}
      RETURNING id, sku, name, "priceCents", "promoPriceCents", "costCents", "stockOnHand", "stockReserved"
    `;
    const prod = prodRows[0];
    if (!prod) {
      throw new DomainRuleError(
        "Stock disponible insuficiente para asignar este repuesto al servicio técnico.",
        "INSUFFICIENT_PART_STOCK",
        409
      );
    }

    const unitPrice = prod.promoPriceCents ?? prod.priceCents;
    const mov = await tx.inventoryMovement.create({
      data: {
        productId: prod.id,
        type: "SERVICE_PART_USED",
        quantityDelta: -qty,
        stockOnHandAfter: prod.stockOnHand,
        stockReservedAfter: prod.stockReserved,
        unitCostCentsSnapshot: prod.costCents,
        referenceType: "SERVICE_ORDER",
        referenceId: so.id,
        idempotencyKey: `svc-part-${input.idempotencyKey}`,
        reason: input.reason ?? `Repuesto asignado a orden técnica ${so.ticketNumber}`,
        actorId: input.actorId,
      },
    });

    await tx.serviceOrderPart.create({
      data: {
        serviceOrderId: so.id,
        productId: prod.id,
        productNameSnapshot: prod.name,
        skuSnapshot: prod.sku,
        quantity: qty,
        unitPriceCentsSnapshot: unitPrice,
        unitCostCentsSnapshot: prod.costCents,
        inventoryMovementId: mov.id,
      },
    });

    const newPartsTotal = sumCents(so.partsTotalCents, lineTotalCents(unitPrice, qty));
    const newGrandTotal = sumCents(so.laborCents, newPartsTotal);
    const exceedsApproved = newGrandTotal > so.totalApprovedCents;

    await tx.serviceOrder.update({
      where: { id: so.id },
      data: { partsTotalCents: newPartsTotal },
    });

    await recordAuditLog(
      {
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: "SERVICE_PART_ADDED",
        entityType: "SERVICE_ORDER",
        entityId: so.id,
        afterJson: { sku: prod.sku, quantity: qty, newPartsTotal, exceedsApproved },
      },
      tx
    );

    return { deduplicated: false, requiresNewApproval: exceedsApproved, newGrandTotal };
  });
}

/**
 * Transitions a ServiceOrder across the 10-stage workflow while enforcing the quote-approval gate.
 */
export async function transitionServiceOrderTransactional(input: {
  serviceOrderId: string;
  toStatus: ServiceOrderStatus;
  publicMessage: string;
  internalNote?: string | null;
  diagnosisReport?: string | null;
  closingSummary?: string | null;
  performedTests?: string[] | null;
  maintenanceRecommendations?: string | null;
  deviceSerial?: string | null;
  accessoriesReceived?: string | null;
  initialPhysicalState?: string | null;
  assignedTechId?: string | null;
  actorId: string;
  actorRole: Role;
}) {
  return prisma.$transaction(async (tx) => {
    const so = await tx.serviceOrder.findUnique({
      where: { id: input.serviceOrderId },
      include: {
        quotes: { include: { versions: { orderBy: { version: "desc" } } } },
      },
    });
    if (!so) {
      throw new DomainRuleError("Orden técnica no encontrada.", "SERVICE_ORDER_NOT_FOUND", 404);
    }
    if (!canTransitionServiceStatus(so.status, input.toStatus)) {
      throw new DomainRuleError(
        `Transición no permitida de "${SERVICE_STATUS_LABELS[so.status]}" a "${SERVICE_STATUS_LABELS[input.toStatus]}".`,
        "INVALID_SERVICE_TRANSITION",
        409
      );
    }

    // Hard gate: no work with cost (> 0) can execute or close without an accepted quote matching current total
    const currentTotal = sumCents(so.laborCents, so.partsTotalCents);
    if (STATUSES_REQUIRING_APPROVED_QUOTE.includes(input.toStatus) && currentTotal > 0) {
      const latestQuote = so.quotes[0];
      const latestVersion = latestQuote?.versions[0];
      if (!latestVersion || latestVersion.status !== "ACCEPTED" || so.totalApprovedCents < currentTotal) {
        throw new DomainRuleError(
          "No se puede ejecutar o entregar un trabajo con costo sin que el cliente haya aprobado la última versión de la cotización.",
          "QUOTE_APPROVAL_REQUIRED",
          409
        );
      }
    }

    if (input.toStatus === "DELIVERED") {
      if (!input.closingSummary && !so.closingSummary) {
        throw new DomainRuleError(
          "Para cerrar y entregar la orden debes registrar el resumen del trabajo realizado.",
          "CLOSING_SUMMARY_REQUIRED",
          400
        );
      }
      const tests = input.performedTests ?? (so.performedTestsJson as string[] | null);
      if (!tests || tests.length === 0) {
        throw new DomainRuleError(
          "Para cerrar la orden debes registrar al menos una comprobación/prueba realmente ejecutada.",
          "CLOSURE_TESTS_REQUIRED",
          400
        );
      }
    }

    const updated = await tx.serviceOrder.update({
      where: { id: so.id },
      data: {
        status: input.toStatus,
        diagnosisReport: input.diagnosisReport ?? so.diagnosisReport,
        internalNotes: input.internalNote
          ? `${so.internalNotes ? so.internalNotes + "\n" : ""}[${new Date().toISOString()}] ${input.internalNote}`
          : so.internalNotes,
        closingSummary: input.closingSummary ?? so.closingSummary,
        performedTestsJson:
          input.performedTests !== undefined && input.performedTests !== null
            ? (input.performedTests as Prisma.InputJsonValue)
            : undefined,
        maintenanceRecommendations:
          input.maintenanceRecommendations ?? so.maintenanceRecommendations,
        deviceSerial: input.deviceSerial ?? so.deviceSerial,
        accessoriesReceived: input.accessoriesReceived ?? so.accessoriesReceived,
        initialPhysicalState: input.initialPhysicalState ?? so.initialPhysicalState,
        assignedTechId: input.assignedTechId ?? so.assignedTechId,
      },
    });

    await tx.serviceOrderTimeline.create({
      data: {
        serviceOrderId: so.id,
        fromStatus: so.status,
        toStatus: input.toStatus,
        publicMessage: input.publicMessage,
        internalNote: input.internalNote ?? null,
        actorId: input.actorId,
      },
    });

    await recordAuditLog(
      {
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: "SERVICE_STATUS_CHANGED",
        entityType: "SERVICE_ORDER",
        entityId: so.id,
        beforeJson: { status: so.status },
        afterJson: { status: input.toStatus, publicMessage: input.publicMessage },
      },
      tx
    );

    return updated;
  });
}

export function generateTicketNumber(): string {
  return `ST-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
