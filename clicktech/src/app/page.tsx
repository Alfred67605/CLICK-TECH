import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Headphones,
  MapPin,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { formatBsCompact } from "@/lib/domain/money";
import { ProductCard, type ProductCardData } from "@/components/catalog/ProductCard";
import { HyperFramesHeroPlayer } from "@/components/catalog/HyperFramesHeroPlayer";
import { PotosiRouteCalculator } from "@/components/maps/PotosiRouteCalculator";
import { BudgetBuildPreview, type PrebuiltPcSummary } from "@/components/home/BudgetBuildPreview";
import { FaqAccordion } from "@/components/home/FaqAccordion";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts, prebuiltPcs, services] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isPublished: true, isFeatured: true, isPrebuiltPc: false },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { name: true } },
        category: { select: { slug: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        compatibilitySpec: { select: { socket: true, ramGeneration: true } },
      },
    }),
    prisma.product.findMany({
      where: { isPublished: true, isPrebuiltPc: true },
      orderBy: { priceCents: "asc" },
      include: {
        brand: { select: { name: true } },
        category: { select: { slug: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        compatibilitySpec: { select: { socket: true, ramGeneration: true } },
      },
    }),
    prisma.serviceCatalog.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
  ]);

  const toCardData = (p: (typeof featuredProducts)[number]): ProductCardData => ({
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    model: p.model,
    brandName: p.brand.name,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.altText ?? p.name,
    isIllustrative: p.images[0]?.isIllustrative ?? true,
    priceCents: p.priceCents,
    promoPriceCents: p.promoPriceCents,
    promoLabel: p.promoLabel,
    stockAvailable: getAvailableStock(p),
    socket: p.compatibilitySpec?.socket ?? null,
    ramGeneration: p.compatibilitySpec?.ramGeneration ?? null,
    isPrebuiltPc: p.isPrebuiltPc,
    shortSpecsJson: (p.shortSpecsJson as Record<string, string> | null) ?? null,
  });

  const prebuiltData: PrebuiltPcSummary[] = prebuiltPcs.map((pc) => ({
    id: pc.id,
    slug: pc.slug,
    name: pc.name,
    description: pc.description,
    priceCents: pc.promoPriceCents ?? pc.priceCents,
    prebuiltTier: pc.prebuiltTier,
    imageUrl: pc.images[0]?.url ?? null,
    imageAlt: pc.images[0]?.altText ?? pc.name,
    specs: (pc.shortSpecsJson as Record<string, string> | null) ?? {},
    stockAvailable: getAvailableStock(pc),
  }));

  const faqs = [
    {
      q: "¿Cómo verifican que las piezas de mi PC sean compatibles?",
      a: "Nuestro configurador «Arma tu PC» evalúa socket, chipset, BIOS requerida, generación de RAM, holgura de gabinete y potencia de fuente. Si falta un dato físico exacto, marca revisión técnica antes de confirmar.",
    },
    {
      q: "¿Cuánto cuesta el mantenimiento si compré mi PC en ClickTech?",
      a: "La visita técnica y mantenimiento en Potosí es completamente gratuita (Bs 0) para clientes que adquirieron o armaron su equipo con nosotros. Para clientes externos aplicamos tarifas transparentes según zona.",
    },
    {
      q: "¿Cómo funcionan las entregas en Potosí y envíos nacionales?",
      a: "Puedes recoger sin costo en nuestro taller central en Potosí, pedir entrega a domicilio por zona o solicitar despacho seguro a cualquiera de los 9 departamentos con verificación antifraude.",
    },
    {
      q: "¿Pueden subir el precio de una reparación mientras revisan mi equipo?",
      a: "Nunca sin tu aprobación. Si surge algún repuesto o cambio de alcance, el sistema emite una nueva versión de cotización que debes aprobar explícitamente desde el seguimiento web.",
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-20 pb-14">
      {/* 1. HERO SHOWROOM */}
      <section
        className="relative border-b overflow-hidden ct-grid-bg"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="ct-container py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 ct-hero-enter">
            <h1
              className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]"
              style={{ color: "var(--text-primary)" }}
            >
              Tecnología a tu medida
            </h1>

            <p
              className="text-base sm:text-lg max-w-xl leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Hardware garantizado en Bolivianos, ensamblaje de PCs con compatibilidad verificada pieza por pieza y servicio técnico con trazabilidad real desde Potosí para toda Bolivia.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/catalogo"
                className="ct-btn ct-btn-primary ct-chassis-cut h-12 px-6 flex items-center gap-2 font-bold text-sm"
                style={{
                  backgroundColor: "var(--accent-cyan)",
                  color: "var(--accent-cyan-ink)",
                }}
              >
                Explorar productos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/arma-tu-pc"
                className="ct-btn h-12 px-6 rounded-xl border flex items-center gap-2 font-semibold text-sm"
                style={{
                  borderColor: "var(--accent-purple)",
                  backgroundColor: "var(--accent-purple-soft)",
                  color: "var(--text-primary)",
                }}
              >
                <Cpu className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
                Armar mi PC
              </Link>
              <Link
                href="/servicios"
                className="ct-btn h-12 px-5 rounded-xl border flex items-center gap-2 font-medium text-sm"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                }}
              >
                <Wrench className="w-4 h-4" />
                Servicio técnico
              </Link>
            </div>

            <div
              className="grid grid-cols-3 gap-4 pt-5 border-t text-xs"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div>
                <span className="font-heading font-bold text-sm block" style={{ color: "var(--text-primary)" }}>
                  Precios en Bs
                </span>
                <span style={{ color: "var(--text-muted)" }}>Stock real en Potosí</span>
              </div>
              <div>
                <span className="font-heading font-bold text-sm block" style={{ color: "var(--text-primary)" }}>
                  Compatibilidad
                </span>
                <span style={{ color: "var(--text-muted)" }}>Validación automática</span>
              </div>
              <div>
                <span className="font-heading font-bold text-sm block" style={{ color: "var(--status-ok)" }}>
                  Mantenimiento Bs 0
                </span>
                <span style={{ color: "var(--text-muted)" }}>Si compras tu PC aquí</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <HyperFramesHeroPlayer />
            <div className="grid grid-cols-2 gap-3">
              <div
                className="ct-card rounded-xl border overflow-hidden aspect-[16/9]"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
              >
                <img
                  src="/images/hero/hero-1.webp"
                  alt="PC gamer ensamblada con iluminación interior cian"
                  className="ct-zoom-media w-full h-full object-cover"
                />
              </div>
              <div
                className="ct-card rounded-xl border overflow-hidden aspect-[16/9]"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
              >
                <img
                  src="/images/hero/hero-2.webp"
                  alt="Tarjeta gráfica GeForce RTX de alto rendimiento"
                  className="ct-zoom-media w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIMULADOR INTERACTIVO DE PCS ARMADAS */}
      <BudgetBuildPreview pcs={prebuiltData} />

      {/* 3. ARQUITECTURA DE VALOR BENTO ASIMÉTRICA */}
      <section className="ct-container space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Ingeniería transparente de principio a fin
            </h2>
            <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Cada compra o servicio técnico en ClickTech cuenta con verificación previa, precios fijos en Bolivianos y respaldo directo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <Link
            href="/arma-tu-pc"
            className="ct-card md:col-span-7 rounded-2xl border p-6 flex flex-col justify-between gap-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--accent-cyan-soft)",
                  borderColor: "var(--border-strong)",
                  color: "var(--accent-cyan)",
                }}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-cyan)" }}>
                Abrir configurador <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Cero piezas incompatibles al armar tu equipo
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Validamos socket, generación DDR4/DDR5, BIOS requerida, longitud física de gráfica, holgura de gabinete y potencia real de fuente antes de que reserves stock.
              </p>
            </div>
          </Link>

          <Link
            href="/servicios"
            className="ct-card md:col-span-5 rounded-2xl border p-6 flex flex-col justify-between gap-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.14)",
                  borderColor: "rgba(16, 185, 129, 0.35)",
                  color: "var(--status-ok)",
                }}
              >
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--status-ok)" }}>
                Atención técnica
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Soporte gratuito para tu PC ClickTech
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Quienes arman o compran su computadora aquí reciben mantenimiento y visitas en Potosí a Bs 0, con seguimiento de orden en tiempo real.
              </p>
            </div>
          </Link>

          <Link
            href="/seguimiento"
            className="ct-card md:col-span-5 rounded-2xl border p-6 flex flex-col justify-between gap-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--accent-purple-soft)",
                  borderColor: "var(--accent-purple)",
                  color: "var(--accent-purple)",
                }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--accent-purple)" }}>
                Cotización por versión
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Garantías y costos aprobados por ti
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Ningún técnico modifica el presupuesto sin tu aprobación previa en el portal de seguimiento y código único de ticket.
              </p>
            </div>
          </Link>

          <Link
            href="#calculador-potosi"
            className="ct-card md:col-span-7 rounded-2xl border p-6 flex flex-col justify-between gap-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--accent-cyan-soft)",
                  borderColor: "var(--border-strong)",
                  color: "var(--accent-cyan)",
                }}
              >
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-cyan)" }}>
                <MapPin className="w-3.5 h-3.5" /> Potosí y los 9 departamentos
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Entregas locales en Potosí y envíos nacionales verificados
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Calcula tu ruta y tarifa en Potosí con Google Maps o solicita envío interdepartamental con verificación antifraude por cédula y llamada directa.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. CATEGORÍAS VISUALES CON FOTOS HD */}
      <section className="ct-container space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Explora por categoría
          </h2>
          <Link
            href="/catalogo"
            className="ct-btn text-sm font-semibold flex items-center gap-1.5 hover:underline"
            style={{ color: "var(--accent-cyan)" }}
          >
            Ver todo el catálogo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogo?category=${cat.slug}`}
              className="ct-card rounded-2xl border overflow-hidden flex flex-col"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div
                className="aspect-[16/10] w-full flex items-center justify-center p-2.5 overflow-hidden"
                style={{ backgroundColor: "var(--bg-card-media)" }}
              >
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={`Categoría ${cat.name}`}
                    loading="lazy"
                    className="ct-zoom-media w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <h3 className="font-heading font-semibold text-xs sm:text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {cat.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-cyan)" }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. PRODUCTOS DESTACADOS */}
      <section className="ct-container space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Componentes y equipos destacados
          </h2>
          <Link
            href="/catalogo"
            className="ct-btn text-sm font-semibold flex items-center gap-1.5 hover:underline"
            style={{ color: "var(--accent-cyan)" }}
          >
            Ver catálogo completo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={toCardData(p)} />
          ))}
        </div>
      </section>

      {/* 6. SERVICIOS TÉCNICOS CON FOTOS HD */}
      <section className="ct-container space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Servicios técnicos con orden y seguimiento
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Desde diagnóstico y pasta térmica hasta soporte para pequeñas empresas en Potosí.
            </p>
          </div>
          <Link
            href="/servicios"
            className="ct-btn h-10 px-4 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 shrink-0"
            style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
          >
            Solicitar servicio técnico
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
          {services.map((srv) => (
            <Link
              key={srv.id}
              href={`/servicios?service=${srv.slug}`}
              className="ct-card rounded-2xl border overflow-hidden flex flex-col justify-between"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              {srv.imageUrl && (
                <div className="aspect-[16/9] w-full overflow-hidden" style={{ backgroundColor: "var(--bg-card-media)" }}>
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    loading="lazy"
                    className="ct-zoom-media w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                      {srv.pricingType === "FIXED" && srv.basePriceCents
                        ? formatBsCompact(srv.basePriceCents)
                        : "Sujeto a diagnóstico"}
                    </span>
                    <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                      ~{srv.estimatedDurationHours}h
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                    {srv.name}
                  </h3>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {srv.description}
                  </p>
                </div>
                <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: "var(--accent-cyan)" }}>
                  Registrar solicitud <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. COBERTURA, MAPA Y CALCULADOR DE RUTAS EN POTOSÍ */}
      <section id="calculador-potosi" className="ct-container space-y-4">
        <PotosiRouteCalculator />
      </section>

      {/* 8. FAQ ACORDEÓN & B2B */}
      <section className="ct-container space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Preguntas frecuentes
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Respuestas directas sobre compatibilidad, envíos y garantías.
          </p>
        </div>

        <FaqAccordion items={faqs} />

        <div
          className="rounded-2xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-strong)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Headphones className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              ¿Necesitas equipar una oficina, aula o institución en Potosí?
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              Registra una solicitud B2B por cantidades con cotización versionada y seguimiento comercial.
            </p>
          </div>
          <Link
            href="/empresas"
            className="ct-btn h-11 px-5 rounded-xl text-sm font-semibold shrink-0 flex items-center gap-2"
            style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Cotización B2B
          </Link>
        </div>
      </section>
    </div>
  );
}
