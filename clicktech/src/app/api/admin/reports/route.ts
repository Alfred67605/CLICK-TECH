import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { canRoleSeeInternalCost } from "@/lib/domain/service-rules";
import { formatBs } from "@/lib/domain/money";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "SALES", "TECH"]);
    const canSeeFinance = canRoleSeeInternalCost(user.role);
    const format = req.nextUrl.searchParams.get("format") ?? "json";

    if (!canSeeFinance && req.nextUrl.searchParams.get("type") === "margins") {
      return NextResponse.json(
        { error: "El rol técnico no tiene acceso a costos internos ni márgenes." },
        { status: 403 }
      );
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { order: { paymentStatus: "APPROVED" } },
      include: {
        order: { select: { orderNumber: true, createdAt: true } },
        product: { select: { category: { select: { name: true } } } },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    const rows = orderItems.map((it) => {
      const revenueCents = it.lineTotalCents;
      const costTotalCents = it.unitCostCentsSnapshot * it.quantity;
      const marginCents = revenueCents - costTotalCents;
      return {
        orderNumber: it.order.orderNumber,
        date: it.order.createdAt.toISOString(),
        sku: it.skuSnapshot,
        productName: it.productNameSnapshot,
        category: it.product.category.name,
        quantity: it.quantity,
        revenueCents,
        ...(canSeeFinance ? { costTotalCents, marginCents } : {}),
      };
    });

    if (format === "csv") {
      const header = canSeeFinance
        ? "Pedido,Fecha,SKU,Producto,Categoria,Cantidad,Ingreso_Bs,Costo_Bs,Margen_Bs"
        : "Pedido,Fecha,SKU,Producto,Categoria,Cantidad,Importe_Bs";
      const lines = rows.map((r) => {
        const base = [
          r.orderNumber,
          r.date,
          r.sku,
          `"${r.productName.replace(/"/g, '""')}"`,
          `"${r.category}"`,
          r.quantity,
          `"${formatBs(r.revenueCents)}"`,
        ];
        if (canSeeFinance) {
          base.push(
            `"${formatBs((r as { costTotalCents: number }).costTotalCents)}"`,
            `"${formatBs((r as { marginCents: number }).marginCents)}"`
          );
        }
        return base.join(",");
      });
      return new NextResponse([header, ...lines].join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="clicktech-reporte-ventas.csv"',
        },
      });
    }

    return NextResponse.json({ rows, canSeeFinance });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error generando reporte." }, { status: 500 });
  }
}
