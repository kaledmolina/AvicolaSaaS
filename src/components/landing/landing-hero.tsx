"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  ArrowRight,
  Bird,
  Loader2,
  Play,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDemoLogin } from "./use-demo-login"

// Curva de crecimiento de muestra para el preview (peso promedio en gramos).
const GROWTH_DATA = [
  { d: "Día 7", g: 95 },
  { d: "Día 14", g: 220 },
  { d: "Día 21", g: 480 },
  { d: "Día 28", g: 880 },
  { d: "Día 35", g: 1450 },
  { d: "Día 42", g: 1980 },
]

const KPI_TILES = [
  { label: "Población", value: "488", hint: "aves actuales" },
  { label: "Utilidad", value: "$3.150.000", hint: "COP" },
  { label: "Mortalidad", value: "2,4%", hint: "del lote" },
]

/**
 * Sección hero del landing: titular + CTAs a la izquierda y una tarjeta
 * de previsualización de producto (KPIs + curva de crecimiento) a la derecha.
 */
export function LandingHero() {
  const router = useRouter()
  const { demoLoading, handleDemo } = useDemoLogin()

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b"
    >
      {/* Fondo sutil naranja */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_0%,var(--primary)_0%,transparent_60%)] opacity-[0.08]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        {/* Columna izquierda */}
        <div className="flex flex-col items-start gap-6">
          <Badge className="bg-primary/10 text-primary">
            <Sparkles className="size-3.5" />
            Gestión avícola integral · Multi-usuario
          </Badge>

          <h1
            id="hero-title"
            className="text-4xl font-bold tracking-tight text-balance sm:text-5xl"
          >
            Controla tu granja avícola{" "}
            <span className="text-primary">de principio a fin</span>
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground text-pretty">
            Registra lotes, gastos, mortalidad, pesajes y ventas. Calcula la
            rentabilidad de cada lote en tiempo real y toma mejores decisiones
            para tu ciclo de engorde.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={handleDemo}
              disabled={demoLoading}
              className="h-11"
            >
              {demoLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Probar demo
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11"
              onClick={() => router.push("/?auth=1")}
            >
              Crear cuenta gratis
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p>Sin compromiso. La cuenta demo se reinicia en cada ingreso.</p>
            <p>
              Demo:{" "}
              <span className="font-medium text-foreground">
                demo@avicola.test
              </span>{" "}
              /{" "}
              <span className="font-medium text-foreground">demo123456</span>
            </p>
          </div>
        </div>

        {/* Columna derecha — preview de producto */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl"
          />
          <Card className="rotate-[-1deg] gap-0 p-0 shadow-xl transition-transform duration-300 hover:rotate-0">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Bird className="size-4" />
                  </span>
                  Galpón A — Lote 12
                </CardTitle>
                <Badge className="bg-primary/10 text-primary">Activo</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Día 38 · Ross 308 · 1.000 aves iniciales
              </p>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              {/* KPI tiles */}
              <div className="grid grid-cols-3 gap-2">
                {KPI_TILES.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-lg border bg-card p-3"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-foreground sm:text-base">
                      {kpi.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {kpi.hint}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mini chart */}
              <div className="mt-4 rounded-lg border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <TrendingUp className="size-3.5 text-primary" />
                    Curva de crecimiento
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    g / día
                  </span>
                </div>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={GROWTH_DATA}
                      margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="heroGrowth"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--primary)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--primary)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        cursor={{ stroke: "var(--border)" }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--popover)",
                          color: "var(--popover-foreground)",
                          fontSize: 12,
                        }}
                        labelFormatter={(label) => `${label}`}
                        formatter={(value) => [`${value} g`, "Peso prom."]}
                      />
                      <Area
                        type="monotone"
                        dataKey="g"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        fill="url(#heroGrowth)"
                        dot={false}
                        activeDot={{ r: 4, fill: "var(--primary)" }}
                        name="Peso promedio (g)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
