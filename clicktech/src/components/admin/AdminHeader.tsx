"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Menu,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useUISound } from "@/hooks/useUISound";
import type { AdminNavItem } from "@/components/admin/admin-nav";
import type { Role } from "@prisma/client";

interface AdminHeaderProps {
  activeItem: AdminNavItem;
  userRole: Role;
  canSeeFinance: boolean;
  onRefresh: () => void;
  onOpenMobileMenu: () => void;
}

export function AdminHeader({
  activeItem,
  userRole,
  canSeeFinance,
  onRefresh,
  onOpenMobileMenu,
}: AdminHeaderProps) {
  const { enabled: soundEnabled, toggleSound, playClick, playTransition } = useUISound();

  return (
    <header className="rounded-[20px] border border-white/10 bg-[#0B0F1A] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
      <div className="space-y-1.5 min-w-0">
        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Link
            href="/"
            data-sound="none"
            onClick={playClick}
            className="hover:text-white transition-colors"
          >
            ClickTech
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span>Panel de Gestión</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400">{activeItem.group}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-semibold text-[#00E5FF]">{activeItem.label}</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-sound="none"
            onClick={() => {
              playClick();
              onOpenMobileMenu();
            }}
            aria-label="Abrir menú del panel"
            className="lg:hidden h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-200 shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Panel de Gestión
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Operación ClickTech · Rol: {userRole}
            </p>
          </div>
        </div>
      </div>

      {/* Header Actions: Audio Toggle, Refresh, Primary CTA */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          data-sound="none"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? "Silenciar sonidos del panel" : "Activar sonidos del panel"}
          className={`ct-btn h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            soundEnabled
              ? "border-cyan-400/35 bg-cyan-400/10 text-[#00E5FF]"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? "Sonido ON" : "Silenciado"}</span>
        </button>

        <button
          type="button"
          data-sound="none"
          onClick={() => {
            playTransition();
            onRefresh();
          }}
          className="ct-btn h-10 px-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar datos</span>
        </button>

        <a
          href="/api/admin/reports?format=csv"
          data-sound="none"
          onClick={playTransition}
          className="ct-btn ct-btn-primary h-10 px-4 rounded-xl bg-[#00E5FF] text-[#02040A] text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{canSeeFinance ? "Exportar CSV" : "Reporte CSV"}</span>
        </a>
      </div>
    </header>
  );
}
