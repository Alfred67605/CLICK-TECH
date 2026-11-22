import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, AuthError, getCurrentUser } from "@/lib/domain/auth";
import { savePrivateUploadedFile, UploadValidationError } from "@/lib/domain/storage";
import { generateTicketNumber } from "@/lib/domain/service-orders";
import { recordAuditLog } from "@/lib/domain/audit";

export async function GET() {
  const services = await prisma.serviceCatalog.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ services });
}

const createServiceOrderSchema = z.object({
  serviceCatalogId: z.string().min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(5),
  deviceType: z.enum(["DESKTOP", "LAPTOP", "COMPONENT", "PERIPHERAL", "OTHER"]),
  deviceBrandModel: z.string().min(2),
  deviceSerial: z.string().optional(),
  reportedSymptoms: z.string().min(5),
  preferredSchedule: z.string().optional(),
  deliveryModality: z.enum(["DROP_OFF_POINT", "COORDINATED_PICKUP"]).default("DROP_OFF_POINT"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    assertRateLimit(`svc-req:${ip}`, 15, 60_000);

    const user = await getCurrentUser();
    const contentType = req.headers.get("content-type") ?? "";
    let payload: Record<string, unknown> = {};
    const uploadedFiles: Array<{ relativePath: string; mimeType: string; sizeBytes: number }> = [];

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      payload = {
        serviceCatalogId: fd.get("serviceCatalogId"),
        customerName: fd.get("customerName") || user?.name,
        customerEmail: fd.get("customerEmail") || user?.email,
        customerPhone: fd.get("customerPhone") || user?.phone || "Pendiente",
        deviceType: fd.get("deviceType"),
        deviceBrandModel: fd.get("deviceBrandModel"),
        deviceSerial: fd.get("deviceSerial") || undefined,
        reportedSymptoms: fd.get("reportedSymptoms"),
        preferredSchedule: fd.get("preferredSchedule") || undefined,
        deliveryModality: fd.get("deliveryModality") || "DROP_OFF_POINT",
      };
      const file = fd.get("photo");
      if (file && file instanceof File && file.size > 0) {
        const saved = await savePrivateUploadedFile("services", Buffer.from(await file.arrayBuffer()));
        uploadedFiles.push(saved);
      }
    } else {
      payload = await req.json();
    }

    const parsed = createServiceOrderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Faltan datos obligatorios de la solicitud." },
        { status: 400 }
      );
    }

    const serviceCatalog = await prisma.serviceCatalog.findUnique({
      where: { id: parsed.data.serviceCatalogId },
    });
    if (!serviceCatalog || !serviceCatalog.isActive) {
      return NextResponse.json({ error: "Servicio seleccionado no disponible." }, { status: 404 });
    }

    // Enforce workshop daily capacity if preferredSchedule was requested
    let parsedSchedule: Date | null = null;
    if (parsed.data.preferredSchedule) {
      const candidate = new Date(parsed.data.preferredSchedule);
      if (!Number.isNaN(candidate.getTime())) {
        const capCfg = await prisma.businessConfig.findUnique({ where: { key: "workshop_capacity" } });
        const maxDaily = Number((capCfg?.valueJson as Record<string, unknown>)?.maxDailyAppointments ?? 6);
        const dayStart = new Date(candidate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(candidate);
        dayEnd.setUTCHours(23, 59, 59, 999);
        const countSameDay = await prisma.serviceOrder.count({
          where: {
            preferredSchedule: { gte: dayStart, lte: dayEnd },
            status: { notIn: ["CANCELLED", "DELIVERED"] },
          },
        });
        if (countSameDay >= maxDaily) {
          return NextResponse.json(
            { error: "La capacidad de recepción técnica para esa fecha está completa. Elige otro horario." },
            { status: 409 }
          );
        }
        parsedSchedule = candidate;
      }
    }

    const ticketNumber = generateTicketNumber();

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.create({
        data: {
          ticketNumber,
          userId: user?.id ?? null,
          customerName: parsed.data.customerName.trim(),
          customerEmail: parsed.data.customerEmail.trim().toLowerCase(),
          customerPhone: parsed.data.customerPhone.trim(),
          serviceCatalogId: serviceCatalog.id,
          deviceType: parsed.data.deviceType,
          deviceBrandModel: parsed.data.deviceBrandModel.trim(),
          deviceSerial: parsed.data.deviceSerial?.trim() || null,
          reportedSymptoms: parsed.data.reportedSymptoms.trim(),
          preferredSchedule: parsedSchedule,
          deliveryModality: parsed.data.deliveryModality,
          status: "REQUEST_RECEIVED",
          timeline: {
            create: {
              fromStatus: null,
              toStatus: "REQUEST_RECEIVED",
              publicMessage: `Solicitud recibida para "${serviceCatalog.name}". Nuestro equipo coordinará la recepción en Potosí.`,
              actorId: user?.id ?? null,
            },
          },
          attachments: uploadedFiles.length
            ? {
                create: uploadedFiles.map((uf) => ({
                  filePath: uf.relativePath,
                  mimeType: uf.mimeType,
                  sizeBytes: uf.sizeBytes,
                  caption: "Foto inicial adjunta por el cliente",
                  isInternal: false,
                  uploadedById: user?.id ?? null,
                })),
              }
            : undefined,
        },
        include: { serviceCatalog: true, timeline: true },
      });

      await recordAuditLog(
        {
          actorId: user?.id ?? null,
          actorRole: user?.role ?? null,
          action: "SERVICE_ORDER_CREATED",
          entityType: "SERVICE_ORDER",
          entityId: order.id,
          afterJson: { ticketNumber, service: serviceCatalog.slug },
        },
        tx
      );
      return order;
    });

    return NextResponse.json({ serviceOrder: created }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadValidationError || err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "No se pudo registrar la solicitud de servicio." },
      { status: 500 }
    );
  }
}
