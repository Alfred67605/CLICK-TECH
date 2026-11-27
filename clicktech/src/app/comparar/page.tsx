import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Cpu,
  HardDrive,
  Layers,
  Package,
  Scale,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { formatBsCompact } from "@/lib/domain/money";
import { CompareColumnActions } from "@/components/catalog/CompareColumnActions";

export const dynamic = "force-dynamic";

function getSpecIcon(key: string) {
  const k = key.toLowerCase();
  if (k.includes("cpu") || k.includes("procesador") || k.includes("nucleo") || k.includes("núcleo")) {
    return <Cpu className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />;
  }
  if (k.includes("ram") || k.includes("memoria")) {
    return <Layers className="w-3.5 h-3.5" style={{ color: "var(--accent-purple)" }} />;
  }
  if (k.includes("ssd") || k.includes("disco") || k.includes("almacenamiento")) {
    return <HardDrive className="w-3.5 h-3.5" style={{ color: "var(--status-ok)" }} />;
  }
  if (k.includes("fuente") || k.includes("watts") || k.includes("consumo") || k.includes("tdp")) {
    return <Zap className="w-3.5 h-3.5" style={{ color: "var(--status-warn)" }} />;
  }
  return <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />;
}

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
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
          compatibilitySpec: true,
        },
      })
    : [];

  const firstCategoryId = products[0]?.categoryId;
  const sameCategory = products.every((p) => p.categoryId === firstCategoryId);

  const allSpecKeys = new Set<string>();
  for (const p of products) {
    const obj = (p.shortSpecsJson ?? {}) as Record<string, string>;
    Object.keys(obj).forEach((k) => allSpecKeys.add(k));
  }

  const enriched = products.map((p) => ({
    ...p,
    effectivePrice: p.promoPriceCents ?? p.priceCents,
    avail: getAvailableStock(p),
  }));

  const minPrice = enriched.length > 0 ? Math.min(...enriched.map((p) => p.effectivePrice)) : 0;
  const maxStock = enriched.length > 0 ? Math.max(...enriched.map((p) => p.avail)) : 0;

  return (
    <div className="ct-container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <Link
            href="/catalogo"
            className="text-xs inline-flex items-center gap-1.5 font-semibold hover:underline"
            style={{ color: "var(--accent-cyan)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al catálogo
          </Link>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Comparador de Modelos
            </h1>
            {products.length > 0 && (
              <span
                className="px-2.5 py-0.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: "var(--accent-cyan-soft)",
                  borderColor: "var(--border-strong)",
                  color: "var(--accent-cyan)",
                }}
              >
                <Scale className="w-3.5 h-3.5" />
                {products.length} modelos en comparativa
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Alineación de atributos técnicos reales. Las filas con diferencias entre modelos se resaltan automáticamente.
          </p>
        </div>

        <Link
          href="/arma-tu-pc"
          className="ct-btn h-10 px-4 rounded-xl border text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-strong)",
            color: "var(--accent-cyan)",
          }}
        >
          <Sparkles className="w-4 h-4" />
          Probar en Arma tu PC
        </Link>
      </div>

      {products.length < 2 ? (
        <div
          className="rounded-2xl border p-10 text-center space-y-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl border mx-auto flex items-center justify-center"
            style={{
              backgroundColor: "var(--accent-cyan-soft)",
              borderColor: "var(--border-strong)",
              color: "var(--accent-cyan)",
            }}
          >
            <Scale className="w-6 h-6" />
          </div>
          <p className="font-semibold max-w-lg mx-auto" style={{ color: "var(--text-primary)" }}>
            Selecciona entre 2 y 4 productos de una misma categoría en el catálogo para comparar sus especificaciones lado a lado.
          </p>
          <Link
            href="/catalogo"
            className="ct-btn inline-flex items-center h-11 px-6 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            Ir al catálogo
          </Link>
        </div>
      ) : !sameCategory ? (
        <div
          className="rounded-2xl border p-6 text-sm space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--status-danger)" }}
        >
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Los productos seleccionados pertenecen a categorías diferentes. Compara modelos de una sola categoría para alinear especificaciones equivalentes.
          </p>
          <Link
            href="/catalogo"
            className="ct-btn inline-flex items-center h-9 px-4 rounded-lg text-xs font-bold"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            Elegir modelos compatibles
          </Link>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <th
                  className="p-5 w-52 align-top font-heading text-xs uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    color: "var(--text-muted)",
                  }}
                >
                  <span className="block">Atributo / Modelo</span>
                  <span className="block text-[11px] font-normal normal-case mt-2 leading-relaxed">
                    Categoría: <strong style={{ color: "var(--accent-cyan)" }}>{products[0].category.name}</strong>
                  </span>
                </th>
                {enriched.map((p) => {
                  const isBestPrice = enriched.length > 1 && p.effectivePrice === minPrice;
                  const isBestStock = enriched.length > 1 && p.avail === maxStock && p.avail > 0;
                  return (
                    <th key={p.id} className="p-5 min-w-[250px] align-top border-l" style={{ borderColor: "var(--border-subtle)" }}>
                      <div className="space-y-3">
                        <div
                          className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border p-3 flex items-center justify-center"
                          style={{
                            background: "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)",
                            borderColor: isBestPrice ? "var(--border-strong)" : "var(--border-subtle)",
                          }}
                        >
                          {p.images[0] ? (
                            <img
                              src={p.images[0].url}
                              alt={p.name}
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                          ) : (
                            <span className="text-xs" style={{ color: "#475569" }}>
                              Sin imagen
                            </span>
                          )}
                          <span
                            className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: "rgba(2,4,10,0.75)", color: "#F8FAFC" }}
                          >
                            {p.brand.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                          {isBestPrice && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold"
                              style={{
                                backgroundColor: "rgba(16, 185, 129, 0.14)",
                                borderColor: "rgba(16, 185, 129, 0.35)",
                                color: "var(--status-ok)",
                              }}
                            >
                              <Award className="w-3 h-3" /> Mejor precio
                            </span>
                          )}
                          {isBestStock && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold"
                              style={{
                                backgroundColor: "var(--accent-cyan-soft)",
                                borderColor: "var(--border-strong)",
                                color: "var(--accent-cyan)",
                              }}
                            >
                              <Package className="w-3 h-3" /> Mayor stock
                            </span>
                          )}
                        </div>

                        <div>
                          <Link
                            href={`/producto/${p.slug}`}
                            className="block font-heading text-sm font-bold hover:underline leading-snug"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {p.name}
                          </Link>
                          <span className="block text-[11px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                            SKU: {p.sku}
                          </span>
                        </div>

                        <CompareColumnActions
                          productId={p.id}
                          slug={p.slug}
                          name={p.name}
                          inStock={p.avail > 0}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y text-xs sm:text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              <tr style={{ backgroundColor: "var(--accent-cyan-soft)" }}>
                <td className="p-4 font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Zap className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                  Precio (Bs)
                </td>
                {enriched.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l font-heading text-lg font-extrabold tabular-nums"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--accent-cyan)" }}
                  >
                    {formatBsCompact(p.effectivePrice)}
                    {p.promoPriceCents && p.promoPriceCents < p.priceCents && (
                      <span className="block text-[11px] line-through font-normal" style={{ color: "var(--text-muted)" }}>
                        Antes {formatBsCompact(p.priceCents)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <Package className="w-4 h-4" style={{ color: "var(--status-ok)" }} />
                  Disponibilidad
                </td>
                {enriched.map((p) => (
                  <td key={p.id} className="p-4 border-l tabular-nums" style={{ borderColor: "var(--border-subtle)" }}>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: p.avail > 0 ? "rgba(16,185,129,0.14)" : "rgba(244,63,94,0.14)",
                        color: p.avail > 0 ? "var(--status-ok)" : "var(--status-danger)",
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {p.avail > 0 ? `${p.avail} unidad(es)` : "Sin stock"}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
                  Garantía
                </td>
                {enriched.map((p) => (
                  <td key={p.id} className="p-4 border-l" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                    {p.warrantyMonths ? `${p.warrantyMonths} meses` : "Dato no especificado"}
                  </td>
                ))}
              </tr>

              {Array.from(allSpecKeys).map((key) => {
                const values = enriched.map((p) => ((p.shortSpecsJson ?? {}) as Record<string, string>)[key] ?? "");
                const hasDiff = new Set(values).size > 1;
                return (
                  <tr
                    key={key}
                    style={{
                      backgroundColor: hasDiff ? "color-mix(in srgb, var(--accent-cyan-soft) 35%, transparent)" : "transparent",
                    }}
                  >
                    <td className="p-4 font-semibold" style={{ color: "var(--text-muted)" }}>
                      <span className="inline-flex items-center gap-2">
                        {getSpecIcon(key)}
                        <span>{key}</span>
                        {hasDiff && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            style={{ backgroundColor: "var(--accent-purple-soft)", color: "var(--accent-purple)" }}
                          >
                            Difiere
                          </span>
                        )}
                      </span>
                    </td>
                    {enriched.map((p) => {
                      const obj = (p.shortSpecsJson ?? {}) as Record<string, string>;
                      const val = obj[key];
                      return (
                        <td
                          key={p.id}
                          className="p-4 border-l font-medium"
                          style={{
                            borderColor: "var(--border-subtle)",
                            color: val ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {val ?? "Dato no especificado"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
