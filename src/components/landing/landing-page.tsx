"use client"

import { LandingHeader } from "./landing-header"
import { LandingHero } from "./landing-hero"
import { LandingFeatures } from "./landing-features"
import { LandingManual } from "./landing-manual"
import { LandingCta } from "./landing-cta"
import { LandingFooter } from "./landing-footer"

/**
 * Página de aterrizaje (landing) pública de AvícolaSaaS.
 * Se muestra a usuarios no autenticados por defecto en `/`.
 * Los botones de navegación dirigen a `/?auth=1` (AuthScreen) y
 * "Probar demo" inicia sesión con las credenciales demo.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingManual />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}

export default LandingPage
