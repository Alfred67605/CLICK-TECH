"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export default function RecuperarPage() {
  const router = useRouter();
  const { notify } = useStore();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Error solicitando código.", "error");
        return;
      }
      if (data.devPreviewCode) setDevPreviewCode(data.devPreviewCode);
      notify(data.message, "info");
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Código inválido.", "error");
        return;
      }
      notify(data.message, "success");
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl font-bold flex items-center justify-center gap-2">
          <KeyRound className="w-6 h-6" style={{ color: "var(--accent-cyan)" }} />
          Recuperar Acceso
        </h1>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          En entorno local sin servidor SMTP configurado, se utiliza el adaptador de desarrollo documentado.
        </p>
      </div>

      {step === 1 ? (
        <form
          onSubmit={requestCode}
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div>
            <label htmlFor="rec-email" className="block text-xs font-medium mb-1">
              Correo electrónico registrado
            </label>
            <input
              id="rec-email"
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
          <button
            type="submit"
            disabled={busy}
            className="ct-btn w-full h-11 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            {busy ? "Generando código..." : "Solicitar recuperación"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={resetPassword}
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          {devPreviewCode && (
            <div
              className="rounded-lg border p-3 text-xs"
              style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--status-warn)" }}
            >
              <strong>Adaptador local de desarrollo (sin correo real enviado):</strong> código temporal{" "}
              <code>{devPreviewCode}</code>
            </div>
          )}
          <div>
            <label htmlFor="rec-code" className="block text-xs font-medium mb-1">
              Código de verificación
            </label>
            <input
              id="rec-code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label htmlFor="rec-new-pass" className="block text-xs font-medium mb-1">
              Nueva contraseña (mínimo 8 caracteres)
            </label>
            <input
              id="rec-new-pass"
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            disabled={busy}
            className="ct-btn w-full h-11 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            {busy ? "Actualizando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}
