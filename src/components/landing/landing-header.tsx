"use client"

import { Bird } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Barra superior sticky del landing.
 * Marca con icono naranja + ThemeToggle + botón "Iniciar sesión".
 */
export function LandingHeader() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="AvícolaSaaS — inicio"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Bird className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Avícola<span className="text-primary">SaaS</span>
          </span>
        </a>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/?auth=1")}
          >
            Iniciar sesión
          </Button>
        </nav>
      </div>
    </header>
  )
}
