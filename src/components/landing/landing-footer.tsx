"use client"

import { Bird } from "lucide-react"

/**
 * Pie de página del landing: marca + copyright + microcopy.
 */
export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bird className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Avícola<span className="text-primary">SaaS</span>
          </span>
        </div>

        <p className="order-last text-center text-xs text-muted-foreground sm:order-none sm:text-right">
          AvícolaSaaS © {year} · Hecho para productores de pollos de engorde
        </p>

        <nav className="flex items-center gap-4 text-xs text-muted-foreground">
          <a
            href="#funciones"
            className="rounded outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Funciones
          </a>
          <a
            href="#manual"
            className="rounded outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Manual
          </a>
          <a
            href="#empezar"
            className="rounded outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Empezar
          </a>
        </nav>
      </div>
    </footer>
  )
}
