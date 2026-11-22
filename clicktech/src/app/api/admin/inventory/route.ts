import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";
import {
  DomainRuleError,
  releaseExpiredReservations,
  validateProductReturnTransactional,
} from "@/lib/domain/inventory-orders";

const adjustSchema = z.object({
  action: z.literal("adjust"),
  productId: z.string().min(1),
  quantityDelta: z.number().int().refine((n) => n !== 0, "El ajuste no puede ser 0"),
  reason: z.string().min(5, "Especifica el motivo del ajuste"),
});

const expireSchema = z.object({
  action: z.literal("release_expired"),
});

const returnSchema = z.object({
  action: z.literal("validate_return"),
  returnId: z.string().min(1),
  decision: z.enum(["RECEIVED_VALIDATED_RESTOCK", "RECEIVED_DEFECTIVE_NO_RESTOCK", "REJECTED"]),
  validationNotes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "SALES"]);
    const body = await req.json();

    if (body.action === "release_expired") {
      expireSchema.parse(body);
      const releasedCount = await releaseExpiredReservations(user.id);
      return NextResponse.json({ releasedCount });
    }

    if (body.action === "validate_return") {
      const parsed = returnSchema.parse(body);
      const res = await validateProductReturnTransactional({
        returnId: parsed.returnId,
        decision: parsed.decision,
        validatorId: user.id,
        actorRole: user.role,
        validationNotes: parsed.validationNotes ?? null,
      });
      return NextResponse.json(res);
    }

    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{ stockOnHand: number; stockReserved: number; sku: string }>
      >`
        UPDATE "Product"
        SET "stockOnHand" = "stockOnHand" + ${d.quantityDelta}
        WHERE id = ${d.productId}
          AND ("stockOnHand" + ${d.quantityDelta}) >= "stockReserved"
          AND ("stockOnHand" + ${d.quantityDelta}) >= 0
        RETURNING "stockOnHand", "stockReserved", sku
      `;
      const prod = rows[0];
      if (!prod) {
        throw new DomainRuleError(
          "El ajuste dejaría el stock físico por debajo de las reservas activas o en negativo.",
          "INVALID_STOCK_ADJUSTMENT",
          409
        );
      }

      const mov = await tx.inventoryMovement.create({
        data: {
          productId: d.productId,
          type: "MANUAL_ADJUSTMENT",
          quantityDelta: d.quantityDelta,
          stockOnHandAfter: prod.stockOnHand,
          stockReservedAfter: prod.stockReserved,
          referenceType: "ADJUSTMENT",
          referenceId: crypto.randomUUID(),
          idempotencyKey: `adj-${Date.now()}-${crypto.randomUUID()}`,
          reason: d.reason.trim(),
          actorId: user.id,
        },
      });

      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: "STOCK_ADJUSTED",
          entityType: "PRODUCT",
          entityId: d.productId,
          afterJson: {
            sku: prod.sku,
            quantityDelta: d.quantityDelta,
            stockOnHandAfter: prod.stockOnHand,
            reason: d.reason.trim(),
          },
        },
        tx
      );
      return mov;
    });

    return NextResponse.json({ movement: result });
  } catch (err) {
    if (err instanceof AuthError || err instanceof DomainRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error en operación de inventario." }, { status: 500 });
  }
}
