"use client"

import * as React from "react"
import {
  Bird,
  CircleDollarSign,
  Scale,
  Skull,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format"
import type { Batch, BatchMetrics } from "@/lib/types"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

export interface KpiCardsProps {
  batch: Batch
  metrics: BatchMetrics
}

interface Kpi {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  tone: "primary" | "muted" | "danger" | "success"
  /** Colorear el valor (no el icono) según signo, p.e. utilidad */
  valueTone?: "auto" | "default" | "danger"
}

export function KpiCards({ batch, metrics }: KpiCardsProps) {
  const kpis: Kpi[] = [
    {
      label: "Población actual",
      value: formatNumber(metrics.currentPopulation),
      sub: `de ${formatNumber(batch.initialCount)} iniciales`,
      icon: Bird,
      tone: "primary",
    },
    {
      label: "Mortalidad",
      value: formatPercent(metrics.mortalityRate),
      sub: `${formatNumber(metrics.totalMortality)} aves`,
      icon: Skull,
      tone: metrics.mortalityRate >= 10 ? "danger" : "muted",
    },
    {
      label: "Gastos totales",
      value: formatMoney(metrics.totalExpenses),
      sub: `${metrics.expenseCount} registros`,
      icon: TrendingDown,
      tone: "muted",
    },
    {
      label: "Ingresos totales",
      value: formatMoney(metrics.totalIncome),
      sub: `${metrics.saleCount} ventas`,
      icon: TrendingUp,
      tone: "success",
    },
    {
      label: "Utilidad",
      value: formatMoney(metrics.profit),
      sub: "Ingresos − Gastos",
      icon: CircleDollarSign,
      tone: metrics.profit >= 0 ? "success" : "danger",
      valueTone: "auto",
    },
    {
      label: "Último peso",
      value:
        metrics.lastWeighing != null
          ? `${formatNumber(metrics.lastWeighing)} g`
          : "—",
      sub: `${metrics.weighingCount} pesajes`,
      icon: Scale,
      tone: "muted",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((k) => (
        <KpiCard key={k.label} kpi={k} />
      ))}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon
  const iconWrapClass =
    kpi.tone === "primary"
      ? "bg-primary/10 text-primary"
      : kpi.tone === "success"
        ? "bg-primary/10 text-primary"
        : kpi.tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"

  const valueClass =
    kpi.valueTone === "auto"
      ? kpi.tone === "danger"
        ? "text-destructive"
        : "text-primary"
      : kpi.tone === "danger"
        ? "text-destructive"
        : "text-foreground"

  return (
    <Card className="py-0 transition-shadow hover:shadow-sm">
      <CardContent className="flex flex-col gap-2 px-4 py-4">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              iconWrapClass
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {kpi.label}
          </span>
        </div>
        <div>
          <p
            className={cn(
              "text-xl font-bold tabular-nums leading-tight",
              valueClass
            )}
          >
            {kpi.value}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {kpi.sub}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
