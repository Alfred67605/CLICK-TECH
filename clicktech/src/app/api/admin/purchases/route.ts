import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import {
  DomainRuleError,
  receivePurchaseOrderTransactional,
} from "@/lib/domain/inventory-orders";
import { lineTotalCents, sumCents } from "@/lib/domain/money";

const createPoSchema = z.object({
  action: z.literal("create"),
  supplierId: z.string().min(1),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        orderedQty: z.number().int().min(1).max(500),
        unitCostCents: z.number().int().min(1),
      })
    )
    .min(1),
});

const receivePoSchema = z.object({
  action: z.literal("receive"),
  purchaseOrderId: z.string().min(1),
  idempotencyKey: z.string().min(6),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        purchaseOrderItemId: z.string().min(1),
        qtyReceived: z.number().int().min(0),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "SALES"]);
    const body = await req.json();

    if (body.action === "receive") {
      const parsed = receivePoSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos de recepción inválidos" }, { status: 400 });
      }
      const res = await receivePurchaseOrderTransactional({
        purchaseOrderId: parsed.data.purchaseOrderId,
        idempotencyKey: parsed.data.idempotencyKey,
        receivedById: user.id,
        actorRole: user.role,
        notes: parsed.data.notes ?? null,
        items: parsed.data.items,
      });
      return NextResponse.json(res);
    }

    const parsed = createPoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de orden de compra inválidos" }, { status: 400 });
    }
    const d = parsed.data;
    const prodIds = d.items.map((i) => i.productId);
    const prods = await prisma.product.findMany({ where: { id: { in: prodIds } } });
    const byId = new Map(prods.map((p) => [p.id, p]));

    let totalCostCents = 0;
    const itemCreates = d.items.map((it) => {
      const p = byId.get(it.productId);
      if (!p) throw new DomainRuleError("Producto de compra inválido.", "PRODUCT_NOT_FOUND", 404);
      totalCostCents = sumCents(totalCostCents, lineTotalCents(it.unitCostCents, it.orderedQty));
      return {
        productId: p.id,
        productNameSnapshot: p.name,
        skuSnapshot: p.sku,
        orderedQty: it.orderedQty,
        receivedQty: 0,
        unitCostCents: it.unitCostCents,
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        code: `OC-${new Date().getFullYear()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        supplierId: d.supplierId,
        status: "ORDERED",
        totalCostCents,
        notes: d.notes ?? null,
        createdById: user.id,
        items: { create: itemCreates },
      },
      include: { items: true, supplier: true },
    });

    return NextResponse.json({ purchaseOrder: po }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError || err instanceof DomainRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error en orden de compra." }, { status: 500 });
  }
}
