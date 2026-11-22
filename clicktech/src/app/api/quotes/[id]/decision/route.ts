import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const schema = z.object({
  decision: z.enum(["ACCEPTED", "REJECTED"]),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticación requerida." }, { status: 401 });
  }
  const { id } = await context.params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: "desc" } } },
  });
  if (!quote) {
    return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  }
  const isStaff = user.role === "ADMIN" || user.role === "SALES";
  if (!isStaff && quote.userId !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Decisión inválida." }, { status: 400 });
  }

  const latestVersion = quote.versions[0];
  if (!latestVersion) {
    return NextResponse.json({ error: "La cotización no tiene versiones." }, { status: 400 });
  }
  if (latestVersion.status === parsed.data.decision) {
    return NextResponse.json({ quote, deduplicated: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.quoteVersion.update({
      where: { id: latestVersion.id },
      data: {
        status: parsed.data.decision,
        decidedByUserId: user.id,
        decidedAt: new Date(),
        decisionNotes: parsed.data.notes ?? null,
      },
    });
    await tx.quote.update({
      where: { id: quote.id },
      data: { status: parsed.data.decision },
    });
    await recordAuditLog(
      {
        actorId: user.id,
        actorRole: user.role,
        action: `QUOTE_${parsed.data.decision}`,
        entityType: "QUOTE",
        entityId: quote.id,
        afterJson: { version: latestVersion.version },
      },
      tx
    );
  });

  const updated = await prisma.quote.findUnique({
    where: { id: quote.id },
    include: { versions: { orderBy: { version: "desc" } } },
  });
  return NextResponse.json({ quote: updated });
}
