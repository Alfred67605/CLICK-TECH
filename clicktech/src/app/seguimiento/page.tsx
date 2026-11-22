import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/domain/auth";
import { SERVICE_STATUS_LABELS } from "@/lib/domain/service-rules";

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
  const userServices = user
    ? await prisma.serviceOrder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { serviceCatalog: true },
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Seguimiento de Servicio Técnico
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ingresa el número de orden técnica y el correo registrado para consultar avances, aprobar cotizaciones y revisar pruebas realizadas.
        </p>
      </div>

      <form
        method="GET"
        action="/seguimiento"
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="trk-ticket" className="block text-xs font-medium mb-1">
              Número de orden técnica
            </label>
            <input
              id="trk-ticket"
              name="ticket"
              type="text"
              required
              placeholder="Ej. ST-2026-DEMO-001"
              className="w-full h-11 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label htmlFor="trk-email" className="block text-xs font-medium mb-1">
              Correo de contacto (requerido si no iniciaste sesión)
            </label>
            <input
              id="trk-email"
              name="email"
              type="email"
              placeholder="tu@correo.example"
              className="w-full h-11 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          className="ct-btn h-11 px-6 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
          style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
        >
          <Search className="w-4 h-4" />
          Consultar orden técnica
        </button>
      </form>

      {userServices.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Tus órdenes técnicas registradas</h2>
          {userServices.map((so) => (
            <Link
              key={so.id}
              href={`/seguimiento/${so.ticketNumber}`}
              className="ct-card block rounded-xl border p-4 flex items-center justify-between gap-4"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <p className="font-heading font-bold text-sm">{so.ticketNumber}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {so.serviceCatalog.name} · {so.deviceBrandModel}
                </p>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--accent-cyan)" }}>
                {SERVICE_STATUS_LABELS[so.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
