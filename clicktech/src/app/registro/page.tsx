"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export default function RegistroPage() {
  const router = useRouter();
  const { notify } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo crear la cuenta.", "error");
        return;
      }
      notify("Cuenta creada e iniciada correctamente.", "success");
      router.push("/cuenta");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl font-bold">Crear Cuenta</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Guarda tus PCs armadas, consulta pedidos, aprueba cotizaciones y gestiona tus garantías.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div>
          <label htmlFor="reg-name" className="block text-xs font-medium mb-1">
            Nombre completo
          </label>
          <input
            id="reg-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border text-sm"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-xs font-medium mb-1">
            Correo electrónico
          </label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-phone" className="block text-xs font-medium mb-1">
            Teléfono / WhatsApp
          </label>
          <input
            id="reg-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border text-sm"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label htmlFor="reg-pass" className="block text-xs font-medium mb-1">
            Contraseña (mínimo 8 caracteres)
          </label>
          <input
            id="reg-pass"
            type="password"
            minLength={8}
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
          <UserPlus className="w-4 h-4" />
          {submitting ? "Registrando..." : "Registrarme"}
        </button>

        <p className="text-xs text-center pt-1">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline" style={{ color: "var(--accent-cyan)" }}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
