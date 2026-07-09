"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Dashboard } from "@/components/dashboard/dashboard"
import { BatchDetail } from "@/components/batch/batch-detail"
import { AdminPanel } from "@/components/admin/admin-panel"
import { useSession } from "next-auth/react"

/**
 * Layout principal de la aplicación autenticada.
 * Encamina vistas según query params:
 *  - ?view=admin  → Panel de Administración (solo role "admin")
 *  - ?batch=ID    → Detalle del lote
 *  - sin param    → Dashboard (lista de lotes + KPIs)
 */
export function AppShell() {
  const router = useRouter()
  const params = useSearchParams()
  const { data: session } = useSession()

  const view = params.get("view")
  const batchId = params.get("batch")
  const role = (session?.user as { role?: string } | undefined)?.role
  const isAdmin = role === "admin"

  // Limpia params inválidos
  React.useEffect(() => {
    if (batchId === "") router.replace("/")
    if (view === "admin" && !isAdmin) router.replace("/")
  }, [batchId, view, isAdmin, router])

  let content: React.ReactNode = <Dashboard />
  if (view === "admin" && isAdmin) {
    content = <AdminPanel />
  } else if (batchId) {
    content = <BatchDetail batchId={batchId} />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{content}</main>
      <SiteFooter />
    </div>
  )
}

/**
 * Fallback de Suspense para el AppShell.
 */
export function AppShellFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="mt-3 text-sm text-muted-foreground">Cargando…</span>
    </div>
  )
}
