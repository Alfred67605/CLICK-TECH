import { NextRequest, NextResponse } from "next/server";
import { cancelOrderTransactional, DomainRuleError } from "@/lib/domain/inventory-orders";
import { authorizeOrderAccess } from "@/lib/domain/order-access";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code : req.nextUrl.searchParams.get("code");
    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : "Cancelado por solicitud del cliente/operador";

    const authz = await authorizeOrderAccess(id, code);
    if (!authz.allowed || !authz.order) {
      return NextResponse.json(
        { error: "No autorizado para cancelar este pedido." },
        { status: authz.status }
      );
    }

    const res = await cancelOrderTransactional({
      orderId: authz.order.id,
      actorId: authz.user?.id ?? null,
      actorRole: authz.user?.role ?? null,
      reason,
    });

    return NextResponse.json(res);
  } catch (err) {
    if (err instanceof DomainRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo cancelar el pedido." }, { status: 500 });
  }
}
