"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { AuthScreen } from "@/components/auth/auth-screen"
import { AppShell, AppShellFallback } from "@/components/app-shell"
import { LandingPage } from "@/components/landing/landing-page"

/**
 * Página única (`/`):
 *  - loading          → spinner full-screen
 *  - unauthenticated  → <LandingPage/> por defecto · <AuthScreen/> si ?auth=1
 *  - authenticated    → <AppShell/> (envuelto en Suspense por useSearchParams)
 */
function UnauthenticatedView() {
  const params = useSearchParams()
  const authParam = params.get("auth")
  return authParam === "1" ? <AuthScreen /> : <LandingPage />
}

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
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <UnauthenticatedView />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<AppShellFallback />}>
      <AppShell />
    </Suspense>
  )
}
