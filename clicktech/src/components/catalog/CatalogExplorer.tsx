"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu,
  Filter,
  HardDrive,
  Headphones,
  Laptop,
  Layers,
  Monitor,
  RotateCcw,
  Search,
  Sparkles,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/catalog/ProductCard";
import { CatalogCarousel } from "@/components/catalog/CatalogCarousel";

export interface CatalogItem extends ProductCardData {
  brandSlug: string;
  socket: string | null;
  ramGeneration: string | null;
}

export function CatalogExplorer({
  initialProducts,
  categories,
  brands,
  initialQuery,
  initialCategory,
}: {
  initialProducts: CatalogItem[];
  categories: Array<{ slug: string; name: string }>;
  brands: Array<{ slug: string; name: string }>;
  initialQuery: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("");
  const [socket, setSocket] = useState("");
  const [ramGen, setRamGen] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxBs, setMaxBs] = useState("");
  const [sort, setSort] = useState("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categoryIcons: Record<string, React.ReactNode> = {
    "pcs-armadas": <Sparkles className="w-4 h-4" />,
    "procesadores": <Cpu className="w-4 h-4" />,
    "tarjetas-graficas": <Zap className="w-4 h-4" />,
    "memorias-ram": <Cpu className="w-4 h-4" />,
    "almacenamiento": <HardDrive className="w-4 h-4" />,
    "placas-madre": <Layers className="w-4 h-4" />,
    "laptops": <Laptop className="w-4 h-4" />,
    "monitores": <Monitor className="w-4 h-4" />,
    "perifericos": <Headphones className="w-4 h-4" />,
    "fuentes": <Zap className="w-4 h-4" />,
    "gabinetes": <Layers className="w-4 h-4" />,
    "refrigeracion": <Wrench className="w-4 h-4" />,
    "accesorios": <Sparkles className="w-4 h-4" />,
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const maxCents = maxBs.trim() ? Math.round(Number(maxBs) * 100) : null;

    const list = initialProducts.filter((p) => {
      if (category && p.categorySlug !== category) return false;
      if (brand && p.brandSlug !== brand) return false;
      if (socket && p.socket !== socket) return false;
      if (ramGen && p.ramGeneration !== ramGen) return false;
      if (inStockOnly && p.stockAvailable <= 0) return false;
      const effectivePrice = p.promoPriceCents ?? p.priceCents;
      if (maxCents !== null && Number.isFinite(maxCents) && effectivePrice > maxCents) return false;
      if (query) {
        const hay = `${p.name} ${p.model} ${p.sku} ${p.brandName} ${p.categoryName}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    if (sort === "price-asc") {
      return [...list].sort(
        (a, b) => (a.promoPriceCents ?? a.priceCents) - (b.promoPriceCents ?? b.priceCents)
      );
    }
    if (sort === "price-desc") {
      return [...list].sort(
        (a, b) => (b.promoPriceCents ?? b.priceCents) - (a.promoPriceCents ?? a.priceCents)
      );
    }
    return list;
  }, [initialProducts, q, category, brand, socket, ramGen, inStockOnly, maxBs, sort]);

  function resetAll() {
    setQ("");
    setCategory("");
    setBrand("");
    setSocket("");
    setRamGen("");
    setInStockOnly(false);
    setMaxBs("");
    setSort("featured");
    router.replace("/catalogo");
  }

  const activeFiltersCount =
    (category ? 1 : 0) +
    (brand ? 1 : 0) +
    (socket ? 1 : 0) +
    (ramGen ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (maxBs ? 1 : 0);

  return (
    <div className="ct-container py-6 space-y-6">
      {/* Top Header Row - Minimalist & Full-Width */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Catálogo ClickTech
            </h1>
            <span
              className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--accent-cyan-soft)",
                borderColor: "var(--border-strong)",
                color: "var(--accent-cyan)",
              }}
            >
              {filtered.length} productos
            </span>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
            Equipos y componentes con disponibilidad real en Potosí y despacho verificado en Bolivianos (Bs).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3" style={{ color: "var(--text-muted)" }} />
            <input
              id="cat-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar GPU, Ryzen, laptop o SKU..."
              className="w-full h-10 pl-10 pr-10 rounded-xl border text-sm focus:outline-none"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            {q && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQ("")}
                className="ct-btn absolute right-3 top-3"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            data-sound="toggleOn"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden ct-btn h-10 px-4 rounded-xl border flex items-center gap-2 text-xs font-bold shrink-0"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: activeFiltersCount > 0 ? "var(--accent-cyan)" : "var(--border-subtle)",
              color: activeFiltersCount > 0 ? "var(--accent-cyan)" : "var(--text-primary)",
            }}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>
        </div>
      </div>

      {/* Full-Catalog Quick Showcase Carousel */}
      {!category && !q && <CatalogCarousel products={initialProducts} />}

      {/* Main Full-Width Split Layout */}
      <div className="flex flex-col lg:flex-row gap-7 items-start">
        {/* Left Sidebar / Filters */}
        <aside
          className={`w-full lg:w-72 xl:w-80 shrink-0 space-y-6 ${mobileFilterOpen ? "block" : "hidden lg:block"
            }`}
        >
          <div
            className="rounded-2xl border p-5 space-y-5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <Filter className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} /> Categorías
              </span>
              {category && (
                <button
                  type="button"
                  data-sound="toggleOff"
                  onClick={() => setCategory("")}
                  className="text-xs hover:underline font-semibold"
                  style={{ color: "var(--accent-cyan)" }}
                >
                  Ver todas
                </button>
              )}
            </div>

            {/* Accessible Select synchronized for keyboard & E2E */}
            <div className="lg:sr-only">
              <label htmlFor="cat-select">Categoría</label>
              <select
                id="cat-select"
                aria-label="Categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vertical Category Navigation */}
            <nav aria-label="Filtro lateral de productos" className="space-y-1">
              <button
                type="button"
                data-sound="toggleOn"
                onClick={() => setCategory("")}
                className="ct-btn w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border"
                style={
                  category === ""
                    ? {
                      backgroundColor: "var(--accent-cyan-soft)",
                      borderColor: "var(--border-strong)",
                      color: "var(--accent-cyan)",
                    }
                    : {
                      backgroundColor: "transparent",
                      borderColor: "transparent",
                      color: "var(--text-secondary)",
                    }
                }
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                  <span>Todos los productos</span>
                </span>
                <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {initialProducts.length}
                </span>
              </button>

              {categories.map((c) => {
                const isSelected = category === c.slug;
                const count = initialProducts.filter((p) => p.categorySlug === c.slug).length;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    data-sound={isSelected ? "toggleOff" : "toggleOn"}
                    onClick={() => setCategory(isSelected ? "" : c.slug)}
                    className="ct-btn w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border"
                    style={
                      isSelected
                        ? {
                          backgroundColor: "var(--accent-cyan-soft)",
                          borderColor: "var(--border-strong)",
                          color: "var(--accent-cyan)",
                        }
                        : {
                          backgroundColor: "transparent",
                          borderColor: "transparent",
                          color: "var(--text-secondary)",
                        }
                    }
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span style={{ color: isSelected ? "var(--accent-cyan)" : "var(--text-muted)" }}>
                        {categoryIcons[c.slug] || <Layers className="w-4 h-4" />}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-mono text-[11px] ml-2" style={{ color: "var(--text-muted)" }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Hardware Compatibility Quick Filters */}
            <div className="pt-4 border-t space-y-4" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="font-bold text-xs uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                Compatibilidad Técnica
              </span>

              <div className="space-y-3">
                <div>
                  <label htmlFor="socket-filter" className="block text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                    Socket de Procesador
                  </label>
                  <select
                    id="socket-filter"
                    value={socket}
                    onChange={(e) => setSocket(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border text-xs font-mono"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">Cualquier Socket</option>
                    <option value="AM4">Socket AM4 (Ryzen 5000)</option>
                    <option value="AM5">Socket AM5 (Ryzen 7000/8000)</option>
                    <option value="LGA1700">Intel LGA1700 (12ª-14ª)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ram-filter" className="block text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                    Generación de RAM
                  </label>
                  <select
                    id="ram-filter"
                    value={ramGen}
                    onChange={(e) => setRamGen(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border text-xs font-mono"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">Cualquier Generación</option>
                    <option value="DDR4">DDR4 (3200 / 3600 MHz)</option>
                    <option value="DDR5">DDR5 (5600+ MHz)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="brand-filter" className="block text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                    Marca
                  </label>
                  <select
                    id="brand-filter"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border text-xs"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">Todas las marcas</option>
                    {brands.map((b) => (
                      <option key={b.slug} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="max-price" className="block text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                    Precio máximo (Bs)
                  </label>
                  <input
                    id="max-price"
                    type="number"
                    min={0}
                    value={maxBs}
                    onChange={(e) => setMaxBs(e.target.value)}
                    placeholder="Sin límite"
                    className="w-full h-9 px-3 rounded-lg border text-xs tabular-nums"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#00E5FF] rounded"
                  />
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Solo disponibles
                  </span>
                </label>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                data-sound="close"
                onClick={resetAll}
                className="ct-btn w-full h-9 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar filtros ({activeFiltersCount})
              </button>
            )}
          </div>
        </aside>

        {/* Right Product Grid Stage - Expands to Full Screen */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Subheader Toolbar: Sorting & Active Filters */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span style={{ color: "var(--text-muted)" }}>Orden:</span>
              <select
                aria-label="Ordenar productos"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-8 px-2.5 rounded-lg border text-xs font-medium"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="featured">Destacados primero</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {filtered.length} de {initialProducts.length} mostrados
                </span>
                <button
                  type="button"
                  data-sound="close"
                  onClick={resetAll}
                  className="text-xs hover:underline flex items-center gap-1 font-semibold"
                  style={{ color: "var(--accent-cyan)" }}
                >
                  <RotateCcw className="w-3 h-3" /> Restablecer
                </button>
              </div>
            )}
          </div>

          {/* Product Grid */}
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl border p-12 text-center space-y-4"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div
                className="w-16 h-16 mx-auto rounded-full border flex items-center justify-center"
                style={{
                  backgroundColor: "var(--accent-cyan-soft)",
                  borderColor: "var(--border-strong)",
                  color: "var(--accent-cyan)",
                }}
              >
                <Filter className="w-8 h-8" />
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                No hay productos con esos filtros exactos.
              </p>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                Limpia los filtros o consulta la compatibilidad de tu equipo por WhatsApp al 67605477.
              </p>
              <button
                type="button"
                onClick={resetAll}
                className="ct-btn ct-btn-primary h-11 px-6 rounded-xl text-sm font-bold"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                Ver todos los productos ({initialProducts.length})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
