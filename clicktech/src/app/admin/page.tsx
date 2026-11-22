import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { canRoleSeeInternalCost } from "@/lib/domain/service-rules";
import {
  AdminDashboardClient,
  type AdminSnapshotData,
} from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "CUSTOMER") {
    redirect("/cuenta");
  }

  const canSeeFinance = canRoleSeeInternalCost(user.role);
  const isAdmin = user.role === "ADMIN";

  const [
    categories,
    brands,
    suppliers,
    productsRaw,
    movementsRaw,
    reservationsRaw,
    returnsRaw,
    purchaseOrdersRaw,
    ordersRaw,
    paymentsRaw,
    quotesRaw,
    serviceOrdersRaw,
    customersRaw,
    warrantyClaimsRaw,
    consultationsRaw,
    configsRaw,
    auditLogsRaw,
  ] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supplier.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.inventoryMovement.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { sku: true, name: true } } },
    }),
    prisma.stockReservation.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { sku: true } },
      },
    }),
    prisma.productReturn.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { name: true } },
      },
    }),
    canSeeFinance
      ? prisma.purchaseOrder.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            supplier: { select: { name: true } },
            items: true,
          },
        })
      : Promise.resolve([]),
    canSeeFinance
      ? prisma.order.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
            items: {
              include: {
                product: { include: { category: { select: { name: true } } } },
              },
            },
          },
        })
      : Promise.resolve([]),
    canSeeFinance
      ? prisma.payment.findMany({
          take: 40,
          orderBy: { createdAt: "desc" },
          include: { order: { select: { orderNumber: true } } },
        })
      : Promise.resolve([]),
    canSeeFinance
      ? prisma.quote.findMany({
          take: 30,
          orderBy: { createdAt: "desc" },
          include: { versions: { orderBy: { version: "desc" }, take: 1 } },
        })
      : Promise.resolve([]),
    prisma.serviceOrder.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: { serviceCatalog: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      take: 30,
      include: { _count: { select: { orders: true, customerServices: true } } },
    }),
    prisma.warrantyClaim.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        warranty: { select: { code: true, itemLabel: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.consultation.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    isAdmin ? prisma.businessConfig.findMany({ orderBy: { key: "asc" } }) : Promise.resolve([]),
    canSeeFinance
      ? prisma.auditLog.findMany({
          take: 40,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const paidOrders = ordersRaw.filter((o) => o.paymentStatus === "APPROVED");
  const salesCollectedCents = paidOrders.reduce((acc, o) => acc + o.totalCents, 0);
  const lowStockCount = productsRaw.filter(
    (p) => p.isPublished && getAvailableStock(p) <= p.minStockAlert
  ).length;
  const activeServicesCount = serviceOrdersRaw.filter(
    (s) => !["DELIVERED", "CANCELLED", "QUOTE_REJECTED"].includes(s.status)
  ).length;
  const pendingOrdersCount = ordersRaw.filter((o) =>
    ["PENDING_PAYMENT", "PAYMENT_UNDER_REVIEW"].includes(o.status)
  ).length;
  const openQuotesCount = quotesRaw.filter((q) =>
    ["DRAFT", "SENT_PENDING_APPROVAL"].includes(q.status)
  ).length;

  const snapshot: AdminSnapshotData = {
    currentUser: { id: user.id, name: user.name, email: user.email, role: user.role },
    canSeeFinance,
    isAdmin,
    kpis: {
      ...(canSeeFinance ? { salesCollectedCents } : {}),
      pendingOrdersCount,
      activeServicesCount,
      lowStockCount,
      openQuotesCount,
    },
    categories,
    brands,
    suppliers,
    products: productsRaw.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      model: p.model,
      categoryName: p.category.name,
      brandName: p.brand.name,
      priceCents: p.priceCents,
      ...(canSeeFinance ? { costCents: p.costCents } : {}),
      stockOnHand: p.stockOnHand,
      stockReserved: p.stockReserved,
      stockAvailable: getAvailableStock(p),
      minStockAlert: p.minStockAlert,
      isPublished: p.isPublished,
      imageUrl: p.images[0]?.url ?? null,
      isIllustrative: p.images[0]?.isIllustrative ?? true,
    })),
    movements: movementsRaw.map((m) => ({
      id: m.id,
      sku: m.product.sku,
      productName: m.product.name,
      type: m.type,
      quantityDelta: m.quantityDelta,
      stockOnHandAfter: m.stockOnHandAfter,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    })),
    reservations: reservationsRaw.map((r) => ({
      id: r.id,
      orderNumber: r.order.orderNumber,
      sku: r.product.sku,
      quantity: r.quantity,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
    })),
    returns: returnsRaw.map((rt) => ({
      id: rt.id,
      orderNumber: rt.order.orderNumber,
      productName: rt.product.name,
      quantity: rt.quantity,
      reason: rt.reason,
      physicalValidationStatus: rt.physicalValidationStatus,
    })),
    purchaseOrders: purchaseOrdersRaw.map((po) => ({
      id: po.id,
      code: po.code,
      supplierName: po.supplier.name,
      status: po.status,
      ...(canSeeFinance ? { totalCostCents: po.totalCostCents } : {}),
      createdAt: po.createdAt.toISOString(),
      items: po.items.map((it) => ({
        id: it.id,
        skuSnapshot: it.skuSnapshot,
        productNameSnapshot: it.productNameSnapshot,
        orderedQty: it.orderedQty,
        receivedQty: it.receivedQty,
      })),
    })),
    orders: ordersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerLabel: o.user?.name ?? o.guestName ?? o.guestEmail ?? "Invitado",
      status: o.status,
      paymentStatus: o.paymentStatus,
      deliveryMethod: o.deliveryMethod,
      deliveryStatus: o.deliveryStatus,
      totalCents: o.totalCents,
      createdAt: o.createdAt.toISOString(),
      categoriesInOrder: Array.from(new Set(o.items.map((it) => it.product.category.name))),
    })),
    payments: paymentsRaw.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      method: p.method,
      amountCents: p.amountCents,
      status: p.status,
      referenceNumber: p.referenceNumber,
      proofFilePath: p.proofFilePath,
      isLateSubmission: p.isLateSubmission,
      reviewNotes: p.reviewNotes,
      createdAt: p.createdAt.toISOString(),
    })),
    quotes: quotesRaw.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      type: q.type,
      customerName: q.customerName,
      companyName: q.companyName,
      status: q.status,
      currentVersion: q.currentVersion,
      totalCents: q.versions[0]?.totalCents ?? 0,
      validUntil: q.validUntil.toISOString(),
    })),
    serviceOrders: serviceOrdersRaw.map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber,
      customerName: s.customerName,
      serviceName: s.serviceCatalog.name,
      deviceBrandModel: s.deviceBrandModel,
      status: s.status,
      diagnosisReport: s.diagnosisReport,
      internalNotes: s.internalNotes,
      laborCents: s.laborCents,
      partsTotalCents: s.partsTotalCents,
      totalApprovedCents: s.totalApprovedCents,
      activeQuoteVersion: s.activeQuoteVersion,
      createdAt: s.createdAt.toISOString(),
    })),
    customers: customersRaw.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      ordersCount: c._count.orders,
      servicesCount: c._count.customerServices,
    })),
    warrantyClaims: warrantyClaimsRaw.map((wc) => ({
      id: wc.id,
      warrantyCode: wc.warranty.code,
      itemLabel: wc.warranty.itemLabel,
      customerName: wc.user.name,
      description: wc.description,
      status: wc.status,
    })),
    consultations: consultationsRaw.map((con) => ({
      id: con.id,
      customerName: con.customerName,
      subject: con.subject,
      status: con.status,
      lastMessage: con.messages[0]?.body ?? "",
    })),
    configs: configsRaw.map((cfg) => ({
      key: cfg.key,
      valueJson: (cfg.valueJson ?? {}) as Record<string, unknown>,
      isPendingRealData: cfg.isPendingRealData,
      description: cfg.description,
    })),
    auditLogs: auditLogsRaw.map((a) => ({
      id: a.id,
      actorName: a.actor?.name ?? "Sistema",
      actorRole: a.actorRole ?? "SYSTEM",
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  return <AdminDashboardClient data={snapshot} />;
}
