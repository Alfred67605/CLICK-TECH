"use client";

import React, { useId, useSyncExternalStore } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

const emptySubscribe = () => () => {};

interface AdminKpiCardProps {
  label: string;
  value: string | number;
  deltaLabel: string;
  trend: "up" | "down" | "neutral";
  accentColor?: string;
  icon: React.ReactNode;
  sparkline: Array<{ v: number }>;
}

export function AdminKpiCard({
  label,
  value,
  deltaLabel,
  trend,
  accentColor = "#00E5FF",
  icon,
  sparkline,
}: AdminKpiCardProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const gradId = useId().replace(/:/g, "");

  const badgeStyles =
    trend === "up"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : trend === "down"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-white/5 text-slate-300 border-white/10";

  return (
    <article className="admin-stagger-item rounded-[20px] border border-white/10 bg-[#0E1424] p-5 flex flex-col justify-between gap-3 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-slate-400 leading-snug">
          {label}
        </span>
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-slate-300">
          {icon}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
        <p className="font-heading text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-white whitespace-nowrap">
          {value}
        </p>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold tabular-nums shrink-0 ${badgeStyles}`}
        >
          {trend === "up" && <TrendingUp className="w-3 h-3" />}
          {trend === "down" && <TrendingDown className="w-3 h-3" />}
          <span>{deltaLabel}</span>
        </span>
      </div>

      <div className="h-12 w-full min-w-0 pt-1">
        {mounted && sparkline.length > 0 ? (
          <ResponsiveContainer width="100%" height={44}>
            <AreaChart data={sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accentColor}
                strokeWidth={2}
                fill={`url(#spark-${gradId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-11 w-full rounded-lg bg-white/[0.03]" />
        )}
      </div>
    </article>
  );
}
