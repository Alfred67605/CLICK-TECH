import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, AuthError, getCurrentUser } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const b2bSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  taxIdNit: z.string().optional(),
  quantityEstimate: z.number().int().min(1).max(500).default(1),
  requirements: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    assertRateLimit(`b2b:${ip}`, 10, 60_000);

    const parsed = b2bSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Completa los datos empresariales requeridos." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const d = parsed.data;
    const quoteNumber = `COT-B2B-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        type: "B2B_CORPORATE",
        userId: user?.id ?? null,
        customerName: d.contactName.trim(),
        customerEmail: d.email.trim().toLowerCase(),
        customerPhone: d.phone.trim(),
        companyName: d.companyName.trim(),
        taxIdNit: d.taxIdNit?.trim() || null,
        notes: `Cantidad estimada: ${d.quantityEstimate}. Requerimiento: ${d.requirements.trim()}`,
        status: "SENT_PENDING_APPROVAL",
        currentVersion: 1,
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        versions: {
          create: {
            version: 1,
            itemsSnapshotJson: [
              {
                kind: "B2B_REQUEST",
                label: d.requirements.trim(),
                quantity: d.quantityEstimate,
                unitPriceCents: 0,
                lineTotalCents: 0,
              },
            ],
            subtotalCents: 0,
            assemblyOrLaborCents: 0,
            totalCents: 0,
            termsSnapshot: "Solicitud B2B registrada para elaboración de propuesta formal por Ventas.",
            changeReason: "Solicitud inicial de empresa/institución",
            status: "PENDING",
            createdById: user?.id ?? null,
          },
        },
      },
    });

    await recordAuditLog({
      actorId: user?.id ?? null,
      actorRole: user?.role ?? null,
      action: "B2B_QUOTE_REQUESTED",
      entityType: "QUOTE",
      entityId: quote.id,
      afterJson: { quoteNumber, companyName: d.companyName },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo registrar la solicitud B2B." }, { status: 500 });
  }
}
