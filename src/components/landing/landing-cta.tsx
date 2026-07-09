"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDemoLogin } from "./use-demo-login"

/**
 * Banda final de llamada a la acción (fondo naranja sólido).
 * Botones "Probar demo" + "Crear cuenta".
 */
export function LandingCta() {
  const router = useRouter()
  const { demoLoading, handleDemo } = useDemoLogin()

  return (
    <section
      id="empezar"
      aria-labelledby="cta-title"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground shadow-sm sm:px-12 sm:py-20">
        {/* Decoración de fondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,var(--primary-foreground)_0%,transparent_60%)] opacity-[0.12]"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2
            id="cta-title"
            className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            Empieza a gestionar tu granja hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-primary-foreground/80 text-pretty">
            Crea tu cuenta en segundos o explora el demo con datos de muestra.
            Sin tarjetas, sin compromiso.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
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
              className="h-11 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => router.push("/?auth=1")}
            >
              Crear cuenta
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
