"use client"

import { Bird } from "lucide-react"

/**
 * Pie de página que se mantiene al fondo del viewport gracias al layout
 * flex-col + mt-auto provisto por el AppShell. En páginas largas se empuja
 * hacia abajo de forma natural.
 */
export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto w-full border-t bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary">
            <Bird className="size-3.5" />
          </span>
          <span>
            AvícolaSaaS © {year} — Gestión avícola multi-usuario
          </span>
        </div>
        <span className="text-muted-foreground/80">
          Hecho para productores de pollos de engorde
        </span>
      </div>
    </footer>
  )
}
