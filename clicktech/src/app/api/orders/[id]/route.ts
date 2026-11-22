import { NextRequest, NextResponse } from "next/server";
import { authorizeOrderAccess } from "@/lib/domain/order-access";
import { canRoleSeeInternalCost } from "@/lib/domain/service-rules";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const code = req.nextUrl.searchParams.get("code");
  const authz = await authorizeOrderAccess(id, code);
  if (!authz.allowed || !authz.order) {
    return NextResponse.json(
      { error: authz.status === 404 ? "Pedido no encontrado." : "No autorizado para ver este pedido." },
      { status: authz.status }
    );
  }

  const canSeeCost = canRoleSeeInternalCost(authz.user?.role);
  const sanitized = {
    ...authz.order,
    guestVerificationCodeHash: undefined,
    items: authz.order.items.map((it) => ({
      ...it,
      unitCostCentsSnapshot: canSeeCost ? it.unitCostCentsSnapshot : undefined,
    })),
  };

  return NextResponse.json({ order: sanitized });
}
