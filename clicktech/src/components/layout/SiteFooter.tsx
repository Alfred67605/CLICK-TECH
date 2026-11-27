import Link from "next/link";
import type { PublicBusinessSettings } from "@/lib/domain/business-config";

export function SiteFooter({ settings }: { settings: PublicBusinessSettings }) {
  return (
    <footer
      className="border-t mt-20"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-secondary)",
      }}
    >
      <div className="ct-container py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div className="space-y-3">
          <img
            src="/brand/logo_trimmed.png"
            alt="ClickTech"
            className="h-10 w-auto object-contain"
          />
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Tecnología a tu medida · Potosí, Bolivia
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Hardware garantizado, armado con compatibilidad verificada y soporte técnico con seguimiento transparente.
          </p>
        </div>

        <div className="space-y-2.5">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Tienda y Soluciones
          </h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/catalogo" className="hover:underline">Catálogo completo</Link></li>
            <li><Link href="/arma-tu-pc" className="hover:underline">Configurador Arma tu PC</Link></li>
            <li><Link href="/servicios" className="hover:underline">Servicios técnicos y citas</Link></li>
            <li><Link href="/seguimiento" className="hover:underline">Seguimiento de órdenes</Link></li>
            <li><Link href="/empresas" className="hover:underline">Atención B2B / Instituciones</Link></li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Contacto y Cobertura
          </h3>
          <ul className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <li>Ciudad base: <strong style={{ color: "var(--text-primary)" }}>{settings.city}</strong></li>
            <li>
              WhatsApp directo:{" "}
              <a
                href="https://wa.me/59167605477?text=Hola%20ClickTech%2C%20quisiera%20hacer%20una%20consulta."
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline"
                style={{ color: "#25D366" }}
              >
                +591 67605477
              </a>
            </li>
            <li>
              Taller central:{" "}
              {settings.physicalAddress ? settings.physicalAddress : "Recojo coordinado en Potosí"}
            </li>
            <li>Horarios: {settings.businessHours}</li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Transparencia y Accesos
          </h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/politicas" className="hover:underline">Garantías, envíos y políticas</Link></li>
            <li><Link href="/creditos" className="hover:underline">Información y créditos</Link></li>
            <li><Link href="/login" className="hover:underline">Acceso clientes y equipo</Link></li>
          </ul>
          <p className="text-xs pt-1" style={{ color: "var(--text-muted)" }}>
            Precios oficiales expresados en Bolivianos (Bs).
          </p>
        </div>
      </div>

      <div
        className="border-t py-4 px-4 text-center text-xs"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
      >
        ClickTech Potosí, Bolivia · Hardware, Ensamblaje a Medida y Servicio Técnico Especializado ·{" "}
        <Link href="/politicas" className="underline">Garantías y cobertura</Link>
      </div>
    </footer>
  );
}
