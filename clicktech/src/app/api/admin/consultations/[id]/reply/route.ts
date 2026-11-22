import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const schema = z.object({
  body: z.string().min(2),
  status: z.enum(["ANSWERED", "CLOSED"]).default("ANSWERED"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "SALES", "TECH"]);
    const { id } = await context.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.consultationMessage.create({
        data: {
          consultationId: id,
          senderRole: user.role,
          senderName: user.name,
          body: parsed.data.body.trim(),
        },
      }),
      prisma.consultation.update({
        where: { id },
        data: { status: parsed.data.status },
      }),
    ]);

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "CONSULTATION_REPLIED",
      entityType: "CONSULTATION",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error respondiendo consulta." }, { status: 500 });
  }
}
