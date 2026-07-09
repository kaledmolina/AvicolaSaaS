"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

import { AuthScreen } from "@/components/auth/auth-screen"
import { AppShell, AppShellFallback } from "@/components/app-shell"

/**
 * Página única (`/`):
 *  - status === "loading"        → spinner full-screen
 *  - status === "unauthenticated" → <AuthScreen/>
 *  - status === "authenticated"   → <AppShell/> (envuelto en Suspense por
 *    uso de useSearchParams)
 */
export default function HomePage() {
  const { status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="size-10 animate-spin text-primary" />
        <span className="mt-3 text-sm text-muted-foreground">
          Cargando AvícolaSaaS…
        </span>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <AuthScreen />
  }

  return (
    <Suspense fallback={<AppShellFallback />}>
      <AppShell />
    </Suspense>
  )
}
