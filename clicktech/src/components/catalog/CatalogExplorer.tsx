"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw, Search } from "lucide-react";
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
    <div className="ct-container py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Catálogo ClickTech</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Hardware y equipos en Bolivianos (Bs) con disponibilidad verificada (existencias menos reservas activas).
          </p>
        </div>
        <div className="text-sm font-medium tabular-nums" style={{ color: "var(--accent-cyan)" }}>
          {filtered.length} producto(s) encontrados
        </div>
      </div>

      {/* Filters toolbar */}
      <section
        aria-label="Filtros de catálogo"
        className="rounded-xl border p-4 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <label htmlFor="cat-search" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Buscar nombre, modelo o SKU
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: "var(--text-muted)" }} />
              <input
                id="cat-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej. RTX 4060, Ryzen, NVMe..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cat-select" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Categoría
            </label>
            <select
              id="cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg border text-sm"
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
            <label htmlFor="brand-select" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Marca
            </label>
            <select
              id="brand-select"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg border text-sm"
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
            <label htmlFor="max-bs" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Precio máximo (Bs)
            </label>
            <input
              id="max-bs"
              type="number"
              min={0}
              value={maxBs}
              onChange={(e) => setMaxBs(e.target.value)}
              placeholder="Sin límite"
              className="w-full h-10 px-3 rounded-lg border text-sm tabular-nums"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label htmlFor="sort-select" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Ordenar por
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg border text-sm"
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--text-muted)" }}>
              <Filter className="w-3.5 h-3.5" /> Atributos técnicos:
            </span>
            <select
              aria-label="Filtrar por socket"
              value={socket}
              onChange={(e) => setSocket(e.target.value)}
              className="h-9 px-2.5 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">Socket: Cualquiera</option>
              <option value="AM4">Socket AM4</option>
              <option value="AM5">Socket AM5</option>
              <option value="LGA1700">Socket LGA1700</option>
            </select>

            <select
              aria-label="Filtrar por generación de RAM"
              value={ramGen}
              onChange={(e) => setRamGen(e.target.value)}
              className="h-9 px-2.5 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">RAM: Cualquiera</option>
              <option value="DDR4">DDR4</option>
              <option value="DDR5">DDR5</option>
            </select>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none h-9 px-2">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#00E5FF]"
              />
              <span>Solo disponibles</span>
            </label>
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="ct-btn h-9 px-3 rounded-lg border inline-flex items-center gap-1.5 font-medium"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <p className="text-base font-semibold">No hay productos que coincidan con esos filtros.</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Prueba limpiar los filtros o consultar mediante nuestro asesor de presupuesto en «Arma tu PC».
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="ct-btn h-10 px-4 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            Mostrar todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
