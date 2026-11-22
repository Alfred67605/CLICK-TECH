import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const schema = z.object({
  subject: z.string().min(4),
  message: z.string().min(5),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  orderId: z.string().optional(),
  serviceOrderId: z.string().optional(),
  productId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Completa asunto y mensaje." },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const cName = user?.name || d.customerName?.trim();
  const cEmail = user?.email || d.customerEmail?.trim().toLowerCase();
  if (!cName || !cEmail) {
    return NextResponse.json(
      { error: "Ingresa tu nombre y correo o inicia sesión." },
      { status: 400 }
    );
  }

  const consultation = await prisma.consultation.create({
    data: {
      userId: user?.id ?? null,
      customerName: cName,
      customerEmail: cEmail,
      subject: d.subject.trim(),
      orderId: d.orderId ?? null,
      serviceOrderId: d.serviceOrderId ?? null,
      productId: d.productId ?? null,
      status: "OPEN",
      messages: {
        create: {
          senderRole: user?.role ?? "CUSTOMER",
          senderName: cName,
          body: d.message.trim(),
        },
      },
    },
    include: { messages: true },
  });

  await recordAuditLog({
    actorId: user?.id ?? null,
    actorRole: user?.role ?? "CUSTOMER",
    action: "CONSULTATION_CREATED",
    entityType: "CONSULTATION",
    entityId: consultation.id,
  });

  return NextResponse.json({ consultation }, { status: 201 });
}
