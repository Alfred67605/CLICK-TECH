import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { readPrivateFileSafe } from "@/lib/domain/storage";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticación requerida." }, { status: 401 });
  }

  const { path: segments } = await context.params;
  if (!segments || segments.length < 2) {
    return NextResponse.json({ error: "Archivo no especificado." }, { status: 400 });
  }

  const folder = segments[0];
  const relPath = segments.join("/");
  if (folder !== "receipts" && folder !== "services") {
    return NextResponse.json({ error: "Ruta no permitida." }, { status: 403 });
  }

  // Strict authorization lookup against DB owner or authorized staff role
  let mimeType = "application/octet-stream";

  if (folder === "receipts") {
    const payment = await prisma.payment.findFirst({
      where: { proofFilePath: relPath },
      include: { order: { select: { userId: true } } },
    });
    if (!payment) {
      return NextResponse.json({ error: "Comprobante no encontrado." }, { status: 404 });
    }
    const isStaff = user.role === "ADMIN" || user.role === "SALES";
    const isOwner = payment.order.userId === user.id || payment.submittedByUserId === user.id;
    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }
    mimeType = payment.proofMimeType ?? mimeType;
  } else if (folder === "services") {
    const attachment = await prisma.serviceAttachment.findFirst({
      where: { filePath: relPath },
      include: { serviceOrder: { select: { userId: true, assignedTechId: true } } },
    });
    if (!attachment) {
      return NextResponse.json({ error: "Adjunto de servicio no encontrado." }, { status: 404 });
    }
    const isStaff = user.role === "ADMIN" || user.role === "SALES" || user.role === "TECH";
    const isOwner = attachment.serviceOrder.userId === user.id && !attachment.isInternal;
    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }
    mimeType = attachment.mimeType ?? mimeType;
  }

  const buf = await readPrivateFileSafe(relPath);
  if (!buf) {
    return NextResponse.json({ error: "Archivo no disponible en disco." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
