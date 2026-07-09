"use client"

import {
  Activity,
  Bird,
  Calculator,
  CircleDollarSign,
  ReceiptText,
  Scale,
  type LucideIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: Bird,
    title: "Lotes de pollos",
    description:
      "Crea y gestiona cada lote con cantidad inicial, fecha de ingreso y estado (activo o cerrado).",
  },
  {
    icon: ReceiptText,
    title: "Control de gastos",
    description:
      "Registra alimento, vacunas, servicios y más, con cálculo automático del total por lote.",
  },
  {
    icon: Activity,
    title: "Mortalidad diaria",
    description:
      "Lleva el control de las bajas y su causa para detectar problemas a tiempo y reducir pérdidas.",
  },
  {
    icon: Scale,
    title: "Pesajes y crecimiento",
    description:
      "Medición del peso promedio con curva de crecimiento visual para seguir el engorde del lote.",
  },
  {
    icon: CircleDollarSign,
    title: "Ventas e ingresos",
    description:
      "Registra las salidas al mercado con cantidad y precio, y calcula automáticamente los ingresos.",
  },
  {
    icon: Calculator,
    title: "Rentabilidad en tiempo real",
    description:
      "Métricas automáticas: utilidad, % de mortalidad y población actual sin cálculos manuales.",
  },
]

/**
 * Grid de 6 tarjetas de funcionalidades del sistema.
 */
export function LandingFeatures() {
  return (
    <section
      id="funciones"
      aria-labelledby="features-title"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Funciones
        </p>
        <h2
          id="features-title"
          className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Todo lo que tu granja necesita en un solo lugar
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          Desde el ingreso de los pollitos hasta la venta final: lleva un
          control completo de cada lote y de las finanzas de tu explotación.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card
            key={feature.title}
            className="gap-0 hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <CardHeader className="px-6 pt-6 pb-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </span>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
