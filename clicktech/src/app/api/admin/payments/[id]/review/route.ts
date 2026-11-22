import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/domain/auth";
import {
  DomainRuleError,
  reviewPaymentTransactional,
} from "@/lib/domain/inventory-orders";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "REFUNDED"]),
  reviewNotes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "SALES"]);
    const { id } = await context.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Decisión de pago inválida" }, { status: 400 });
    }

    const res = await reviewPaymentTransactional({
      paymentId: id,
      decision: parsed.data.decision,
      reviewerId: user.id,
      reviewerRole: user.role,
      reviewNotes: parsed.data.reviewNotes ?? null,
    });

    return NextResponse.json(res);
  } catch (err) {
    if (err instanceof AuthError || err instanceof DomainRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo revisar el pago." }, { status: 500 });
  }
}
