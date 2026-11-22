"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Cpu,
  Filter,
  HardDrive,
  Headphones,
  Laptop,
  Layers,
  Monitor,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/catalog/ProductCard";

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

  const categoryIcons: Record<string, React.ReactNode> = {
    "pcs-armadas": <Sparkles className="w-3.5 h-3.5" />,
    "procesadores": <Cpu className="w-3.5 h-3.5" />,
    "tarjetas-graficas": <Zap className="w-3.5 h-3.5" />,
    "memorias-ram": <Cpu className="w-3.5 h-3.5" />,
    "almacenamiento": <HardDrive className="w-3.5 h-3.5" />,
    "placas-madre": <Layers className="w-3.5 h-3.5" />,
    "laptops": <Laptop className="w-3.5 h-3.5" />,
    "monitores": <Monitor className="w-3.5 h-3.5" />,
    "perifericos": <Headphones className="w-3.5 h-3.5" />,
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

  return (
    <div className="ct-container py-8 space-y-8">
      {/* High-Tech HUD Header */}
      <div className="relative rounded-2xl border p-6 sm:p-8 overflow-hidden ct-mesh-gradient" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border" style={{ backgroundColor: "rgba(0, 229, 255, 0.08)", borderColor: "rgba(0, 229, 255, 0.3)", color: "var(--accent-cyan)" }}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              ClickTech Hardware Hub · Potosí, Bolivia
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Catálogo de Equipos y Componentes
            </h1>
            
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Hardware 100% verificado en Bolivianos (Bs) con existencias reales en Potosí. Compatibilidad garantizada, fotos reales en alta definición y despacho seguro a los 9 departamentos.
            </p>

            {/* Micro-telemetry bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              <span className="inline-flex items-center gap-1.5 text-cyan-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Stock en tiempo real
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Garantía oficial con boleta/factura
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Mantenimiento Bs 0 en compras de PC
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-2 shrink-0">
            <div className="px-4 py-2 rounded-xl border font-mono text-sm font-bold flex items-center gap-2 shadow-sm" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--accent-cyan)" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{filtered.length} modelo(s) disponibles</span>
            </div>
            {filtered.length !== initialProducts.length && (
              <button
                type="button"
                onClick={resetAll}
                className="text-xs hover:underline flex items-center gap-1 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <RotateCcw className="w-3 h-3" /> Ver todos los {initialProducts.length} productos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Category Launcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`ct-btn shrink-0 h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all ${
            category === ""
              ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
              : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Todos ({initialProducts.length})</span>
        </button>
        {categories.map((c) => {
          const isSelected = category === c.slug;
          const count = initialProducts.filter((p) => p.categorySlug === c.slug).length;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(isSelected ? "" : c.slug)}
              className={`ct-btn shrink-0 h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all ${
                isSelected
                  ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                  : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
              }`}
            >
              {categoryIcons[c.slug] || <Layers className="w-3.5 h-3.5" />}
              <span>{c.name}</span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced HUD Filters toolbar */}
      <section
        aria-label="Filtros de catálogo"
        className="rounded-2xl border p-5 sm:p-6 space-y-5"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search bar with glowing focus */}
          <div className="lg:col-span-2 relative">
            <label htmlFor="cat-search" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Buscar nombre, modelo o SKU
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3" style={{ color: "var(--text-muted)" }} />
              <input
                id="cat-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej. RTX 4060, Ryzen, NVMe, DDR4..."
                className="w-full h-10 pl-10 pr-12 rounded-xl border text-sm transition-all focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.2)] focus:outline-none"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 pointer-events-none">
                Ctrl K
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="cat-select" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Categoría
            </label>
            <select
              id="cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border text-sm focus:border-cyan-400 focus:outline-none"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brand-select" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Marca
            </label>
            <select
              id="brand-select"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border text-sm focus:border-cyan-400 focus:outline-none"
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
            <label htmlFor="max-bs" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Precio máx. (Bs)
            </label>
            <input
              id="max-bs"
              type="number"
              min={0}
              value={maxBs}
              onChange={(e) => setMaxBs(e.target.value)}
              placeholder="Sin tope"
              className="w-full h-10 px-3 rounded-xl border text-sm tabular-nums focus:border-cyan-400 focus:outline-none"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label htmlFor="sort-select" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Ordenar por
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border text-sm focus:border-cyan-400 focus:outline-none"
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
        </div>

        {/* Technical filters and actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t text-xs" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]" style={{ color: "var(--accent-cyan)" }}>
              <Filter className="w-3.5 h-3.5" /> Filtros de Compatibilidad:
            </span>

            <select
              aria-label="Filtrar por socket"
              value={socket}
              onChange={(e) => setSocket(e.target.value)}
              className="h-9 px-3 rounded-xl border text-xs font-mono font-medium focus:border-cyan-400 focus:outline-none"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">Socket: Cualquiera</option>
              <option value="AM4">Socket AM4 (Ryzen 5000/3000)</option>
              <option value="AM5">Socket AM5 (Ryzen 7000/8000)</option>
              <option value="LGA1700">Socket LGA1700 (Intel 12/13/14ª)</option>
            </select>

            <select
              aria-label="Filtrar por generación de RAM"
              value={ramGen}
              onChange={(e) => setRamGen(e.target.value)}
              className="h-9 px-3 rounded-xl border text-xs font-mono font-medium focus:border-cyan-400 focus:outline-none"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">RAM: Cualquiera</option>
              <option value="DDR4">RAM DDR4 (3200/3600 MHz)</option>
              <option value="DDR5">RAM DDR5 (5600+ MHz)</option>
            </select>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none h-9 px-3 rounded-xl border font-medium transition-all" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#00E5FF] rounded"
              />
              <span className="text-xs">Solo con stock inmediato</span>
            </label>
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="ct-btn h-9 px-4 rounded-xl border inline-flex items-center gap-2 text-xs font-bold transition-all active:scale-95"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer filtros
          </button>
        </div>
      </section>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center space-y-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Filter className="w-8 h-8" />
          </div>
          <p className="text-lg font-bold text-white">No encontramos productos con esos filtros exactos.</p>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            Intenta limpiar los filtros o dinos qué pieza buscas mediante WhatsApp directo al 67605477.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="ct-btn h-11 px-6 rounded-xl text-sm font-bold shadow-lg"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            Ver todos los productos ({initialProducts.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
