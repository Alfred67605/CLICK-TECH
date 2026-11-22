import crypto from "node:crypto";
import { Prisma, type DeliveryMethod, type PaymentMethod, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/domain/audit";
import { lineTotalCents, sumCents } from "@/lib/domain/money";

export class DomainRuleError extends Error {
  status: number;
  code: string;
  constructor(message: string, code = "DOMAIN_ERROR", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getAvailableStock(product: {
  stockOnHand: number;
  stockReserved: number;
}): number {
  return Math.max(0, product.stockOnHand - product.stockReserved);
}

function getReservationTtlMinutes(): number {
  const raw = Number(process.env.RESERVATION_TTL_MINUTES ?? "30");
  return Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : 30;
}

/**
 * Idempotently expires overdue ACTIVE stock reservations and releases units back to available stock.
 */
export async function releaseExpiredReservations(actorId?: string | null): Promise<number> {
  const now = new Date();
  const expired = await prisma.stockReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    select: { id: true, orderId: true, productId: true, quantity: true },
    take: 100,
  });

  if (expired.length === 0) return 0;

  let releasedCount = 0;
  for (const res of expired) {
    const didRelease = await prisma.$transaction(async (tx) => {
      const updated = await tx.stockReservation.updateMany({
        where: { id: res.id, status: "ACTIVE" },
        data: {
          status: "EXPIRED",
          releasedAt: now,
          releaseReason: "Expiración automática de reserva sin pago confirmado",
        },
      });
      if (updated.count === 0) return false;

      const updatedProduct = await tx.$queryRaw<
        Array<{ stockOnHand: number; stockReserved: number }>
      >`
        UPDATE "Product"
        SET "stockReserved" = GREATEST(0, "stockReserved" - ${res.quantity})
        WHERE id = ${res.productId}
        RETURNING "stockOnHand", "stockReserved"
      `;
      const pState = updatedProduct[0];
      if (pState) {
        await tx.inventoryMovement.create({
          data: {
            productId: res.productId,
            type: "SALE_RELEASE",
            quantityDelta: res.quantity,
            stockOnHandAfter: pState.stockOnHand,
            stockReservedAfter: pState.stockReserved,
            referenceType: "ORDER",
            referenceId: res.orderId,
            idempotencyKey: `expire-res-${res.id}`,
            reason: "Liberación automática por vencimiento de reserva",
            actorId: actorId ?? null,
          },
        });
      }

      await tx.order.updateMany({
        where: {
          id: res.orderId,
          status: "PENDING_PAYMENT",
          paymentStatus: { in: ["UNPAID", "REJECTED"] },
        },
        data: {
          status: "EXPIRED_RESERVATION",
          deliveryStatus: "CANCELLED",
        },
      });

      return true;
    });
    if (didRelease) releasedCount += 1;
  }

  return releasedCount;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  idempotencyKey: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string | null;
  deliveryAddressSnapshot?: Record<string, unknown> | null;
  paymentMethod: PaymentMethod;
  includeAssembly?: boolean;
  sourceQuoteId?: string | null;
  notes?: string | null;
  items: CreateOrderItemInput[];
}

export async function createOrderTransactional(input: CreateOrderInput) {
  if (!input.items || input.items.length === 0) {
    throw new DomainRuleError("El pedido debe incluir al menos un producto.", "EMPTY_ORDER", 400);
  }
  if (!input.idempotencyKey || input.idempotencyKey.trim().length < 8) {
    throw new DomainRuleError("Falta clave de idempotencia válida.", "INVALID_IDEMPOTENCY", 400);
  }

  // First release any expired reservations so real stock is up to date
  await releaseExpiredReservations(input.userId);

  // Idempotent replay check
  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true, payments: true, reservations: true },
  });
  if (existingOrder) {
    return { order: existingOrder, guestAccessCode: null, deduplicated: true };
  }

  // Aggregate duplicate productIds safely
  const qtyByProduct = new Map<string, number>();
  for (const item of input.items) {
    const q = Math.trunc(item.quantity);
    if (q <= 0 || q > 50) {
      throw new DomainRuleError("Cantidad de producto inválida (debe estar entre 1 y 50).", "INVALID_QTY", 400);
    }
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + q);
  }

  const productIds = Array.from(qtyByProduct.keys()).sort();
  const ttlMinutes = getReservationTtlMinutes();
  const reservationExpiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  const guestCode = !input.userId ? crypto.randomBytes(6).toString("hex").toUpperCase() : null;
  const guestCodeHash = guestCode
    ? crypto.createHash("sha256").update(guestCode).digest("hex")
    : null;

  const createdOrder = await prisma.$transaction(async (tx) => {
    // Check payment method configuration from DB
    const paymentCfg = await tx.businessConfig.findUnique({ where: { key: "payment_settings" } });
    const payVal = (paymentCfg?.valueJson ?? {}) as Record<string, unknown>;
    if (input.paymentMethod === "TRANSFER_QR_MANUAL" && payVal.transferQrEnabled === false) {
      throw new DomainRuleError(
        "El pago por transferencia o QR está deshabilitado hasta completar configuración bancaria.",
        "PAYMENT_METHOD_UNAVAILABLE",
        400
      );
    }
    if (input.paymentMethod === "PAY_ON_PICKUP" && payVal.payOnPickupEnabled === false) {
      throw new DomainRuleError(
        "El pago al recoger no está habilitado actualmente en configuración.",
        "PAYMENT_METHOD_UNAVAILABLE",
        400
      );
    }
    if (input.paymentMethod === "PAY_ON_PICKUP" && input.deliveryMethod !== "PICKUP_POTOSI") {
      throw new DomainRuleError(
        "El pago al recoger solo aplica cuando el método de entrega es recojo coordinado en Potosí.",
        "INVALID_PAYMENT_DELIVERY_COMBO",
        400
      );
    }

    // Re-validate quote if converting from quote
    if (input.sourceQuoteId) {
      const quote = await tx.quote.findUnique({ where: { id: input.sourceQuoteId } });
      if (!quote) {
        throw new DomainRuleError("Cotización origen no encontrada.", "QUOTE_NOT_FOUND", 404);
      }
      if (quote.status === "CONVERTED_TO_ORDER" && quote.convertedOrderId) {
        const linked = await tx.order.findUnique({
          where: { id: quote.convertedOrderId },
          include: { items: true, payments: true, reservations: true },
        });
        if (linked) return linked;
      }
      if (quote.status !== "ACCEPTED") {
        throw new DomainRuleError(
          "Solo se puede convertir a pedido una cotización previamente aceptada.",
          "QUOTE_NOT_ACCEPTED",
          400
        );
      }
      if (quote.validUntil < new Date()) {
        throw new DomainRuleError(
          "La vigencia de esta cotización expiró; genera una nueva revisión antes de confirmar.",
          "QUOTE_EXPIRED",
          400
        );
      }
    }

    // Delivery fee lookup from DB (never trust client shipping fee)
    let deliveryFeeCents = 0;
    let resolvedZoneId: string | null = null;
    if (input.deliveryMethod === "LOCAL_DELIVERY") {
      if (!input.deliveryZoneId) {
        throw new DomainRuleError(
          "Debes seleccionar una zona configurada de Potosí para entrega local.",
          "MISSING_DELIVERY_ZONE",
          400
        );
      }
      const zone = await tx.deliveryZone.findUnique({ where: { id: input.deliveryZoneId } });
      if (!zone || !zone.isAvailable) {
        throw new DomainRuleError(
          "La zona seleccionada no cuenta con entrega configurada actualmente.",
          "ZONE_UNAVAILABLE",
          400
        );
      }
      if (zone.feeCents === null) {
        throw new DomainRuleError(
          "Esta zona requiere solicitar cotización de entrega previa.",
          "ZONE_REQUIRES_QUOTE",
          400
        );
      }
      deliveryFeeCents = zone.feeCents;
      resolvedZoneId = zone.id;
    }

    // Assembly fee lookup from DB if requested
    let assemblyFeeCents = 0;
    if (input.includeAssembly) {
      const srv = await tx.serviceCatalog.findUnique({
        where: { slug: "ensamblaje-personalizado" },
      });
      assemblyFeeCents = srv?.basePriceCents ?? 18000;
    }

    // Atomic conditional reservation per product in deterministic ID order (deadlock-free!)
    let subtotalCents = 0;
    const preparedItems: Array<{
      productId: string;
      skuSnapshot: string;
      productNameSnapshot: string;
      modelSnapshot: string;
      unitPriceCentsSnapshot: number;
      unitCostCentsSnapshot: number;
      warrantyMonthsSnapshot: number | null;
      warrantyTermsSnapshot: string | null;
      quantity: number;
      lineTotalCents: number;
      stockOnHandAfter: number;
      stockReservedAfter: number;
    }> = [];

    for (const productId of productIds) {
      const qty = qtyByProduct.get(productId)!;

      // Conditional atomic UPDATE prevents concurrent overselling on last unit
      const updatedRows = await tx.$queryRaw<
        Array<{
          id: string;
          sku: string;
          name: string;
          model: string;
          priceCents: number;
          promoPriceCents: number | null;
          costCents: number;
          warrantyMonths: number | null;
          warrantyTerms: string | null;
          stockOnHand: number;
          stockReserved: number;
        }>
      >`
        UPDATE "Product"
        SET "stockReserved" = "stockReserved" + ${qty}
        WHERE id = ${productId}
          AND "isPublished" = true
          AND ("stockOnHand" - "stockReserved") >= ${qty}
        RETURNING id, sku, name, model, "priceCents", "promoPriceCents", "costCents", "warrantyMonths", "warrantyTerms", "stockOnHand", "stockReserved"
      `;

      const prod = updatedRows[0];
      if (!prod) {
        const current = await tx.product.findUnique({
          where: { id: productId },
          select: { name: true, sku: true, isPublished: true, stockOnHand: true, stockReserved: true },
        });
        if (!current || !current.isPublished) {
          throw new DomainRuleError(
            `El producto solicitado ya no está disponible para la venta.`,
            "PRODUCT_UNAVAILABLE",
            409
          );
        }
        const avail = Math.max(0, current.stockOnHand - current.stockReserved);
        throw new DomainRuleError(
          `Stock insuficiente para ${current.name} (${current.sku}). Disponible: ${avail}, solicitado: ${qty}.`,
          "INSUFFICIENT_STOCK",
          409
        );
      }

      const unitPrice = prod.promoPriceCents ?? prod.priceCents;
      const lineTotal = lineTotalCents(unitPrice, qty);
      subtotalCents = sumCents(subtotalCents, lineTotal);

      preparedItems.push({
        productId: prod.id,
        skuSnapshot: prod.sku,
        productNameSnapshot: prod.name,
        modelSnapshot: prod.model,
        unitPriceCentsSnapshot: unitPrice,
        unitCostCentsSnapshot: prod.costCents,
        warrantyMonthsSnapshot: prod.warrantyMonths,
        warrantyTermsSnapshot: prod.warrantyTerms,
        quantity: qty,
        lineTotalCents: lineTotal,
        stockOnHandAfter: prod.stockOnHand,
        stockReservedAfter: prod.stockReserved,
      });
    }

    const totalCents = sumCents(subtotalCents, assemblyFeeCents, deliveryFeeCents);
    const orderNumber = `CT-${new Date().getFullYear()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const initialPaymentStatus =
      input.paymentMethod === "PAY_ON_PICKUP" ? "PAY_ON_PICKUP_PENDING" : "UNPAID";

    const order = await tx.order.create({
      data: {
        orderNumber,
        idempotencyKey: input.idempotencyKey,
        userId: input.userId ?? null,
        guestName: input.guestName ?? null,
        guestEmail: input.guestEmail ?? null,
        guestPhone: input.guestPhone ?? null,
        guestVerificationCodeHash: guestCodeHash,
        status: "PENDING_PAYMENT",
        paymentStatus: initialPaymentStatus,
        deliveryMethod: input.deliveryMethod,
        deliveryStatus: "PENDING",
        deliveryZoneId: resolvedZoneId,
        deliveryAddressSnapshot: input.deliveryAddressSnapshot
          ? (input.deliveryAddressSnapshot as Prisma.InputJsonValue)
          : undefined,
        subtotalCents,
        discountCents: 0,
        assemblyFeeCents,
        deliveryFeeCents,
        totalCents,
        paymentMethod: input.paymentMethod,
        sourceQuoteId: input.sourceQuoteId ?? null,
        notes: input.notes ?? null,
        reservationExpiresAt,
        items: {
          create: preparedItems.map((it) => ({
            productId: it.productId,
            skuSnapshot: it.skuSnapshot,
            productNameSnapshot: it.productNameSnapshot,
            modelSnapshot: it.modelSnapshot,
            unitPriceCentsSnapshot: it.unitPriceCentsSnapshot,
            unitCostCentsSnapshot: it.unitCostCentsSnapshot,
            warrantyMonthsSnapshot: it.warrantyMonthsSnapshot,
            warrantyTermsSnapshot: it.warrantyTermsSnapshot,
            quantity: it.quantity,
            lineTotalCents: it.lineTotalCents,
          })),
        },
        reservations: {
          create: preparedItems.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            status: "ACTIVE",
            expiresAt: reservationExpiresAt,
          })),
        },
      },
      include: { items: true, payments: true, reservations: true },
    });

    // Log inventory reservation ledger movements
    for (const it of preparedItems) {
      await tx.inventoryMovement.create({
        data: {
          productId: it.productId,
          type: "SALE_RESERVATION",
          quantityDelta: -it.quantity,
          stockOnHandAfter: it.stockOnHandAfter,
          stockReservedAfter: it.stockReservedAfter,
          unitCostCentsSnapshot: it.unitCostCentsSnapshot,
          referenceType: "ORDER",
          referenceId: order.id,
          idempotencyKey: `reserve-${order.id}-${it.productId}`,
          reason: `Reserva al confirmar pedido ${order.orderNumber}`,
          actorId: input.userId ?? null,
        },
      });
    }

    if (input.sourceQuoteId) {
      await tx.quote.update({
        where: { id: input.sourceQuoteId },
        data: { status: "CONVERTED_TO_ORDER", convertedOrderId: order.id },
      });
    }

    await recordAuditLog(
      {
        actorId: input.userId ?? null,
        actorRole: input.userId ? "CUSTOMER" : null,
        action: "ORDER_CREATED",
        entityType: "ORDER",
        entityId: order.id,
        afterJson: {
          orderNumber: order.orderNumber,
          totalCents: order.totalCents,
          itemCount: preparedItems.length,
        },
      },
      tx
    );

    return order;
  });

  return { order: createdOrder, guestAccessCode: guestCode, deduplicated: false };
}

/**
 * Idempotently cancels an order and releases any ACTIVE stock reservations back to available stock.
 */
export async function cancelOrderTransactional(input: {
  orderId: string;
  actorId?: string | null;
  actorRole?: Role | null;
  reason: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { reservations: true },
    });
    if (!order) {
      throw new DomainRuleError("Pedido no encontrado.", "ORDER_NOT_FOUND", 404);
    }
    if (order.status === "CANCELLED") {
      return { order, releasedUnits: 0, deduplicated: true };
    }
    if (order.status === "DELIVERED" || order.status === "PAID_CONFIRMED") {
      throw new DomainRuleError(
        "Un pedido ya cobrado o entregado requiere flujo de devolución física en lugar de cancelación directa.",
        "ORDER_CANNOT_CANCEL",
        409
      );
    }

    let releasedUnits = 0;
    const now = new Date();
    for (const res of order.reservations) {
      if (res.status !== "ACTIVE") continue;
      const updated = await tx.stockReservation.updateMany({
        where: { id: res.id, status: "ACTIVE" },
        data: { status: "RELEASED", releasedAt: now, releaseReason: input.reason },
      });
      if (updated.count === 0) continue;

      const updatedProd = await tx.$queryRaw<
        Array<{ stockOnHand: number; stockReserved: number }>
      >`
        UPDATE "Product"
        SET "stockReserved" = GREATEST(0, "stockReserved" - ${res.quantity})
        WHERE id = ${res.productId}
        RETURNING "stockOnHand", "stockReserved"
      `;
      const pState = updatedProd[0];
      if (pState) {
        await tx.inventoryMovement.create({
          data: {
            productId: res.productId,
            type: "SALE_RELEASE",
            quantityDelta: res.quantity,
            stockOnHandAfter: pState.stockOnHand,
            stockReservedAfter: pState.stockReserved,
            referenceType: "ORDER",
            referenceId: order.id,
            idempotencyKey: `cancel-res-${res.id}`,
            reason: `Cancelación de pedido ${order.orderNumber}: ${input.reason}`,
            actorId: input.actorId ?? null,
          },
        });
      }
      releasedUnits += res.quantity;
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", deliveryStatus: "CANCELLED" },
      include: { items: true, reservations: true, payments: true },
    });

    await recordAuditLog(
      {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: "ORDER_CANCELLED",
        entityType: "ORDER",
        entityId: order.id,
        beforeJson: { status: order.status },
        afterJson: { status: "CANCELLED", releasedUnits, reason: input.reason },
      },
      tx
    );

    return { order: updatedOrder, releasedUnits, deduplicated: false };
  });
}

export async function submitPaymentProofTransactional(input: {
  orderId: string;
  idempotencyKey: string;
  method: PaymentMethod;
  proofFilePath?: string | null;
  proofMimeType?: string | null;
  proofSizeBytes?: number | null;
  referenceNumber?: string | null;
  submittedByUserId?: string | null;
}) {
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return { payment: existing, deduplicated: true };
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { reservations: true },
    });
    if (!order) {
      throw new DomainRuleError("Pedido no encontrado.", "ORDER_NOT_FOUND", 404);
    }
    if (order.status === "CANCELLED") {
      throw new DomainRuleError(
        "El pedido está cancelado y no acepta nuevos comprobantes.",
        "ORDER_CANCELLED",
        409
      );
    }
    if (order.paymentStatus === "APPROVED") {
      throw new DomainRuleError("Este pedido ya tiene un pago aprobado.", "ALREADY_PAID", 409);
    }

    const now = new Date();
    const isLate =
      order.status === "EXPIRED_RESERVATION" ||
      (order.reservationExpiresAt !== null && order.reservationExpiresAt < now) ||
      order.reservations.some((r) => r.status === "EXPIRED" || r.status === "RELEASED");

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        idempotencyKey: input.idempotencyKey,
        method: input.method,
        amountCents: order.totalCents,
        status: "PROOF_SUBMITTED",
        proofFilePath: input.proofFilePath ?? null,
        proofMimeType: input.proofMimeType ?? null,
        proofSizeBytes: input.proofSizeBytes ?? null,
        referenceNumber: input.referenceNumber ?? null,
        submittedByUserId: input.submittedByUserId ?? null,
        isLateSubmission: isLate,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAYMENT_UNDER_REVIEW",
        paymentStatus: "PROOF_SUBMITTED",
      },
    });

    await recordAuditLog(
      {
        actorId: input.submittedByUserId ?? null,
        actorRole: input.submittedByUserId ? "CUSTOMER" : null,
        action: "PAYMENT_PROOF_SUBMITTED",
        entityType: "PAYMENT",
        entityId: payment.id,
        afterJson: {
          orderId: order.id,
          amountCents: payment.amountCents,
          isLateSubmission: isLate,
        },
      },
      tx
    );

    return { payment, deduplicated: false };
  });
}

/**
 * Authorized staff reviews a payment proof (APPROVED / REJECTED / REFUNDED).
 * Repeating APPROVED on an already-approved payment is idempotent and never duplicates stock exits.
 * Late payments re-verify and atomically re-reserve available stock before confirming.
 */
export async function reviewPaymentTransactional(input: {
  paymentId: string;
  decision: "APPROVED" | "REJECTED" | "REFUNDED";
  reviewerId: string;
  reviewerRole: Role;
  reviewNotes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        order: {
          include: { items: true, reservations: true },
        },
      },
    });
    if (!payment) {
      throw new DomainRuleError("Registro de pago no encontrado.", "PAYMENT_NOT_FOUND", 404);
    }

    // Idempotent check
    if (payment.status === input.decision) {
      return { payment, deduplicated: true };
    }

    if (payment.status === "APPROVED" && input.decision === "REJECTED") {
      throw new DomainRuleError(
        "Un pago ya aprobado no puede rechazarse directamente; utiliza devolución/reembolso.",
        "INVALID_PAYMENT_TRANSITION",
        409
      );
    }

    const now = new Date();
    const order = payment.order;

    if (input.decision === "APPROVED") {
      // Lock payment status transition atomically so concurrent double-clicks cannot proceed twice
      const locked = await tx.payment.updateMany({
        where: { id: payment.id, status: { in: ["PROOF_SUBMITTED", "PAY_ON_PICKUP_PENDING"] } },
        data: {
          status: "APPROVED",
          reviewedByUserId: input.reviewerId,
          reviewedAt: now,
          reviewNotes: input.reviewNotes ?? null,
        },
      });
      if (locked.count === 0) {
        const latest = await tx.payment.findUnique({ where: { id: payment.id } });
        return { payment: latest!, deduplicated: true };
      }

      // Check whether active reservations still exist for each OrderItem
      for (const item of order.items) {
        const activeRes = order.reservations.find(
          (r) => r.productId === item.productId && r.status === "ACTIVE"
        );

        if (activeRes) {
          // Consume active reservation: decrement both stockOnHand and stockReserved
          const updatedRes = await tx.stockReservation.updateMany({
            where: { id: activeRes.id, status: "ACTIVE" },
            data: { status: "COMMITTED" },
          });
          if (updatedRes.count === 1) {
            const pRows = await tx.$queryRaw<
              Array<{ stockOnHand: number; stockReserved: number }>
            >`
              UPDATE "Product"
              SET "stockOnHand" = "stockOnHand" - ${item.quantity},
                  "stockReserved" = GREATEST(0, "stockReserved" - ${item.quantity})
              WHERE id = ${item.productId} AND "stockOnHand" >= ${item.quantity}
              RETURNING "stockOnHand", "stockReserved"
            `;
            const pState = pRows[0];
            if (!pState) {
              throw new DomainRuleError(
                `Inconsistencia de inventario al despachar ${item.productNameSnapshot}.`,
                "STOCK_COMMIT_FAILED",
                409
              );
            }
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                type: "SALE_DISPATCH",
                quantityDelta: -item.quantity,
                stockOnHandAfter: pState.stockOnHand,
                stockReservedAfter: pState.stockReserved,
                unitCostCentsSnapshot: item.unitCostCentsSnapshot,
                referenceType: "ORDER",
                referenceId: order.id,
                idempotencyKey: `dispatch-${order.id}-${item.id}`,
                reason: `Pago aprobado y stock comprometido para pedido ${order.orderNumber}`,
                actorId: input.reviewerId,
              },
            });
          }
        } else {
          // Late payment after reservation expired/released -> MUST re-verify available stock!
          const pRows = await tx.$queryRaw<
            Array<{ stockOnHand: number; stockReserved: number }>
          >`
            UPDATE "Product"
            SET "stockOnHand" = "stockOnHand" - ${item.quantity}
            WHERE id = ${item.productId} AND ("stockOnHand" - "stockReserved") >= ${item.quantity}
            RETURNING "stockOnHand", "stockReserved"
          `;
          const pState = pRows[0];
          if (!pState) {
            throw new DomainRuleError(
              `Pago tardío detectado: ya no queda stock suficiente de ${item.productNameSnapshot} (${item.skuSnapshot}). Rechaza el comprobante o coordina reposición/reembolso.`,
              "LATE_PAYMENT_INSUFFICIENT_STOCK",
              409
            );
          }
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: "SALE_DISPATCH",
              quantityDelta: -item.quantity,
              stockOnHandAfter: pState.stockOnHand,
              stockReservedAfter: pState.stockReserved,
              unitCostCentsSnapshot: item.unitCostCentsSnapshot,
              referenceType: "ORDER",
              referenceId: order.id,
              idempotencyKey: `late-dispatch-${order.id}-${item.id}`,
              reason: `Aprobación de pago tardío tras revalidación de stock (${order.orderNumber})`,
              actorId: input.reviewerId,
            },
          });
        }

        // Create explicit Warranty record ONLY when product has configured warrantyMonths > 0
        if (order.userId && item.warrantyMonthsSnapshot && item.warrantyMonthsSnapshot > 0) {
          const expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + item.warrantyMonthsSnapshot);
          await tx.warranty.create({
            data: {
              code: `GAR-${order.orderNumber}-${item.skuSnapshot}`,
              userId: order.userId,
              orderItemId: item.id,
              itemLabel: `${item.productNameSnapshot} (${item.quantity}x)`,
              durationMonths: item.warrantyMonthsSnapshot,
              startsAt: now,
              expiresAt,
              terms:
                item.warrantyTermsSnapshot ??
                "Garantía registrada conforme a condiciones comerciales vigentes al momento de la compra.",
              deliveryEvidenceNotes: `Pago aprobado el ${now.toISOString()}`,
            },
          });
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID_CONFIRMED",
          paymentStatus: "APPROVED",
          deliveryStatus: "COORDINATING",
        },
      });
    } else if (input.decision === "REJECTED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REJECTED",
          reviewedByUserId: input.reviewerId,
          reviewedAt: now,
          reviewNotes: input.reviewNotes ?? null,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          status:
            order.reservationExpiresAt && order.reservationExpiresAt < now
              ? "EXPIRED_RESERVATION"
              : "PENDING_PAYMENT",
          paymentStatus: "REJECTED",
        },
      });
    } else if (input.decision === "REFUNDED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          reviewedByUserId: input.reviewerId,
          reviewedAt: now,
          reviewNotes: input.reviewNotes ?? null,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "REFUNDED" },
      });
    }

    await recordAuditLog(
      {
        actorId: input.reviewerId,
        actorRole: input.reviewerRole,
        action: `PAYMENT_${input.decision}`,
        entityType: "PAYMENT",
        entityId: payment.id,
        beforeJson: { status: payment.status },
        afterJson: { status: input.decision, reviewNotes: input.reviewNotes ?? null },
      },
      tx
    );

    const updatedPayment = await tx.payment.findUnique({ where: { id: payment.id } });
    return { payment: updatedPayment!, deduplicated: false };
  });
}

/**
 * Receives items on a PurchaseOrder idempotently.
 * Stock ONLY increases upon PurchaseReceipt, never when PurchaseOrder is drafted or ordered.
 */
export async function receivePurchaseOrderTransactional(input: {
  purchaseOrderId: string;
  idempotencyKey: string;
  receivedById: string;
  actorRole: Role;
  notes?: string | null;
  items: Array<{ purchaseOrderItemId: string; qtyReceived: number }>;
}) {
  const existingReceipt = await prisma.purchaseReceipt.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existingReceipt) {
    return { receipt: existingReceipt, deduplicated: true };
  }

  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: input.purchaseOrderId },
      include: { items: true },
    });
    if (!po) {
      throw new DomainRuleError("Orden de compra no encontrada.", "PO_NOT_FOUND", 404);
    }
    if (po.status === "CANCELLED") {
      throw new DomainRuleError("Una orden de compra cancelada no puede recibirse.", "PO_CANCELLED", 409);
    }

    const appliedItems: Array<{ productId: string; sku: string; qty: number }> = [];

    for (const reqItem of input.items) {
      const qty = Math.trunc(reqItem.qtyReceived);
      if (qty <= 0) continue;
      const poItem = po.items.find((i) => i.id === reqItem.purchaseOrderItemId);
      if (!poItem) {
        throw new DomainRuleError("Ítem de orden de compra inválido.", "PO_ITEM_NOT_FOUND", 404);
      }
      const remaining = poItem.orderedQty - poItem.receivedQty;
      if (qty > remaining) {
        throw new DomainRuleError(
          `Cantidad recibida (${qty}) excede lo pendiente (${remaining}) para ${poItem.skuSnapshot}.`,
          "PO_OVER_RECEIVE",
          400
        );
      }

      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQty: { increment: qty } },
      });

      const updatedProd = await tx.product.update({
        where: { id: poItem.productId },
        data: { stockOnHand: { increment: qty } },
        select: { stockOnHand: true, stockReserved: true },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: poItem.productId,
          type: "PURCHASE_RECEIPT",
          quantityDelta: qty,
          stockOnHandAfter: updatedProd.stockOnHand,
          stockReservedAfter: updatedProd.stockReserved,
          unitCostCentsSnapshot: poItem.unitCostCents,
          referenceType: "PURCHASE",
          referenceId: po.id,
          idempotencyKey: `po-rcpt-${input.idempotencyKey}-${poItem.id}`,
          reason: `Recepción de compra ${po.code} (${poItem.skuSnapshot})`,
          actorId: input.receivedById,
        },
      });

      appliedItems.push({ productId: poItem.productId, sku: poItem.skuSnapshot, qty });
    }

    if (appliedItems.length === 0) {
      throw new DomainRuleError("Debes ingresar al menos una unidad recibida.", "NO_ITEMS_RECEIVED", 400);
    }

    const receipt = await tx.purchaseReceipt.create({
      data: {
        purchaseOrderId: po.id,
        idempotencyKey: input.idempotencyKey,
        receivedById: input.receivedById,
        notes: input.notes ?? null,
        itemsJson: appliedItems as Prisma.InputJsonValue,
      },
    });

    const refreshedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: po.id },
    });
    const allReceived = refreshedItems.every((i) => i.receivedQty >= i.orderedQty);

    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED" },
    });

    await recordAuditLog(
      {
        actorId: input.receivedById,
        actorRole: input.actorRole,
        action: "PURCHASE_RECEIVED",
        entityType: "PURCHASE_ORDER",
        entityId: po.id,
        afterJson: { receiptId: receipt.id, appliedItems },
      },
      tx
    );

    return { receipt, deduplicated: false };
  });
}

/**
 * Validates a customer return physically before increasing stockOnHand.
 */
export async function validateProductReturnTransactional(input: {
  returnId: string;
  decision: "RECEIVED_VALIDATED_RESTOCK" | "RECEIVED_DEFECTIVE_NO_RESTOCK" | "REJECTED";
  validatorId: string;
  actorRole: Role;
  validationNotes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const ret = await tx.productReturn.findUnique({ where: { id: input.returnId } });
    if (!ret) {
      throw new DomainRuleError("Registro de devolución no encontrado.", "RETURN_NOT_FOUND", 404);
    }
    if (ret.physicalValidationStatus !== "PENDING_RECEIPT") {
      return { productReturn: ret, deduplicated: true };
    }

    const updated = await tx.productReturn.updateMany({
      where: { id: ret.id, physicalValidationStatus: "PENDING_RECEIPT" },
      data: {
        physicalValidationStatus: input.decision,
        validatedById: input.validatorId,
        validatedAt: new Date(),
        validationNotes: input.validationNotes ?? null,
      },
    });
    if (updated.count === 0) {
      const latest = await tx.productReturn.findUnique({ where: { id: ret.id } });
      return { productReturn: latest!, deduplicated: true };
    }

    if (input.decision === "RECEIVED_VALIDATED_RESTOCK") {
      const prod = await tx.product.update({
        where: { id: ret.productId },
        data: { stockOnHand: { increment: ret.quantity } },
        select: { stockOnHand: true, stockReserved: true },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: ret.productId,
          type: "CUSTOMER_RETURN_VALIDATED",
          quantityDelta: ret.quantity,
          stockOnHandAfter: prod.stockOnHand,
          stockReservedAfter: prod.stockReserved,
          referenceType: "RETURN",
          referenceId: ret.id,
          idempotencyKey: `return-restock-${ret.id}`,
          reason: `Devolución validada físicamente (${ret.reason})`,
          actorId: input.validatorId,
        },
      });
    }

    await recordAuditLog(
      {
        actorId: input.validatorId,
        actorRole: input.actorRole,
        action: `RETURN_${input.decision}`,
        entityType: "PRODUCT_RETURN",
        entityId: ret.id,
        afterJson: { decision: input.decision, validationNotes: input.validationNotes ?? null },
      },
      tx
    );

    const latest = await tx.productReturn.findUnique({ where: { id: ret.id } });
    return { productReturn: latest!, deduplicated: false };
  });
}
