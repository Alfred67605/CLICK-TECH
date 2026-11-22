import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const schema = z.object({
  key: z.string().min(1),
  valueJson: z.record(z.string(), z.unknown()),
  isPendingRealData: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN"]);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Configuración inválida" }, { status: 400 });
    }

    const before = await prisma.businessConfig.findUnique({ where: { key: parsed.data.key } });
    const updated = await prisma.businessConfig.upsert({
      where: { key: parsed.data.key },
      update: {
        valueJson: parsed.data.valueJson as Prisma.InputJsonValue,
        isPendingRealData: parsed.data.isPendingRealData ?? before?.isPendingRealData ?? false,
        updatedById: user.id,
      },
      create: {
        key: parsed.data.key,
        valueJson: parsed.data.valueJson as Prisma.InputJsonValue,
        isPendingRealData: parsed.data.isPendingRealData ?? false,
        description: parsed.data.key,
        updatedById: user.id,
      },
    });

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "BUSINESS_CONFIG_UPDATED",
      entityType: "BUSINESS_CONFIG",
      entityId: parsed.data.key,
      beforeJson: before?.valueJson,
      afterJson: updated.valueJson,
    });

    return NextResponse.json({ config: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo guardar configuración." }, { status: 500 });
  }
}
