import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import {
  CustomerPortalClient,
  type CustomerPortalData,
} from "@/components/account/CustomerPortalClient";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [orders, quotes, pcConfigs, services, warranties, consultations] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.quote.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    }),
    prisma.pcConfiguration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { serviceCatalog: { select: { name: true } } },
    }),
    prisma.warranty.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  const data: CustomerPortalData = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      deliveryStatus: o.deliveryStatus,
      totalCents: o.totalCents,
      createdAt: o.createdAt.toISOString(),
      itemsCount: o._count.items,
    })),
    quotes: quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      type: q.type,
      status: q.status,
      currentVersion: q.currentVersion,
      validUntil: q.validUntil.toISOString(),
      totalCents: q.versions[0]?.totalCents ?? 0,
    })),
    pcConfigs: pcConfigs.map((pc) => ({
      id: pc.id,
      shareToken: pc.shareToken,
      name: pc.name,
      compatibilityStatus: pc.compatibilityStatus,
      totalCents: pc.totalCents,
      createdAt: pc.createdAt.toISOString(),
    })),
    services: services.map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber,
      serviceName: s.serviceCatalog.name,
      deviceBrandModel: s.deviceBrandModel,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
    warranties: warranties.map((w) => ({
      id: w.id,
      code: w.code,
      itemLabel: w.itemLabel,
      durationMonths: w.durationMonths,
      expiresAt: w.expiresAt.toISOString(),
      status: w.status,
      terms: w.terms,
    })),
    consultations: consultations.map((c) => ({
      id: c.id,
      subject: c.subject,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      messages: c.messages.map((m) => ({
        senderName: m.senderName,
        senderRole: m.senderRole,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    })),
  };

  return <CustomerPortalClient data={data} />;
}
