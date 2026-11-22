import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const schema = z.object({
  status: z.enum(["UNDER_REVIEW", "APPROVED_SERVICE", "RESOLVED", "REJECTED"]),
  resolutionNotes: z.string().min(3),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "SALES", "TECH"]);
    const { id } = await context.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const updated = await prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: parsed.data.status,
        resolutionNotes: parsed.data.resolutionNotes.trim(),
      },
    });

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "WARRANTY_CLAIM_UPDATED",
      entityType: "WARRANTY_CLAIM",
      entityId: id,
      afterJson: { status: parsed.data.status },
    });

    return NextResponse.json({ claim: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error actualizando reclamo." }, { status: 500 });
  }
}
