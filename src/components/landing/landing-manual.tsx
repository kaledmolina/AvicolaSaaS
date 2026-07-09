"use client"

import {
  BarChart3,
  Bird,
  ClipboardList,
  Lightbulb,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Step {
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: UserPlus,
    title: "Crea tu cuenta o prueba el demo",
    description:
      "Regístrate con tu correo o usa el botón “Probar demo” para explorar el sistema sin registrarte.",
  },
  {
    icon: Bird,
    title: "Da de alta tu primer lote",
    description:
      "Ve a “Mis Lotes” → “Nuevo lote”, ingresa el nombre (ej. Galpón A), la cantidad de pollitos y la fecha de ingreso.",
  },
  {
    icon: ClipboardList,
    title: "Registra los movimientos del lote",
    description:
      "Dentro del lote, usa las pestañas para añadir gastos (alimento, vacunas), mortalidad diaria, pesajes y ventas.",
  },
  {
    icon: BarChart3,
    title: "Revisa tus métricas en tiempo real",
    description:
      "Las tarjetas superiores calculan automáticamente la población actual, gastos, ingresos y utilidad del lote.",
  },
  {
    icon: TrendingUp,
    title: "Analiza y decide",
    description:
      "Usa la curva de crecimiento y la rentabilidad para decidir el momento óptimo de venta y mejorar tu próximo ciclo.",
  },
]

const TIPS: string[] = [
  "Registra la mortalidad a diario para detectar problemas a tiempo.",
  "Pesajes semanales te muestran la curva de crecimiento del lote.",
  "Anota cada gasto con su precio unitario para un cálculo exacto.",
  "Cierra el lote al finalizar el ciclo para conservar tu historial.",
]

/**
 * Manual de uso: 5 pasos numerados + tarjeta de consejos.
 */
export function LandingManual() {
  return (
    <section
      id="manual"
      aria-labelledby="manual-title"
      className="border-t bg-muted/30"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Manual de uso
          </p>
          <h2
            id="manual-title"
            className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Cómo empezar en 5 pasos
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Guía rápida para sacar provecho del sistema desde el primer día.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-4">
          {STEPS.map((step, index) => (
            <Card key={step.title} className="gap-0 py-4">
              <CardContent className="flex items-start gap-4 px-4 sm:px-6">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <step.icon className="size-4 shrink-0 text-primary" />
                    <span>{step.title}</span>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mx-auto mt-6 max-w-3xl gap-0 border-primary/20 bg-accent/50">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-primary" />
              Consejos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ul className="grid gap-2 sm:grid-cols-2">
              {TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span className="text-pretty">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
