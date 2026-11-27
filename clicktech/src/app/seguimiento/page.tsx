import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";
import { TrackingHubClient } from "@/components/tracking/TrackingHubClient";

export const dynamic = "force-dynamic";

export default async function SeguimientoIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string; email?: string }>;
}) {
  const sp = await searchParams;
  if (sp.ticket) {
    const emailQ = sp.email ? `?email=${encodeURIComponent(sp.email)}` : "";
    redirect(`/seguimiento/${encodeURIComponent(sp.ticket.trim())}${emailQ}`);
  }

  const user = await getCurrentUser();
  const [userServices, userOrders] = user
    ? await Promise.all([
        prisma.serviceOrder.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          include: { serviceCatalog: true },
        }),
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
      ])
    : [[], []];

  return (
    <TrackingHubClient
      isLoggedIn={Boolean(user)}
      userServices={userServices.map((so) => ({
        id: so.id,
        ticketNumber: so.ticketNumber,
        serviceName: so.serviceCatalog.name,
        deviceBrandModel: so.deviceBrandModel,
        status: so.status,
      }))}
      userOrders={userOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalBs: formatBs(o.totalCents),
        createdAtLabel: formatDateLaPaz(o.createdAt, false),
      }))}
    />
  );
}
