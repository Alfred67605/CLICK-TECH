import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Headphones,
  Layers,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { formatBsCompact } from "@/lib/domain/money";
import { ProductCard, type ProductCardData } from "@/components/catalog/ProductCard";
import { HyperFramesHeroPlayer } from "@/components/catalog/HyperFramesHeroPlayer";
import { PotosiRouteCalculator } from "@/components/maps/PotosiRouteCalculator";

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

  const faqs = [
    {
      q: "¿Cómo verifican que las piezas de mi PC sean compatibles?",
      a: "Nuestro configurador «Arma tu PC» evalúa socket, chipset y versión de BIOS requerida, generación y cantidad de RAM, formato del gabinete, longitud de tarjeta gráfica, altura del disipador y potencia/conectores de la fuente. Cuando falta un dato físico exacto, marca «Requiere revisión técnica» antes de confirmar.",
    },
    {
      q: "¿Cómo funcionan las entregas y el recojo en Potosí?",
      a: "Puedes elegir recojo coordinado en Potosí o entrega en las zonas habilitadas en la ciudad. Para zonas sin tarifa definida puedes solicitar cotización de envío en el mismo checkout.",
    },
    {
      q: "¿Qué pasa si subo mi comprobante de pago por transferencia o QR?",
      a: "Subir el comprobante registra el pago para revisión manual. Un integrante autorizado valida la operación antes de confirmar el despacho, manteniendo separados los estados de pedido, pago y entrega.",
    },
    {
      q: "¿Pueden subir el precio de una reparación mientras revisan mi equipo?",
      a: "No sin tu aprobación. Si durante el mantenimiento o reparación surge un repuesto adicional o cambio de alcance, el sistema genera una nueva versión de cotización que debes aprobar antes de continuar.",
    },
  ];

  return (
    <div className="space-y-20 pb-12">
      {/* 1. HERO: Hardware real + Pieza HyperFrames + Acciones */}
      <section
        className="relative border-b overflow-hidden ct-mesh-gradient"
        style={{
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="ct-container py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-5 ct-hero-enter">
            <p className="text-xs font-semibold tracking-widest uppercase flex items-center gap-2" style={{ color: "var(--accent-cyan)" }}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              ClickTech · Potosí, Bolivia
            </p>
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight ct-text-gradient-cyan">
              Tecnología a tu medida
            </h1>
            <p className="text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Más que tecnología, es tu pasión. Venta de hardware garantizado, armado de PCs con compatibilidad verificada según presupuesto y servicio técnico con seguimiento transparente en Potosí y toda Bolivia.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm" style={{ backgroundColor: "rgba(0, 229, 255, 0.08)", borderColor: "rgba(0, 229, 255, 0.3)", color: "var(--accent-cyan)" }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Garantía Real 24 Meses
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.3)", color: "var(--status-ok)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Stock Físico en Potosí
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm" style={{ backgroundColor: "rgba(139, 92, 246, 0.08)", borderColor: "rgba(139, 92, 246, 0.3)", color: "var(--accent-purple)" }}>
                <Sparkles className="w-3.5 h-3.5" /> Despacho a todo Bolivia
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/catalogo"
                className="ct-btn ct-chassis-cut h-12 px-6 flex items-center gap-2 font-semibold text-sm"
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
                className="ct-btn h-12 px-6 rounded-lg border flex items-center gap-2 font-semibold text-sm"
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
                className="ct-btn h-12 px-5 rounded-lg border flex items-center gap-2 font-medium text-sm"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <Wrench className="w-4 h-4" />
                Solicitar soporte
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t text-xs" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <span className="font-semibold block" style={{ color: "var(--text-primary)" }}>
                  Precios en Bs
                </span>
                <span style={{ color: "var(--text-muted)" }}>Desglose pieza por pieza</span>
              </div>
              <div>
                <span className="font-semibold block" style={{ color: "var(--text-primary)" }}>
                  Reglas verificables
                </span>
                <span style={{ color: "var(--text-muted)" }}>Revisión técnica si falta un dato</span>
              </div>
              <div>
                <span className="font-semibold block" style={{ color: "var(--text-primary)" }}>
                  Postventa integrada
                </span>
                <span style={{ color: "var(--text-muted)" }}>Garantías y seguimiento web</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <HyperFramesHeroPlayer />
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border overflow-hidden aspect-[16/9]"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
              >
                <img
                  src="/images/hero/hero-1.webp"
                  alt="PC gamer ensamblada con iluminación interior cian y morada"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="rounded-xl border overflow-hidden aspect-[16/9]"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
              >
                <img
                  src="/images/hero/hero-2.webp"
                  alt="Tarjeta gráfica GeForce RTX de tres ventiladores"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PUNTOS DE DOLOR (ACTIVIDAD 5) + RECORRIDO ESCUCHAR -> PROPONER -> RESOLVER -> ACOMPAÑAR */}
      <section className="ct-container space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">
              Escuchar, proponer, resolver y acompañar
            </h2>
            <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Cada proceso de ClickTech está conectado para darte claridad desde la cotización inicial hasta el soporte posterior en Potosí.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/arma-tu-pc"
            className="ct-card rounded-xl border p-5 space-y-2.5"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <Sparkles className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--accent-cyan)" }}>
                01 · Escuchar
              </span>
            </div>
            <h3 className="font-heading font-bold text-base">Presupuesto limitado</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Asesor por presupuesto en Bs y plan de mejoras por etapas para no pagar de más ni quedar limitado a futuro.
            </p>
          </Link>

          <Link
            href="/arma-tu-pc"
            className="ct-card rounded-xl border p-5 space-y-2.5"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <Layers className="w-5 h-5" style={{ color: "var(--accent-purple)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--accent-purple)" }}>
                02 · Proponer
              </span>
            </div>
            <h3 className="font-heading font-bold text-base">Piezas incompatibles</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Reglas verificables de socket, BIOS, RAM, chasis, holgura de GPU y fuente. Los datos faltantes pasan a revisión técnica.
            </p>
          </Link>

          <Link
            href="/servicios"
            className="ct-card rounded-xl border p-5 space-y-2.5"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <Wrench className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--accent-cyan)" }}>
                03 · Resolver
              </span>
            </div>
            <h3 className="font-heading font-bold text-base">Lentitud y fallas</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Diagnóstico real, mantenimiento o reparación con orden técnica persistente, repuestos trazables y pruebas de cierre.
            </p>
          </Link>

          <Link
            href="/seguimiento"
            className="ct-card rounded-xl border p-5 space-y-2.5"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <ShieldCheck className="w-5 h-5" style={{ color: "var(--accent-purple)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--accent-purple)" }}>
                04 · Acompañar
              </span>
            </div>
            <h3 className="font-heading font-bold text-base">Costos y seguimiento claros</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Cotizaciones versionadas aceptadas por ti, línea de tiempo en vivo, garantías registradas y consultas postventa.
            </p>
          </Link>
        </div>
      </section>

      {/* 3. CATEGORÍAS VISUALES */}
      <section className="ct-container space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Explora por categoría</h2>
          <Link href="/catalogo" className="text-sm font-semibold hover:underline" style={{ color: "var(--accent-cyan)" }}>
            Ver todo el catálogo
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogo?category=${cat.slug}`}
              className="ct-card rounded-xl border overflow-hidden flex flex-col"
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
              <div className="p-3">
                <h3 className="font-heading font-semibold text-sm">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PCS ARMADAS POR USO Y PRESUPUESTO */}
      <section className="ct-container space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">PCs armadas según uso y presupuesto</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Configuraciones base listas para comprar o adaptar en el configurador sin costos ocultos.
            </p>
          </div>
          <Link href="/arma-tu-pc" className="text-sm font-semibold hover:underline" style={{ color: "var(--accent-cyan)" }}>
            Personalizar en Arma tu PC
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prebuiltPcs.map((pc) => {
            const specs = (pc.shortSpecsJson ?? {}) as Record<string, string>;
            const img = pc.images[0];
            return (
              <article
                key={pc.id}
                className="ct-card rounded-2xl border overflow-hidden flex flex-col"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <div
                  className="aspect-[16/10] p-4 flex items-center justify-center relative"
                  style={{ backgroundColor: "var(--bg-card-media)" }}
                >
                  {img && (
                    <img
                      src={img.url}
                      alt={img.altText}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  )}
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded text-xs font-semibold"
                    style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
                  >
                    {pc.prebuiltTier === "INICIAL"
                      ? "Gamer Inicial"
                      : pc.prebuiltTier === "EQUILIBRADA"
                      ? "Gamer Equilibrada"
                      : "Estudio y Trabajo"}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <h3 className="font-heading text-lg font-bold">{pc.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {pc.description}
                  </p>
                  <ul className="space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {Object.entries(specs)
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <li key={k} className="flex justify-between gap-2 border-b py-1" style={{ borderColor: "var(--border-subtle)" }}>
                          <span>{k}</span>
                          <span className="font-medium text-right" style={{ color: "var(--text-primary)" }}>
                            {v}
                          </span>
                        </li>
                      ))}
                  </ul>
                  <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                    <span className="font-heading text-xl font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                      {formatBsCompact(pc.priceCents)}
                    </span>
                    <Link
                      href={`/producto/${pc.slug}`}
                      className="ct-btn h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                      style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. PRODUCTOS DESTACADOS (REJILLA EXPANDIDA A TODA LA PANTALLA) */}
      <section className="ct-container space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Componentes y equipos destacados</h2>
          <Link href="/catalogo" className="text-sm font-semibold hover:underline" style={{ color: "var(--accent-cyan)" }}>
            Ver catálogo completo
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={toCardData(p)} />
          ))}
        </div>
      </section>

      {/* 6. SERVICIOS TÉCNICOS Y B2B */}
      <section className="ct-container space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">Servicios técnicos con orden y seguimiento</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Desde diagnóstico y pasta térmica hasta soporte para pequeñas empresas en Potosí.
            </p>
          </div>
          <Link
            href="/servicios"
            className="ct-btn h-10 px-4 rounded-lg border text-sm font-semibold inline-flex items-center gap-2 shrink-0"
            style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
          >
            Solicitar servicio técnico
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="rounded-xl border p-5 flex flex-col justify-between gap-3"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase" style={{ color: "var(--accent-cyan)" }}>
                    {srv.pricingType === "FIXED" && srv.basePriceCents
                      ? formatBsCompact(srv.basePriceCents)
                      : "Sujeto a diagnóstico"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ~{srv.estimatedDurationHours} h est.
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base">{srv.name}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {srv.description}
                </p>
              </div>
              <Link
                href={`/servicios?service=${srv.slug}`}
                className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--accent-cyan)" }}
              >
                Registrar solicitud <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 7. COBERTURA, MAPA Y CALCULADOR DE RUTAS EN POTOSÍ */}
      <section id="calculador-potosi" className="ct-container space-y-4">
        <PotosiRouteCalculator />
      </section>

      {/* 8. FAQ & TRANSPARENCIA */}
      <section className="ct-container space-y-6">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center">Preguntas frecuentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-xl border p-5 space-y-2"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <h3 className="font-heading font-semibold text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent-cyan)" }} />
                {f.q}
              </h3>
              <p className="text-xs leading-relaxed pl-6" style={{ color: "var(--text-secondary)" }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
        >
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
              <Headphones className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              ¿Necesitas equipar una oficina, aula o institución en Potosí?
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              Registra una solicitud B2B por cantidades con cotización versionada y seguimiento comercial.
            </p>
          </div>
          <Link
            href="/empresas"
            className="ct-btn h-11 px-5 rounded-lg text-sm font-semibold shrink-0 flex items-center gap-2"
            style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
          >
            Cotización B2B
          </Link>
        </div>
      </section>
    </div>
  );
}
