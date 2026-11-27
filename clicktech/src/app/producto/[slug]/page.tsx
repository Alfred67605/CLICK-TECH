import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Gauge,
  HardDrive,
  Layers,
  MemoryStick,
  MessageCircle,
  Monitor,
  ShieldCheck,
  Sparkles,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPublicBusinessSettings } from "@/lib/domain/business-config";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { formatBsCompact } from "@/lib/domain/money";
import { ProductDetailActions } from "@/components/catalog/ProductDetailActions";
import { ProductCard } from "@/components/catalog/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
  });
  if (!product) {
    return { title: "Producto no encontrado | ClickTech Potosí" };
  }
  const priceText = formatBsCompact(product.promoPriceCents ?? product.priceCents);
  const img = product.images[0]?.url;
  const desc = `${product.brand.name} · ${product.category.name} · Precio oficial ${priceText} en ClickTech Calle Oruro, Potosí.`;
  return {
    title: `${product.name} (${priceText}) | ClickTech Potosí`,
    description: desc,
    openGraph: {
      title: `${product.name} — ${priceText}`,
      description: desc,
      images: img ? [{ url: img, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${priceText}`,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

function getSpecCardMeta(key: string) {
  const k = key.toLowerCase();
  if (k.includes("cpu") || k.includes("procesador") || k.includes("chip")) {
    return { Icon: Cpu, accent: "var(--accent-cyan)", bg: "var(--accent-cyan-soft)", border: "var(--border-strong)" };
  }
  if (k.includes("ram") || k.includes("memoria")) {
    return { Icon: MemoryStick, accent: "var(--accent-purple)", bg: "var(--accent-purple-soft)", border: "rgba(139, 92, 246, 0.35)" };
  }
  if (k.includes("ssd") || k.includes("almacenamiento") || k.includes("disco")) {
    return { Icon: HardDrive, accent: "var(--status-ok)", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.32)" };
  }
  if (k.includes("pantalla") || k.includes("resoluc") || k.includes("hz") || k.includes("gpu") || k.includes("gráfica")) {
    return { Icon: Monitor, accent: "var(--accent-cyan)", bg: "var(--accent-cyan-soft)", border: "var(--border-strong)" };
  }
  if (k.includes("fuente") || k.includes("watt") || k.includes("tdp") || k.includes("certific")) {
    return { Icon: Zap, accent: "var(--status-warn)", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.32)" };
  }
  if (k.includes("placa") || k.includes("socket") || k.includes("formato")) {
    return { Icon: Layers, accent: "var(--accent-purple)", bg: "var(--accent-purple-soft)", border: "rgba(139, 92, 246, 0.35)" };
  }
  if (k.includes("velocidad") || k.includes("frecuencia") || k.includes("boost")) {
    return { Icon: Gauge, accent: "var(--status-ok)", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.32)" };
  }
  return { Icon: Box, accent: "var(--accent-cyan)", bg: "var(--bg-chassis)", border: "var(--border-subtle)" };
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        compatibilitySpec: true,
      },
    }),
    getPublicBusinessSettings(),
  ]);

  if (!product || !product.isPublished) {
    notFound();
  }

  const related = await prisma.product.findMany({
    where: {
      isPublished: true,
      id: { not: product.id },
      categoryId: product.categoryId,
    },
    take: 4,
    include: {
      brand: { select: { name: true } },
      category: { select: { slug: true, name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
      compatibilitySpec: { select: { socket: true, ramGeneration: true } },
    },
  });

  const stockAvailable = getAvailableStock(product);
  const primaryImg = product.images[0] ?? null;
  const specs = (product.shortSpecsJson ?? {}) as Record<string, string>;
  const activePrice = product.promoPriceCents ?? product.priceCents;

  // Direct compatibility matching logic
  const spec = product.compatibilitySpec;
  type CompatibleProductItem = {
    id: string;
    sku: string;
    slug: string;
    name: string;
    priceCents: number;
    promoPriceCents: number | null;
    brand: { name: string } | null;
    category: { name: string; slug: string } | null;
    images: Array<{ url: string; altText: string }>;
  };
  let compatibleProducts: CompatibleProductItem[] = [];
  let compatHighlights: {
    slotType: string;
    compatibleWith: string;
    incompatibleWith: string;
    tips: string;
  } | null = null;

  if (spec) {
    if (spec.componentType === "RAM" && spec.ramGeneration) {
      compatHighlights = {
        slotType: `Ranura DIMM ${spec.ramGeneration}`,
        compatibleWith: `Placas madre con ranuras ${spec.ramGeneration} (ej. Sockets AMD AM4 como ASUS A520M, MSI B550M, ASRock B450M, e Intel LGA1200 / LGA1700 DDR4).`,
        incompatibleWith: `Incompatible con placas DDR5 (ej. Sockets AMD AM5 / B650) ni ranuras compactas de laptop (SO-DIMM).`,
        tips: `Si tienes una placa AM4 (como A520 o B550), esta memoria es 100% compatible y activa su velocidad con el perfil XMP/DOCP en BIOS.`,
      };
      compatibleProducts = await prisma.product.findMany({
        where: {
          isPublished: true,
          compatibilitySpec: { componentType: "MOTHERBOARD", ramGeneration: spec.ramGeneration },
        },
        take: 3,
        include: { brand: true, category: true, images: { take: 1 } },
      });
    } else if (spec.componentType === "CPU" && spec.socket) {
      compatHighlights = {
        slotType: `Socket ${spec.socket}`,
        compatibleWith: `Placas madre con socket ${spec.socket} (chipsets compatibles) y memoria ${spec.ramGeneration ?? "RAM DDR4/DDR5"}.`,
        incompatibleWith: `Incompatible con placas de otro socket (ej. ${spec.socket === "AM4" ? "AM5 o Intel LGA" : "AM4"}).`,
        tips: `Requiere disipador compatible con anclaje ${spec.socket} y fuente según el consumo de tu tarjeta de video.`,
      };
      compatibleProducts = await prisma.product.findMany({
        where: {
          isPublished: true,
          compatibilitySpec: { componentType: "MOTHERBOARD", socket: spec.socket },
        },
        take: 3,
        include: { brand: true, category: true, images: { take: 1 } },
      });
    } else if (spec.componentType === "MOTHERBOARD" && spec.socket) {
      compatHighlights = {
        slotType: `Socket ${spec.socket} · Memorias ${spec.ramGeneration ?? "DDR4/DDR5"}`,
        compatibleWith: `Procesadores con socket ${spec.socket} y módulos de memoria RAM ${spec.ramGeneration ?? ""}.`,
        incompatibleWith: `Incompatible con procesadores de diferente socket ni módulos RAM de otra generación.`,
        tips: `Formato ${spec.formFactor ?? "Micro-ATX"}: encaja en cualquier gabinete Micro-ATX o ATX estándar.`,
      };
      compatibleProducts = await prisma.product.findMany({
        where: {
          isPublished: true,
          compatibilitySpec: { componentType: "CPU", socket: spec.socket },
        },
        take: 3,
        include: { brand: true, category: true, images: { take: 1 } },
      });
    } else if (spec.componentType === "GPU") {
      compatHighlights = {
        slotType: `Ranura PCIe x16 (Fuente recomendada: ${spec.recommendedPsuWatts ?? 550}W)`,
        compatibleWith: `Cualquier placa madre moderna con puerto PCI Express x16.`,
        incompatibleWith: `Fuentes de poder genéricas o de potencia inferior a ${spec.recommendedPsuWatts ?? 550}W.`,
        tips: `Largo aproximado: ${spec.gpuLengthMm ?? 250} mm. Verifica que tu gabinete no tenga bahías frontales que obstruyan.`,
      };
      compatibleProducts = await prisma.product.findMany({
        where: {
          isPublished: true,
          compatibilitySpec: {
            componentType: "PSU",
            psuWatts: { gte: spec.recommendedPsuWatts ?? 550 },
          },
        },
        take: 3,
        include: { brand: true, category: true, images: { take: 1 } },
      });
    }
  }

  return (
    <div className="ct-container py-8 space-y-12">
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/catalogo" className="inline-flex items-center gap-1 hover:underline" style={{ color: "var(--accent-cyan)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al catálogo
        </Link>
        <span>/</span>
        <Link href={`/catalogo?category=${product.category.slug}`} className="hover:underline">
          {product.category.name}
        </Link>
        <span>/</span>
        <span>{product.sku}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Product gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div
            className="rounded-2xl border aspect-[4/3] flex items-center justify-center p-6 relative"
            style={{ backgroundColor: "var(--bg-card-media)", borderColor: "var(--border-subtle)" }}
          >
            {primaryImg ? (
              <img
                src={primaryImg.url}
                alt={primaryImg.altText}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Sin imagen disponible
              </span>
            )}
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded text-xs font-medium border"
              style={{
                backgroundColor: "color-mix(in srgb, var(--bg-chassis) 88%, transparent)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {primaryImg?.isIllustrative !== false
                ? "Imagen ilustrativa de categoría"
                : "Fotografía verificada del modelo"}
            </span>
          </div>
          {primaryImg?.author && (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Crédito fotográfico: {primaryImg.author} · {primaryImg.license} ·{" "}
              <Link href="/creditos" className="underline">
                Ver atribución completa
              </Link>
            </p>
          )}
        </div>

        {/* Info & purchase */}
        <div className="lg:col-span-6 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold uppercase tracking-wider" style={{ color: "var(--accent-cyan)" }}>
                {product.brand.name}
              </span>
              <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                SKU: {product.sku}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{product.name}</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Modelo: {product.model}
            </p>
          </div>

          <div className="flex items-baseline gap-4 py-3 border-y" style={{ borderColor: "var(--border-subtle)" }}>
            <span className="font-heading text-3xl font-extrabold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
              {formatBsCompact(activePrice)}
            </span>
            {product.promoPriceCents && product.promoPriceCents < product.priceCents && (
              <span className="text-sm line-through tabular-nums" style={{ color: "var(--text-muted)" }}>
                {formatBsCompact(product.priceCents)}
              </span>
            )}
            <span
              className="ml-auto text-xs font-semibold px-2.5 py-1 rounded tabular-nums"
              style={{
                backgroundColor: stockAvailable > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                color: stockAvailable > 0 ? "var(--status-ok)" : "var(--status-danger)",
              }}
            >
              {stockAvailable > 0 ? `${stockAvailable} unidad(es) disponibles` : "Agotado temporalmente"}
            </span>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {product.description}
          </p>

          <ProductDetailActions
            product={{
              id: product.id,
              slug: product.slug,
              sku: product.sku,
              name: product.name,
              categorySlug: product.category.slug,
              categoryName: product.category.name,
              imageUrl: primaryImg?.url ?? null,
              priceCents: activePrice,
              stockAvailable,
            }}
            whatsappNumber={settings.whatsappNumber}
          />

          {/* Warranty & Delivery conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div
              className="rounded-xl border p-3.5 text-xs space-y-1"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <ShieldCheck className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                Garantía registrada
              </div>
              <p style={{ color: "var(--text-secondary)" }}>
                {product.warrantyMonths
                  ? `${product.warrantyMonths} meses. ${product.warrantyTerms ?? ""}`
                  : product.warrantyTerms ?? "Sin garantía extendida configurada."}
              </p>
            </div>
            <div
              className="rounded-xl border p-3.5 text-xs space-y-1"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Truck className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
                Entrega en Potosí
              </div>
              <p style={{ color: "var(--text-secondary)" }}>
                Recojo coordinado en Potosí o entrega en zonas habilitadas (otras zonas sujetas a cotización).
              </p>
            </div>
          </div>

          {/* Verified Specifications Visual Grid */}
          <div
            className="rounded-2xl border p-4 sm:p-5 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--accent-cyan-soft)",
                    borderColor: "var(--border-strong)",
                    color: "var(--accent-cyan)",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
                    Ficha Técnica y Especificaciones Verificadas
                  </h2>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {product.brand.name} · {product.category.name} · SKU {product.sku}
                  </p>
                </div>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  borderColor: "rgba(16, 185, 129, 0.35)",
                  color: "var(--status-ok)",
                }}
              >
                {Object.keys(specs).length} atributos técnicos
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(specs).map(([k, v]) => {
                const { Icon, accent, bg, border } = getSpecCardMeta(k);
                return (
                  <div
                    key={k}
                    className="rounded-xl border p-3 flex items-start gap-3"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: bg, borderColor: border, color: accent }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        {k}
                      </dt>
                      <dd className="font-bold text-xs sm:text-sm mt-0.5 break-words" style={{ color: "var(--text-primary)" }}>
                        {v}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>

      {/* COMPATIBILIDAD DIRECTA CLARA Y CONCISA */}
      {compatHighlights && (
        <section
          className="rounded-2xl border p-6 space-y-5"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: "var(--accent-cyan-soft)", color: "var(--accent-cyan)" }}>
                <Cpu className="w-3.5 h-3.5" />
                Guía Técnica Rápida
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold">
                Compatibilidad Directa — ¿Con qué funciona este componente?
              </h2>
            </div>

            <a
              href={`https://wa.me/59167605477?text=${encodeURIComponent(
                `Hola ClickTech (+591 67605477). Quiero consultar si este producto ${product.name} (SKU: ${product.sku}) es compatible con mi PC actual.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ct-btn h-10 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 shrink-0 self-start sm:self-auto"
              style={{
                borderColor: "#25D366",
                color: "#25D366",
                backgroundColor: "rgba(37, 211, 102, 0.08)",
              }}
            >
              <MessageCircle className="w-4 h-4 fill-emerald-500" />
              Consultar compatibilidad al WhatsApp (67605477)
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Compatible */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.06)",
                borderColor: "rgba(16, 185, 129, 0.3)",
              }}
            >
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--status-ok)" }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Compatible con</span>
              </div>
              <p className="leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {compatHighlights.compatibleWith}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Tipo de conector / ranura: <strong>{compatHighlights.slotType}</strong>.
              </p>
            </div>

            {/* Incompatible */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{
                backgroundColor: "rgba(244, 63, 94, 0.06)",
                borderColor: "rgba(244, 63, 94, 0.3)",
              }}
            >
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--status-danger)" }}>
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Incompatible con</span>
              </div>
              <p className="leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {compatHighlights.incompatibleWith}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Evita adquirir o forzar estas combinaciones para no dañar los pines ni los puertos.
              </p>
            </div>

            {/* Practical Advice */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--accent-purple)" }}>
                <Cpu className="w-4 h-4 shrink-0" />
                <span>Consejo del taller técnico</span>
              </div>
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {compatHighlights.tips}
              </p>
              <div className="pt-2">
                <Link
                  href="/arma-tu-pc"
                  className="font-bold underline text-[11px] inline-flex items-center gap-1"
                  style={{ color: "var(--accent-cyan)" }}
                >
                  Probar en el configurador «Arma tu PC» <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Compatible matching products currently in catalog */}
          {compatibleProducts.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-heading font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Componentes compatibles disponibles en tienda para armar de inmediato:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {compatibleProducts.map((cp) => (
                  <Link
                    key={cp.id}
                    href={`/producto/${cp.slug}`}
                    className="ct-card rounded-xl border p-3 flex items-center gap-3 transition-transform hover:scale-[1.01]"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-lg p-1 shrink-0 flex items-center justify-center border" style={{ backgroundColor: "var(--bg-card-media)", borderColor: "var(--border-subtle)" }}>
                      {cp.images[0] ? (
                        <img src={cp.images[0].url} alt={cp.name} className="w-full h-full object-contain" />
                      ) : (
                        <Cpu className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--accent-cyan)" }}>
                        {cp.category?.name ?? "Componente"}
                      </p>
                      <h4 className="font-semibold text-xs truncate" title={cp.name} style={{ color: "var(--text-primary)" }}>
                        {cp.name}
                      </h4>
                      <p className="text-xs font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                        {formatBsCompact(cp.promoPriceCents ?? cp.priceCents)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-bold">Otros modelos en {product.category.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
            {related.map((r) => (
              <ProductCard
                key={r.id}
                product={{
                  id: r.id,
                  sku: r.sku,
                  slug: r.slug,
                  name: r.name,
                  model: r.model,
                  brandName: r.brand.name,
                  categorySlug: r.category.slug,
                  categoryName: r.category.name,
                  imageUrl: r.images[0]?.url ?? null,
                  imageAlt: r.images[0]?.altText ?? r.name,
                  isIllustrative: r.images[0]?.isIllustrative ?? true,
                  priceCents: r.priceCents,
                  promoPriceCents: r.promoPriceCents,
                  promoLabel: r.promoLabel,
                  stockAvailable: getAvailableStock(r),
                  socket: r.compatibilitySpec?.socket ?? null,
                  ramGeneration: r.compatibilitySpec?.ramGeneration ?? null,
                  isPrebuiltPc: r.isPrebuiltPc,
                  shortSpecsJson: (r.shortSpecsJson as Record<string, string> | null) ?? null,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
