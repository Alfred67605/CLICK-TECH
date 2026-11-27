"use client";

import React, { useMemo, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUISound } from "@/hooks/useUISound";
import { formatBs, formatBsCompact } from "@/lib/domain/money";
import { SERVICE_STATUS_LABELS } from "@/lib/domain/service-rules";
import type { ServiceOrderStatus } from "@prisma/client";

const emptySubscribe = () => () => { };

const DONUT_COLORS = [
  "#00E5FF",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#38BDF8",
  "#F43F5E",
];

interface OrderPointSource {
  id: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
}

interface ServicePointSource {
  id: string;
  status: ServiceOrderStatus;
  createdAt: string;
}

interface AdminAnalyticsChartsProps {
  canSeeFinance: boolean;
  periodDays: 7 | 30 | 90 | 365;
  onChangePeriod: (days: 7 | 30 | 90 | 365) => void;
  ordersInPeriod: OrderPointSource[];
  serviceOrders: ServicePointSource[];
  categoryChartData: Array<{ category: string; cents: number }>;
  serviceChartData: Array<{ status: string; count: number }>;
  drillCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  drillServiceStatus: string | null;
  onSelectServiceStatus: (status: string | null) => void;
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--bg-elevated)",
  border: "1px solid var(--border-strong)",
  borderRadius: "12px",
  color: "var(--text-primary)",
  fontSize: "12px",
  boxShadow: "var(--shadow-elevated)",
};

