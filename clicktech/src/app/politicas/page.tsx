import { prisma } from "@/lib/prisma";
import { formatBs } from "@/lib/domain/money";

export const dynamic = "force-dynamic";

export default async function PoliticasPage() {
  const [configs, zones] = await Promise.all([
    prisma.businessConfig.findMany({ orderBy: { key: "asc" } }),
    prisma.deliveryZone.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Políticas Comerciales, Cobertura y Datos Pendientes
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          ClickTech opera actualmente en entorno de demostración local. Para evitar publicar datos ficticios como reales, listamos con transparencia qué información comercial debe completarse antes de atender clientes en producción.
        </p>
      </div>

      <section id="pendientes" className="space-y-3">
        <h2 className="font-heading text-xl font-bold">Configuración y datos pendientes del negocio</h2>
        <div className="space-y-3">
          {configs.map((c) => (
            <div
              key={c.key}
              className="rounded-xl border p-4 text-xs space-y-1"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: c.isPendingRealData ? "var(--status-warn)" : "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <span>{c.key}</span>
                <span style={{ color: c.isPendingRealData ? "var(--status-warn)" : "var(--status-ok)" }}>
                  {c.isPendingRealData ? "Pendiente de datos reales" : "Configurado"}
                </span>
              </div>
              <p style={{ color: "var(--text-secondary)" }}>{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold">Zonas de entrega y recojo en Potosí</h2>
        <div className="space-y-2.5 text-xs">
          {zones.map((z) => (
            <div
              key={z.id}
              className="rounded-xl border p-4 flex flex-wrap justify-between gap-2"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <p className="font-bold text-sm">{z.name}</p>
                <p style={{ color: "var(--text-muted)" }}>{z.estimatedSchedule}</p>
              </div>
              <span className="font-bold tabular-nums text-sm" style={{ color: "var(--accent-cyan)" }}>
                {z.feeCents !== null ? formatBs(z.feeCents) : "Sujeto a cotización"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
