"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cpu,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  User,
  Wrench,
  X,
  Building2,
  ClipboardList,
  ShieldCheck,
  Scale,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";

interface AuthUserSummary {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SALES" | "TECH" | "CUSTOMER";
}

export function SiteHeader({ initialUser }: { initialUser: AuthUserSummary | null }) {
  const router = useRouter();
  const {
    itemCount,
    setCartOpen,
    cartOpen,
    items,
    subtotalCents,
    updateCartQty,
    removeFromCart,
    compareItems,
    clearCompare,
    theme,
    toggleTheme,
  } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = initialUser;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
    setMobileMenuOpen(false);
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
      >
        Saltar al contenido principal
      </a>

      {/* Discrete demo notice & direct WhatsApp */}
      <div
        className="border-b text-xs py-1.5 px-4"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="ct-container flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
          <span>
            <strong>ClickTech Potosí:</strong> Hardware, armado de PCs y servicio técnico. Precios en Bs.{" "}
            <Link
              href="/politicas#pendientes"
              className="underline font-medium"
              style={{ color: "var(--accent-cyan)" }}
            >
              Políticas de entrega
            </Link>
          </span>
          <a
            href="https://wa.me/59167605477?text=Hola%20ClickTech%2C%20quisiera%20asesor%C3%ADa%20o%20servicio%20t%C3%A9cnico."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold hover:underline ml-auto"
            style={{ color: "#25D366" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WhatsApp directo: +591 67605477
          </a>
        </div>
      </div>

      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-chassis) 88%, transparent)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="ct-container h-16 flex items-center justify-between gap-3">
          {/* Brand logo — original asset preserved */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none"
            aria-label="ClickTech Inicio"
          >
            <img
              src="/brand/logo_trimmed.png"
              alt="ClickTech — Tecnología a tu medida"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md relative">
            <label htmlFor="header-search" className="sr-only">
              Buscar productos, marca, modelo o SKU
            </label>
            <input
              id="header-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar GPU, Ryzen, laptop o SKU..."
              className="w-full h-10 pl-3.5 pr-10 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              aria-label="Buscar en catálogo"
              className="ct-btn absolute right-1.5 top-1.5 h-7 w-7 rounded-md flex items-center justify-center"
              style={{ color: "var(--accent-cyan)" }}
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Primary navigation */}
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/catalogo"
              className="px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Catálogo
            </Link>
            <Link
              href="/arma-tu-pc"
              className="px-2.5 py-2 rounded-lg flex items-center gap-1.5 font-semibold"
              style={{ color: "var(--accent-cyan)", backgroundColor: "var(--accent-cyan-soft)" }}
            >
              <Cpu className="w-4 h-4" />
              Arma tu PC
            </Link>
            <Link
              href="/servicios"
              className="px-2.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Wrench className="w-4 h-4" />
              Servicios
            </Link>
            <Link
              href="/seguimiento"
              className="px-2.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              <ClipboardList className="w-4 h-4" />
              Seguimiento
            </Link>
            <Link
              href="/empresas"
              className="px-2.5 py-2 rounded-lg hidden xl:flex items-center gap-1.5 hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Building2 className="w-4 h-4" />
              Empresas
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/59167605477?text=Hola%20ClickTech%2C%20quisiera%20consultar%20sobre%20un%20producto%20o%20servicio."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp al 67605477"
              className="ct-btn hidden lg:flex items-center gap-1.5 h-10 px-3.5 rounded-lg border text-xs font-semibold hover:shadow-[0_0_16px_rgba(37,211,102,0.35)] transition-all"
              style={{
                borderColor: "#25D366",
                color: "#25D366",
                backgroundColor: "rgba(37, 211, 102, 0.08)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              WhatsApp: 67605477
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              className="ct-btn h-10 w-10 rounded-lg border flex items-center justify-center"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (user.role === "ADMIN" || user.role === "SALES" || user.role === "TECH") && (
              <Link
                href="/admin"
                className="ct-btn hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-lg border text-xs font-semibold"
                style={{
                  borderColor: "var(--accent-purple)",
                  backgroundColor: "var(--accent-purple-soft)",
                  color: "var(--text-primary)",
                }}
              >
                <ShieldCheck className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
                Panel {user.role}
              </Link>
            )}

            <Link
              href={user ? "/cuenta" : "/login"}
              aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
              className="ct-btn h-10 px-3 rounded-lg border flex items-center gap-2 text-sm font-medium"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            >
              <User className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
              <span className="hidden sm:inline max-w-[110px] truncate">
                {user ? user.name.split(" ")[0] : "Ingresar"}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito (${itemCount} productos)`}
              className="ct-btn relative h-10 px-3 rounded-lg flex items-center gap-2 text-sm font-semibold"
              style={{
                backgroundColor: "var(--accent-cyan)",
                color: "var(--accent-cyan-ink)",
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="tabular-nums">{itemCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="ct-btn md:hidden h-10 w-10 rounded-lg border flex items-center justify-center"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t px-4 py-4 space-y-3"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar hardware o SKU..."
                className="flex-1 h-11 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                className="ct-btn h-11 px-4 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                Buscar
              </button>
            </form>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <Link
                href="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg border"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                Catálogo
              </Link>
              <Link
                href="/arma-tu-pc"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg border font-semibold"
                style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
              >
                Arma tu PC
              </Link>
              <Link
                href="/servicios"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg border"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                Servicios Técnicos
              </Link>
              <Link
                href="/seguimiento"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg border"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                Seguimiento
              </Link>
              <Link
                href="/empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg border"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                Empresas B2B
              </Link>
              {user && (user.role === "ADMIN" || user.role === "SALES" || user.role === "TECH") && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-lg border font-semibold"
                  style={{ borderColor: "var(--accent-purple)", color: "var(--accent-purple)" }}
                >
                  Panel {user.role}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Comparison floating tray */}
      {compareItems.length > 0 && (
        <div
          className="fixed bottom-4 left-4 z-40 rounded-xl border p-3 shadow-2xl max-w-md w-[calc(100vw-2rem)] sm:w-auto"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-strong)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Scale className="w-4 h-4 shrink-0" style={{ color: "var(--accent-cyan)" }} />
              <span>
                Comparando {compareItems.length} {compareItems[0]?.categoryName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/comparar?ids=${compareItems.map((c) => c.id).join(",")}`}
                className="ct-btn px-3 py-1.5 rounded-md text-xs font-semibold"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                Comparar ({compareItems.length})
              </Link>
              <button
                type="button"
                onClick={clearCompare}
                aria-label="Limpiar comparación"
                className="ct-btn p-1.5 rounded-md border text-xs"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Carrito de compras">
          <div
            className="ct-backdrop fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setCartOpen(false)}
          />
          <aside
            className="ct-drawer relative z-10 w-full max-w-md h-full flex flex-col border-l shadow-2xl"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
                Tu Carrito ({itemCount})
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar carrito"
                className="ct-btn h-9 w-9 rounded-lg border flex items-center justify-center"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Tu carrito está vacío. Explora hardware o arma tu PC a medida.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Link
                      href="/catalogo"
                      onClick={() => setCartOpen(false)}
                      className="ct-btn px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                    >
                      Explorar catálogo
                    </Link>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border p-3 flex gap-3 items-start"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center p-1"
                      style={{ backgroundColor: "var(--bg-card-media)" }}
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/producto/${item.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="text-sm font-semibold hover:underline line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs mt-0.5 tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {item.sku} · {formatBs(item.unitPriceCents)} c/u
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                            aria-label="Disminuir cantidad"
                            className="ct-btn h-8 w-8 rounded border flex items-center justify-center"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                            aria-label="Aumentar cantidad"
                            className="ct-btn h-8 w-8 rounded border flex items-center justify-center"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                            {formatBs(item.lineTotalCents)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            aria-label="Eliminar del carrito"
                            className="ct-btn p-1.5 rounded hover:bg-white/5"
                            style={{ color: "var(--status-danger)" }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div
                className="p-4 border-t space-y-3"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-chassis)" }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Subtotal estimado (sin reserva)</span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                    {formatBs(subtotalCents)}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  El stock se reserva al confirmar tu pedido en el checkout.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/carrito"
                    onClick={() => setCartOpen(false)}
                    className="ct-btn h-11 rounded-lg border flex items-center justify-center text-sm font-semibold"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    Ver carrito
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="ct-btn h-11 rounded-lg flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                  >
                    Ir a checkout
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
