import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { DomainRuleError } from "@/lib/domain/inventory-orders";
import { decideServiceQuoteTransactional } from "@/lib/domain/service-orders";

const schema = z.object({
  decision: z.enum(["ACCEPTED", "REJECTED"]),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión para aprobar cotizaciones." }, { status: 401 });
    }
    const { ticketNumber } = await context.params;
    const so = await prisma.serviceOrder.findFirst({
      where: { OR: [{ ticketNumber }, { id: ticketNumber }] },
    });
    if (!so) {
      return NextResponse.json({ error: "Orden técnica no encontrada." }, { status: 404 });
    }
    const isStaff = user.role === "ADMIN" || user.role === "SALES";
    if (!isStaff && so.userId !== user.id) {
      return NextResponse.json({ error: "No autorizado para decidir esta cotización." }, { status: 403 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Decisión inválida." }, { status: 400 });
    }

    const result = await decideServiceQuoteTransactional({
      serviceOrderId: so.id,
      decision: parsed.data.decision,
      decidedByUserId: user.id,
      actorRole: user.role,
      notes: parsed.data.notes ?? null,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DomainRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error registrando decisión." }, { status: 500 });
  }
}
