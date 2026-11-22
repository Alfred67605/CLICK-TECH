import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import {
  ServiceTrackingClient,
  type PublicServiceOrderView,
} from "@/components/services/ServiceTrackingClient";

export const dynamic = "force-dynamic";

export default async function SeguimientoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ ticketNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { ticketNumber } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const so = await prisma.serviceOrder.findFirst({
    where: { OR: [{ ticketNumber }, { id: ticketNumber }] },
    include: {
      serviceCatalog: { select: { name: true } },
      assignedTech: { select: { name: true } },
      timeline: {
        orderBy: { createdAt: "asc" },
        select: { id: true, toStatus: true, publicMessage: true, createdAt: true },
      },
      parts: {
        select: {
          id: true,
          skuSnapshot: true,
          productNameSnapshot: true,
          quantity: true,
          unitPriceCentsSnapshot: true,
        },
      },
      attachments: {
        where: { isInternal: false },
        select: { id: true, filePath: true, caption: true },
      },
      quotes: {
        include: { versions: { orderBy: { version: "desc" } } },
      },
    },
  });

  if (!so) notFound();

  const isStaff = user && (user.role === "ADMIN" || user.role === "SALES" || user.role === "TECH");
  const isOwner = Boolean(user && so.userId && so.userId === user.id);
  const matchesEmail = Boolean(
    sp.email && so.customerEmail.toLowerCase() === sp.email.trim().toLowerCase()
  );

  if (!isStaff && !isOwner && !matchesEmail) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="font-heading text-xl font-bold">Acceso protegido a orden técnica</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Para proteger tus datos, inicia sesión con la cuenta propietaria o ingresa el correo asociado desde el buscador de seguimiento.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/login"
            className="ct-btn h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/seguimiento"
            className="ct-btn h-10 px-5 rounded-lg border text-sm font-medium inline-flex items-center"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            Volver a buscar
          </Link>
        </div>
      </div>
    );
  }

  // Strictly project ONLY non-internal fields to client component (internalNotes never serialized!)
  const view: PublicServiceOrderView = {
    id: so.id,
    ticketNumber: so.ticketNumber,
    customerName: so.customerName,
    deviceType: so.deviceType,
    deviceBrandModel: so.deviceBrandModel,
    deviceSerial: so.deviceSerial,
    accessoriesReceived: so.accessoriesReceived,
    initialPhysicalState: so.initialPhysicalState,
    reportedSymptoms: so.reportedSymptoms,
    status: so.status,
    diagnosisReport: so.diagnosisReport,
    laborCents: so.laborCents,
    partsTotalCents: so.partsTotalCents,
    totalApprovedCents: so.totalApprovedCents,
    activeQuoteVersion: so.activeQuoteVersion,
    closingSummary: so.closingSummary,
    performedTestsJson: (so.performedTestsJson as string[] | null) ?? null,
    maintenanceRecommendations: so.maintenanceRecommendations,
    createdAt: so.createdAt.toISOString(),
    serviceCatalog: so.serviceCatalog,
    assignedTech: so.assignedTech,
    timeline: so.timeline.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    parts: so.parts,
    quotes: so.quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      versions: q.versions.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      })),
    })),
    attachments: so.attachments,
  };

  return (
    <ServiceTrackingClient
      order={view}
      canDecideQuote={Boolean(isOwner || user?.role === "ADMIN" || user?.role === "SALES")}
    />
  );
}
