import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAuth } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const schema = z.object({
  warrantyId: z.string().min(1),
  description: z.string().min(10, "Describe el inconveniente técnico con al menos 10 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const warranty = await prisma.warranty.findUnique({ where: { id: parsed.data.warrantyId } });
    if (!warranty || (warranty.userId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Garantía no encontrada o no autorizada." }, { status: 404 });
    }
    if (warranty.status === "VOID" || warranty.status === "EXPIRED") {
      return NextResponse.json(
        { error: "Esta garantía no se encuentra vigente." },
        { status: 409 }
      );
    }

    const claim = await prisma.$transaction(async (tx) => {
      const created = await tx.warrantyClaim.create({
        data: {
          warrantyId: warranty.id,
          userId: user.id,
          description: parsed.data.description.trim(),
          status: "SUBMITTED",
        },
      });
      await tx.warranty.update({
        where: { id: warranty.id },
        data: { status: "CLAIMED" },
      });
      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: "WARRANTY_CLAIM_SUBMITTED",
          entityType: "WARRANTY_CLAIM",
          entityId: created.id,
        },
        tx
      );
      return created;
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error registrando solicitud de garantía." }, { status: 500 });
  }
}
