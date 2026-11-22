"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CartItemClient {
  id: string;
  productId: string;
  sku: string;
  slug: string;
  name: string;
  model: string;
  brandName: string;
  categoryName: string;
  imageUrl: string | null;
  isIllustrative: boolean;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  stockAvailable: number;
}

export interface CompareItemClient {
  id: string;
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  priceCents: number;
}

interface ToastItem {
  id: string;
  message: string;
  tone: "info" | "success" | "error";
}

interface StoreContextValue {
  items: CartItemClient[];
  subtotalCents: number;
  itemCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateCartQty: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  compareItems: CompareItemClient[];
  toggleCompare: (item: CompareItemClient) => void;
  clearCompare: () => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  notify: (message: string, tone?: "info" | "success" | "error") => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemClient[]>([]);
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<CompareItemClient[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, tone: "info" | "success" | "error" = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setSubtotalCents(data.subtotalCents ?? 0);
      setItemCount(data.itemCount ?? 0);
    } catch {
      // ignore offline transient
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      void refreshCart();
      try {
        const savedCmp = localStorage.getItem("clicktech_compare");
        if (savedCmp) setCompareItems(JSON.parse(savedCmp));
        const savedFav = localStorage.getItem("clicktech_favorites");
        if (savedFav) setFavorites(JSON.parse(savedFav));
        const savedTheme = localStorage.getItem("clicktech_theme");
        if (savedTheme === "light" || savedTheme === "dark") {
          setTheme(savedTheme);
          document.documentElement.setAttribute("data-theme", savedTheme);
        }
      } catch {
        // ignore storage failure
      }
    });
    return () => {
      active = false;
    };
  }, [refreshCart]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("clicktech_theme", next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          notify(data.error ?? "No se pudo añadir al carrito.", "error");
          return false;
        }
        setItems(data.items ?? []);
        setSubtotalCents(data.subtotalCents ?? 0);
        setItemCount(data.itemCount ?? 0);
        setCartOpen(true);
        notify("Producto añadido al carrito.", "success");
        return true;
      } catch {
        notify("Error de conexión al actualizar el carrito.", "error");
        return false;
      }
    },
    [notify]
  );

  const updateCartQty = useCallback(
    async (productId: string, quantity: number) => {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Cantidad no disponible.", "error");
        return;
      }
      setItems(data.items ?? []);
      setSubtotalCents(data.subtotalCents ?? 0);
      setItemCount(data.itemCount ?? 0);
    },
    [notify]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setSubtotalCents(data.subtotalCents ?? 0);
        setItemCount(data.itemCount ?? 0);
        notify("Producto retirado del carrito.", "info");
      }
    },
    [notify]
  );

  const toggleCompare = useCallback(
    (item: CompareItemClient) => {
      setCompareItems((prev) => {
        const exists = prev.some((x) => x.id === item.id);
        let next: CompareItemClient[];
        if (exists) {
          next = prev.filter((x) => x.id !== item.id);
        } else {
          if (prev.length > 0 && prev[0].categorySlug !== item.categorySlug) {
            notify(
              `Solo puedes comparar productos de la misma categoría (${prev[0].categoryName}). Limpia la comparación actual para cambiar.`,
              "error"
            );
            return prev;
          }
          if (prev.length >= 4) {
            notify("Máximo 4 productos simultáneos en comparación.", "error");
            return prev;
          }
          next = [...prev, item];
          notify(`${item.name} agregado a comparación (${next.length}/4).`, "success");
        }
        try {
          localStorage.setItem("clicktech_compare", JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [notify]
  );

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    try {
      localStorage.removeItem("clicktech_compare");
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem("clicktech_favorites", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        items,
        subtotalCents,
        itemCount,
        cartOpen,
        setCartOpen,
        refreshCart,
        addToCart,
        updateCartQty,
        removeFromCart,
        compareItems,
        toggleCompare,
        clearCompare,
        favorites,
        toggleFavorite,
        theme,
        toggleTheme,
        notify,
      }}
    >
      {children}
      {/* Toast region — Emil Kowalski accessible stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="ct-toast pointer-events-auto rounded-lg border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor:
                t.tone === "error"
                  ? "var(--status-danger)"
                  : t.tone === "success"
                  ? "var(--accent-cyan)"
                  : "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
