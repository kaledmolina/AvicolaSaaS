"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Dashboard } from "@/components/dashboard/dashboard"
import { BatchDetail } from "@/components/batch/batch-detail"

/**
 * Layout principal de la aplicación autenticada.
 * Encamina vistas según el query param `?batch=ID`:
 *  - sin param  → Dashboard (lista de lotes + KPIs)
 *  - con param  → Detalle del lote
 *
 * `useSearchParams` requiere Suspense en Next 16: el AppShell se sirve ya
 * dentro de un <Suspense> provisto por page.tsx (auth gate).
 */
export function AppShell() {
  const router = useRouter()
  const params = useSearchParams()
  const batchId = params.get("batch")

  // Cierra el detalle si el batchId es inválido (vacío)
  React.useEffect(() => {
    if (batchId === "") {
      router.replace("/")
    }
  }, [batchId, router])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {batchId ? <BatchDetail batchId={batchId} /> : <Dashboard />}
      </main>
      <SiteFooter />
    </div>
  )
}

/**
 * Fallback de Suspense para el AppShell: spinner centrado mientras
 * `useSearchParams` se resuelve en el primer render del cliente.
 */
export function AppShellFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="mt-3 text-sm text-muted-foreground">Cargando…</span>
    </div>
  )
}
