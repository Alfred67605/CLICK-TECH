import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const schema = z.object({
  status: z
    .enum([
      "PREPARING",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ])
    .optional(),
  deliveryStatus: z
    .enum(["PENDING", "COORDINATING", "READY", "IN_TRANSIT", "DELIVERED"])
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "SALES"]);
    const { id } = await context.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const before = await prisma.order.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }
    if (before.status === "CANCELLED" || before.status === "EXPIRED_RESERVATION") {
      return NextResponse.json(
        { error: "Un pedido cancelado o expirado no puede avanzar a preparación/entrega." },
        { status: 409 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: parsed.data.status ?? undefined,
        deliveryStatus: parsed.data.deliveryStatus ?? undefined,
      },
    });

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "ORDER_FULFILLMENT_UPDATED",
      entityType: "ORDER",
      entityId: id,
      beforeJson: { status: before.status, deliveryStatus: before.deliveryStatus },
      afterJson: { status: updated.status, deliveryStatus: updated.deliveryStatus },
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
  }
}