export function AdminAnalyticsCharts({
  canSeeFinance,
  periodDays,
  onChangePeriod,
  ordersInPeriod,
  serviceOrders,
  categoryChartData,
  serviceChartData,
  drillCategory,
  onSelectCategory,
  drillServiceStatus,
  onSelectServiceStatus,
}: AdminAnalyticsChartsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { playClick, playTransition } = useUISound();

  const areaSeries = useMemo(() => {
    const bucketMap = new Map<string, { label: string; ingresoBs: number; actividad: number }>();

    if (canSeeFinance) {
      for (const o of ordersInPeriod) {
        const d = new Date(o.createdAt);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        const label = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        const entry = bucketMap.get(key) ?? { label, ingresoBs: 0, actividad: 0 };
        if (o.paymentStatus === "APPROVED") {
          entry.ingresoBs += Math.round(o.totalCents / 100);
        }
        entry.actividad += 1;
        bucketMap.set(key, entry);
      }
    } else {
      for (const s of serviceOrders) {
        const d = new Date(s.createdAt);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        const label = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        const entry = bucketMap.get(key) ?? { label, ingresoBs: 0, actividad: 0 };
        entry.actividad += 1;
        bucketMap.set(key, entry);
      }
    }

    const sorted = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, val]) => val);

    if (sorted.length === 1) {
      return [{ label: "Inicio", ingresoBs: 0, actividad: 0 }, ...sorted];
    }
    return sorted;
  }, [canSeeFinance, ordersInPeriod, serviceOrders]);

  const barData = useMemo(
    () =>
      categoryChartData.map((row) => ({
        category: row.category,
        shortName: row.category.length > 14 ? `${row.category.slice(0, 13)}…` : row.category,
        bs: Math.round(row.cents / 100),
        cents: row.cents,
      })),
    [categoryChartData]
  );

  const donutData = useMemo(
    () =>
      serviceChartData.map((row, idx) => ({
        status: row.status,
        label: SERVICE_STATUS_LABELS[row.status as ServiceOrderStatus] ?? row.status,
        count: row.count,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      })),
    [serviceChartData]
  );

  const periodOptions: Array<{ days: 7 | 30 | 90 | 365; label: string }> = [
    { days: 7, label: "7D" },
    { days: 30, label: "30D" },
    { days: 90, label: "90D" },
    { days: 365, label: "1A" },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Area Chart Card with Pill Period Filters */}
      <section
        className="admin-stagger-item rounded-[20px] border p-5 space-y-4"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              className="font-heading font-bold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              {canSeeFinance
                ? "Evolución de ingresos y flujo de pedidos"
                : "Flujo de órdenes técnicas recibidas"}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {canSeeFinance
                ? "Ingresos cobrados en Bolivianos (Bs) y volumen operativo por fecha."
                : "Actividad de recepción y diagnóstico de equipos."}
            </p>
          </div>

          <div
            role="group"
            aria-label="Filtro de período"
            className="inline-flex items-center gap-1 p-1 rounded-full border self-start sm:self-auto"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--bg-chassis)",
            }}
          >
            {periodOptions.map((opt) => {
              const active = periodDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  data-sound="none"
                  onClick={() => {
                    playClick();
                    playTransition();
                    onChangePeriod(opt.days);
                  }}
                  className="ct-btn h-8 px-3.5 rounded-full text-xs font-semibold transition-colors"
                  style={
                    active
                      ? {
                        backgroundColor: "var(--accent-cyan)",
                        color: "var(--accent-cyan-ink)",
                      }
                      : { color: "var(--text-muted)" }
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[250px] w-full min-w-0">
          {!mounted ? (
            <div className="h-full w-full rounded-xl" style={{ backgroundColor: "var(--bg-chassis)" }} />
          ) : areaSeries.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>
              Sin movimientos registrados en los últimos {periodDays} días.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaSeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminAreaCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => (canSeeFinance ? `Bs ${v}` : `${v}`)}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val) => {
                    const num = Number(val ?? 0);
                    return canSeeFinance
                      ? [formatBsCompact(num * 100), "Cobrado"]
                      : [`${num}`, "Órdenes"];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={canSeeFinance ? "ingresoBs" : "actividad"}
                  stroke="var(--accent-cyan)"
                  strokeWidth={2.5}
                  fill="url(#adminAreaCyan)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 2. Bar Chart + Donut Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {canSeeFinance && (
          <section
            className="admin-stagger-item lg:col-span-7 rounded-[20px] border p-5 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2
                  className="font-heading font-bold text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  Ventas cobradas por categoría
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Haz clic en una barra para inspeccionar los pedidos incluidos.
                </p>
              </div>
              {drillCategory && (
                <button
                  type="button"
                  data-sound="none"
                  onClick={() => {
                    playClick();
                    onSelectCategory(null);
                  }}
                  className="text-xs font-semibold hover:underline shrink-0"
                  style={{ color: "var(--accent-cyan)" }}
                >
                  Quitar filtro
                </button>
              )}
            </div>

            <div className="h-[260px] w-full min-w-0">
              {!mounted ? (
                <div className="h-full w-full rounded-xl" style={{ backgroundColor: "var(--bg-chassis)" }} />
              ) : barData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>
                  Sin ventas cobradas en este período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `Bs ${v}`}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--accent-cyan-soft)" }}
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(_val, _name, item) => {
                        const cents = (item?.payload as { cents?: number })?.cents ?? 0;
                        return [formatBs(cents), "Total cobrado"];
                      }}
                    />
                    <Bar
                      dataKey="bs"
                      radius={[8, 8, 2, 2]}
                      isAnimationActive={false}
                      onClick={(entry) => {
                        const cat = (entry as unknown as { category?: string })?.category;
                        if (cat) {
                          playClick();
                          onSelectCategory(drillCategory === cat ? null : cat);
                        }
                      }}
                    >
                      {barData.map((row) => (
                        <Cell
                          key={row.category}
                          cursor="pointer"
                          fill={
                            !drillCategory || drillCategory === row.category
                              ? "#0284C7"
                              : "rgba(2, 132, 199, 0.28)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        )}

        {/* Donut Chart: Service Orders by Status */}
        <section
          className={`admin-stagger-item ${canSeeFinance ? "lg:col-span-5" : "lg:col-span-12"
            } rounded-[20px] border p-5 space-y-4`}
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                className="font-heading font-bold text-base"
                style={{ color: "var(--text-primary)" }}
              >
                Órdenes de servicio por estado
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Selecciona un estado para ver sus tickets.
              </p>
            </div>
            {drillServiceStatus && (
              <button
                type="button"
                data-sound="none"
                onClick={() => {
                  playClick();
                  onSelectServiceStatus(null);
                }}
                className="text-xs font-semibold hover:underline shrink-0"
                style={{ color: "var(--accent-purple)" }}
              >
                Ver todos
              </button>
            )}
          </div>

          {donutData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>
              Sin órdenes de servicio registradas.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-6 h-[220px] w-full min-w-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height={215}>
                    <PieChart>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(val, _name, item) => [
                          `${val} orden(es)`,
                          (item?.payload as { label?: string })?.label ?? "",
                        ]}
                      />
                      <Pie
                        data={donutData}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={3}
                        stroke="none"
                        isAnimationActive={false}
                        onClick={(entry) => {
                          const st = (entry as unknown as { status?: string })?.status;
                          if (st) {
                            playClick();
                            onSelectServiceStatus(drillServiceStatus === st ? null : st);
                          }
                        }}
                      >
                        {donutData.map((entry) => (
                          <Cell
                            key={entry.status}
                            cursor="pointer"
                            fill={entry.color}
                            opacity={
                              !drillServiceStatus || drillServiceStatus === entry.status
                                ? 1
                                : 0.35
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-xl" style={{ backgroundColor: "var(--bg-chassis)" }} />
                )}
              </div>

              <div className="sm:col-span-6 space-y-1.5">
                {donutData.map((entry) => {
                  const selected = drillServiceStatus === entry.status;
                  return (
                    <button
                      key={entry.status}
                      type="button"
                      data-sound="none"
                      onClick={() => {
                        playClick();
                        onSelectServiceStatus(selected ? null : entry.status);
                      }}
                      className="ct-btn w-full px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-2 text-left"
                      style={{
                        borderColor: selected ? "var(--border-strong)" : "transparent",
                        backgroundColor: selected ? "var(--accent-cyan-soft)" : "transparent",
                        color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.label}</span>
                      </span>
                      <span
                        className="font-mono font-bold tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {entry.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
