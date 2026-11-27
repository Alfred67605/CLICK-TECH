"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { ShieldCheck, X } from "lucide-react";
import { useUISound } from "@/hooks/useUISound";
import { ADMIN_GROUPS, type AdminNavItem, type AdminTab } from "@/components/admin/admin-nav";
import type { Role } from "@prisma/client";

gsap.registerPlugin(Flip, useGSAP);

interface AdminSidebarProps {
  items: AdminNavItem[];
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  userRole: Role;
  userName: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  badges?: Partial<Record<AdminTab, number>>;
}

export function AdminSidebar({
  items,
  activeTab,
  onSelectTab,
  userRole,
  userName,
  mobileOpen,
  onCloseMobile,
  badges,
}: AdminSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const { playClick, playHover } = useUISound();

  useGSAP(
    () => {
      if (!flipStateRef.current || !sidebarRef.current) return;
      const state = flipStateRef.current;
      flipStateRef.current = null;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const activePill = sidebarRef.current.querySelector("[data-flip-id='admin-nav-active']");
      if (!activePill) return;

      Flip.from(state, {
        targets: activePill,
        duration: 0.34,
        ease: "power3.out",
        absolute: true,
        nested: true,
      });
    },
    { scope: sidebarRef, dependencies: [activeTab] }
  );

  function handleSelect(nextTab: AdminTab) {
    if (nextTab === activeTab) {
      onCloseMobile();
      return;
    }
    if (sidebarRef.current) {
      const currentPill = sidebarRef.current.querySelector("[data-flip-id='admin-nav-active']");
      if (currentPill) {
        flipStateRef.current = Flip.getState(currentPill);
      }
    }
    playClick();
    onSelectTab(nextTab);
    onCloseMobile();
  }

  const sidebarBody = (
    <div
      ref={sidebarRef}
      className="rounded-[20px] border p-4 flex flex-col gap-5"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Identity Header inside Sidebar */}
      <div
        className="flex items-center justify-between gap-2 pb-3 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "var(--accent-cyan-soft)",
              borderColor: "var(--border-strong)",
              color: "var(--accent-cyan)",
            }}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {userName}
            </p>
            <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
              Rol {userRole}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-sound="none"
          onClick={() => {
            playClick();
            onCloseMobile();
          }}
          aria-label="Cerrar menú administrativo"
          className="lg:hidden h-8 w-8 rounded-lg border flex items-center justify-center"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--bg-chassis)",
            color: "var(--text-secondary)",
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grouped Navigation */}
      <nav aria-label="Módulos administrativos" className="space-y-5">
        {ADMIN_GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div key={group} className="space-y-1.5">
              <p
                className="px-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {group}
              </p>
              <div className="space-y-1">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  const count = badges?.[item.id];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-sound="none"
                      aria-current={active ? "page" : undefined}
                      onClick={() => handleSelect(item.id)}
                      onPointerEnter={() => playHover()}
                      className="ct-btn relative w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 text-left transition-colors"
                      style={{
                        color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                      }}
                    >
                      {active && (
                        <span
                          data-flip-id="admin-nav-active"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl border"
                          style={{
                            backgroundColor: "var(--accent-cyan-soft)",
                            borderColor: "var(--border-strong)",
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                        <Icon
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: active ? "var(--accent-cyan)" : "var(--text-muted)",
                          }}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof count === "number" && count > 0 && (
                        <span
                          className="relative z-10 px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums"
                          style={{
                            backgroundColor: active
                              ? "var(--bg-surface)"
                              : "var(--bg-chassis)",
                            color: active ? "var(--accent-cyan)" : "var(--text-muted)",
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-20 self-start">
        {sidebarBody}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navegación administrativa"
        >
          <div
            className="ct-backdrop fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div
            className="relative z-10 w-[85vw] max-w-xs h-full overflow-y-auto p-3"
            style={{ backgroundColor: "var(--bg-chassis)" }}
          >
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
}
