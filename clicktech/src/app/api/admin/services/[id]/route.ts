import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { DomainRuleError } from "@/lib/domain/inventory-orders";
import {
  addServiceOrderPartTransactional,
  issueServiceQuoteVersionTransactional,
  transitionServiceOrderTransactional,
} from "@/lib/domain/service-orders";

const transitionSchema = z.object({
  action: z.literal("transition"),
  toStatus: z.enum([
    "REQUEST_RECEIVED",
    "COORDINATION",
    "EQUIPMENT_RECEIVED",
    "DIAGNOSIS",
    "QUOTE_PENDING_APPROVAL",
    "WORK_AUTHORIZED",
    "IN_PROGRESS",
    "TESTING",
    "READY_FOR_DELIVERY",
    "DELIVERED",
    "WAITING_PARTS",
    "QUOTE_REJECTED",
    "CANCELLED",
  ]),
  publicMessage: z.string().min(3),
  internalNote: z.string().optional(),
  diagnosisReport: z.string().optional(),
  closingSummary: z.string().optional(),
  performedTests: z.array(z.string()).optional(),
  maintenanceRecommendations: z.string().optional(),
  deviceSerial: z.string().optional(),
  accessoriesReceived: z.string().optional(),
  initialPhysicalState: z.string().optional(),
  assignedTechId: z.string().optional(),
});

const quoteSchema = z.object({
  action: z.literal("issue_quote"),
  laborCents: z.number().int().min(0),
  changeReason: z.string().optional(),
  termsSnapshot: z.string().optional(),
});

const addPartSchema = z.object({
  action: z.literal("add_part"),
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  idempotencyKey: z.string().min(6),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "SALES", "TECH"]);
    const { id } = await context.params;
    const body = await req.json();

    if (body.action === "issue_quote") {
      const parsed = quoteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos de cotización técnica inválidos" }, { status: 400 });
      }
      const res = await issueServiceQuoteVersionTransactional({
        serviceOrderId: id,
        laborCents: parsed.data.laborCents,
        changeReason: parsed.data.changeReason ?? null,
        termsSnapshot: parsed.data.termsSnapshot ?? null,
        actorId: user.id,
        actorRole: user.role,
      });
      return NextResponse.json(res);
    }

    if (body.action === "add_part") {
      const parsed = addPartSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos de repuesto inválidos" }, { status: 400 });
      }
      const res = await addServiceOrderPartTransactional({
        serviceOrderId: id,
        productId: parsed.data.productId,
        quantity: parsed.data.quantity,
        actorId: user.id,
        actorRole: user.role,
        idempotencyKey: parsed.data.idempotencyKey,
        reason: parsed.data.reason ?? null,
      });
      return NextResponse.json(res);
    }

    const parsed = transitionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Transición de orden inválida" },
        { status: 400 }
      );
    }

    const updated = await transitionServiceOrderTransactional({
      serviceOrderId: id,
      toStatus: parsed.data.toStatus,
      publicMessage: parsed.data.publicMessage,
      internalNote: parsed.data.internalNote ?? null,
      diagnosisReport: parsed.data.diagnosisReport ?? null,
      closingSummary: parsed.data.closingSummary ?? null,
      performedTests: parsed.data.performedTests ?? null,
      maintenanceRecommendations: parsed.data.maintenanceRecommendations ?? null,
      deviceSerial: parsed.data.deviceSerial ?? null,
      accessoriesReceived: parsed.data.accessoriesReceived ?? null,
      initialPhysicalState: parsed.data.initialPhysicalState ?? null,
      assignedTechId: parsed.data.assignedTechId ?? null,
      actorId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({ serviceOrder: updated });
  } catch (err) {
    if (err instanceof AuthError || err instanceof DomainRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error actualizando orden técnica." }, { status: 500 });
  }
}
