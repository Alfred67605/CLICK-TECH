import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import {
  canRoleSeeInternalCost,
  canRoleSeeInternalServiceNotes,
} from "@/lib/domain/service-rules";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ ticketNumber: string }> }
) {
  const { ticketNumber } = await context.params;
  const user = await getCurrentUser();
  const emailParam = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  const so = await prisma.serviceOrder.findFirst({
    where: { OR: [{ ticketNumber }, { id: ticketNumber }] },
    include: {
      serviceCatalog: true,
      assignedTech: { select: { id: true, name: true } },
      timeline: { orderBy: { createdAt: "asc" } },
      parts: true,
      attachments: true,
      quotes: {
        include: {
          versions: { orderBy: { version: "desc" } },
        },
      },
    },
  });

  if (!so) {
    return NextResponse.json({ error: "Orden técnica no encontrada." }, { status: 404 });
  }

  const isStaff = user && (user.role === "ADMIN" || user.role === "SALES" || user.role === "TECH");
  const isOwner = Boolean(user && so.userId && so.userId === user.id);
  const matchesGuestEmail = Boolean(emailParam && so.customerEmail.toLowerCase() === emailParam);

  if (!isStaff && !isOwner && !matchesGuestEmail) {
    return NextResponse.json(
      { error: "Inicia sesión o ingresa el correo asociado a esta orden para consultarla." },
      { status: user ? 403 : 401 }
    );
  }

  const canSeeInternal = canRoleSeeInternalServiceNotes(user?.role);
  const canSeeCosts = canRoleSeeInternalCost(user?.role);

  return NextResponse.json({
    serviceOrder: {
      ...so,
      internalNotes: canSeeInternal ? so.internalNotes : undefined,
      timeline: so.timeline.map((ev) => ({
        ...ev,
        internalNote: canSeeInternal ? ev.internalNote : undefined,
      })),
      parts: so.parts.map((pt) => ({
        ...pt,
        unitCostCentsSnapshot: canSeeCosts ? pt.unitCostCentsSnapshot : undefined,
      })),
      attachments: so.attachments.filter((att) => canSeeInternal || !att.isInternal),
    },
  });
}
