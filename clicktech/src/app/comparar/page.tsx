import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { formatBsCompact } from "@/lib/domain/money";

export const dynamic = "force-dynamic";

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const sp = await searchParams;
  const ids = (sp.ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids }, isPublished: true },
        include: {
          brand: true,
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
          compatibilitySpec: true,
        },
      })
    : [];

  const firstCategoryId = products[0]?.categoryId;
  const sameCategory = products.every((p) => p.categoryId === firstCategoryId);

  // Gather union of all spec keys across selected models
  const allSpecKeys = new Set<string>();
  for (const p of products) {
    const obj = (p.shortSpecsJson ?? {}) as Record<string, string>;
    Object.keys(obj).forEach((k) => allSpecKeys.add(k));
  }

  return (
    <div className="ct-container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/catalogo" className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: "var(--accent-cyan)" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al catálogo
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2">
            Comparador de Modelos
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Alineación de atributos técnicos reales. Los campos sin dato registrado se muestran explícitamente como no especificados.
          </p>
        </div>
      </div>

      {products.length < 2 ? (
        <div
          className="rounded-xl border p-10 text-center space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <p className="font-semibold">Selecciona entre 2 y 4 productos de una misma categoría en el catálogo para compararlos.</p>
          <Link
            href="/catalogo"
            className="ct-btn inline-flex items-center h-10 px-5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            Ir al catálogo
          </Link>
        </div>
      ) : !sameCategory ? (
        <div
          className="rounded-xl border p-6 text-sm"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--status-danger)" }}
        >
          Los productos seleccionados pertenecen a categorías diferentes. Compara modelos de una sola categoría para alinear especificaciones equivalentes.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
          <table className="w-full text-sm text-left" style={{ backgroundColor: "var(--bg-surface)" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <th className="p-4 w-48 align-top font-heading text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                  Atributo / Modelo
                </th>
                {products.map((p) => (
                  <th key={p.id} className="p-4 min-w-[210px] align-top space-y-2">
                    <div
                      className="h-28 rounded-lg flex items-center justify-center p-2"
                      style={{ backgroundColor: "var(--bg-card-media)" }}
                    >
                      {p.images[0] && (
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <Link href={`/producto/${p.slug}`} className="block font-heading font-bold hover:underline">
                      {p.name}
                    </Link>
                    <span className="block text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {p.sku}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-xs sm:text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <td className="p-3.5 font-semibold" style={{ color: "var(--text-muted)" }}>Precio (Bs)</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3.5 font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                    {formatBsCompact(p.promoPriceCents ?? p.priceCents)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold" style={{ color: "var(--text-muted)" }}>Disponibilidad</td>
                {products.map((p) => {
                  const avail = getAvailableStock(p);
                  return (
                    <td key={p.id} className="p-3.5 tabular-nums">
                      {avail > 0 ? `${avail} unidad(es)` : "Sin stock"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold" style={{ color: "var(--text-muted)" }}>Garantía</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3.5">
                    {p.warrantyMonths ? `${p.warrantyMonths} meses` : "Dato no especificado"}
                  </td>
                ))}
              </tr>
              {Array.from(allSpecKeys).map((key) => (
                <tr key={key}>
                  <td className="p-3.5 font-semibold" style={{ color: "var(--text-muted)" }}>
                    {key}
                  </td>
                  {products.map((p) => {
                    const obj = (p.shortSpecsJson ?? {}) as Record<string, string>;
                    const val = obj[key];
                    return (
                      <td
                        key={p.id}
                        className="p-3.5"
                        style={{ color: val ? "var(--text-primary)" : "var(--text-muted)" }}
                      >
                        {val ?? "Dato no especificado"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
