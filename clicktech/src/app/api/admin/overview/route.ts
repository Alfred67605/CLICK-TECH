import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { canRoleSeeInternalCost } from "@/lib/domain/service-rules";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "SALES", "TECH"]);
    const canSeeFinance = canRoleSeeInternalCost(user.role);

    const daysParam = Number(req.nextUrl.searchParams.get("days") ?? "30");
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(365, daysParam) : 30;
    const sinceDate = new Date(Date.now() - days * 86400_000);

    const [
      paidOrders,
      pendingOrdersCount,
      activeServicesCount,
      openQuotesCount,
      products,
      servicesByStatus,
      recentAudit,
    ] = await Promise.all([
      canSeeFinance
        ? prisma.order.findMany({
            where: { paymentStatus: "APPROVED", createdAt: { gte: sinceDate } },
            include: { items: { include: { product: { include: { category: true } } } } },
          })
        : Promise.resolve([]),
      prisma.order.count({
        where: { status: { in: ["PENDING_PAYMENT", "PAYMENT_UNDER_REVIEW"] } },
      }),
      prisma.serviceOrder.count({
        where: { status: { notIn: ["DELIVERED", "CANCELLED", "QUOTE_REJECTED"] } },
      }),
      prisma.quote.count({
        where: { status: { in: ["DRAFT", "SENT_PENDING_APPROVAL"] } },
      }),
      prisma.product.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          sku: true,
          name: true,
          stockOnHand: true,
          stockReserved: true,
          minStockAlert: true,
        },
      }),
      prisma.serviceOrder.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.auditLog.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, role: true } } },
      }),
    ]);

    const lowStockProducts = products.filter(
      (p) => Math.max(0, p.stockOnHand - p.stockReserved) <= p.minStockAlert
    );

    const salesCollectedCents = paidOrders.reduce((acc, o) => acc + o.totalCents, 0);
    const categorySalesMap = new Map<string, { category: string; totalCents: number; units: number }>();
    for (const o of paidOrders) {
      for (const it of o.items) {
        const catName = it.product.category.name;
        const curr = categorySalesMap.get(catName) ?? { category: catName, totalCents: 0, units: 0 };
        curr.totalCents += it.lineTotalCents;
        curr.units += it.quantity;
        categorySalesMap.set(catName, curr);
      }
    }

    return NextResponse.json({
      kpis: {
        ...(canSeeFinance ? { salesCollectedCents } : {}),
        pendingOrdersCount,
        activeServicesCount,
        lowStockCount: lowStockProducts.length,
        openQuotesCount,
      },
      lowStockProducts,
      salesByCategory: Array.from(categorySalesMap.values()),
      servicesByStatus: servicesByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      recentAudit,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error cargando resumen." }, { status: 500 });
  }
}
