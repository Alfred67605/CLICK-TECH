"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export default function LoginPage() {
  const router = useRouter();
  const { notify } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Error al iniciar sesión.", "error");
        return;
      }
      notify(`Sesión iniciada como ${data.user.name}.`, "success");
      const target =
        data.user.role === "ADMIN" || data.user.role === "SALES" || data.user.role === "TECH"
          ? "/admin"
          : "/cuenta";
      router.push(target);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl font-bold">Iniciar Sesión</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Accede a tus pedidos, cotizaciones, garantías, órdenes técnicas o panel operativo.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div>
          <label htmlFor="login-email" className="block text-xs font-medium mb-1">
            Correo electrónico
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border text-sm"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label htmlFor="login-pass" className="block text-xs font-medium mb-1">
            Contraseña
          </label>
          <input
            id="login-pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border text-sm"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="ct-btn w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
        >
          <LogIn className="w-4 h-4" />
          {submitting ? "Verificando..." : "Ingresar"}
        </button>

        <div className="flex items-center justify-between text-xs pt-2">
          <Link href="/registro" className="underline" style={{ color: "var(--accent-cyan)" }}>
            Crear cuenta nueva
          </Link>
          <Link href="/recuperar" className="underline" style={{ color: "var(--text-secondary)" }}>
            Recuperar contraseña
          </Link>
        </div>
      </form>

      <div
        className="rounded-xl border p-4 text-xs space-y-1.5"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
      >
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Cuentas locales de demostración
        </p>
        <p>
          Por seguridad, no incorporamos una contraseña universal en el código fuente. Consulta las credenciales generadas por el seed en el archivo local{" "}
          <code>.dev-credentials.local</code> (excluido de publicación) para los roles{" "}
          <code>ADMIN</code>, <code>SALES</code>, <code>TECH</code> y <code>CUSTOMER</code>.
        </p>
      </div>
    </div>
  );
}
