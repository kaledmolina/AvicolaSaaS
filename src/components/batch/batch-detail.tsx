"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react"

import { ApiError } from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/format"
import type { Batch } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useBatchDetail, useDeleteBatch, useUpdateBatch } from "@/hooks/use-batches"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { KpiCards } from "@/components/batch/kpi-cards"
import { BatchFormDialog } from "@/components/dashboard/batch-form-dialog"
import { ExpensesTab } from "@/components/batch/tabs/expenses-tab"
import { MortalityTab } from "@/components/batch/tabs/mortality-tab"
import { WeighingsTab } from "@/components/batch/tabs/weighings-tab"
import { SalesTab } from "@/components/batch/tabs/sales-tab"

export interface BatchDetailProps {
  batchId: string
}

export function BatchDetail({ batchId }: BatchDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { data, isLoading, isError, error } = useBatchDetail(batchId)
  const updateBatch = useUpdateBatch(batchId)
  const deleteBatch = useDeleteBatch(batchId)

  const [editOpen, setEditOpen] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const notFound = isError && error instanceof ApiError && error.status === 404

  async function toggleStatus(batch: Batch) {
    setBusy(true)
    try {
      const next = batch.status === "active" ? "closed" : "active"
      await updateBatch.mutateAsync({ status: next })
      toast({
        title: next === "closed" ? "Lote cerrado" : "Lote reabierto",
      })
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof ApiError ? err.message : "No se pudo actualizar.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    setBusy(true)
    try {
      await deleteBatch.mutateAsync()
      toast({ title: "Lote eliminado" })
      router.push("/")
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof ApiError ? err.message : "No se pudo eliminar.",
        variant: "destructive",
      })
      setBusy(false)
    }
  }

  // ---------- Estados de carga / error ----------
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <DetailSkeleton />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <Card className="py-0">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-base font-semibold">Lote no encontrado</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              El lote que buscas no existe o ha sido eliminado.
            </p>
            <Button onClick={() => router.push("/")} className="mt-2">
              Ir al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <Card className="py-0">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-base font-semibold">Error al cargar el lote</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof ApiError ? error.message : "Intenta nuevamente."}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-2"
            >
              Volver al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { batch, metrics, expenses, mortality, weighings, sales } = data
  const isActive = batch.status === "active"

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/")}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="size-4" />
        Volver al dashboard
      </Button>

      {/* Header */}
      <Card className="py-0">
        <CardContent className="flex flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {batch.name}
              </h1>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Activo" : "Cerrado"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span>
                Ingresados:{" "}
                <span className="font-semibold text-foreground">
                  {formatNumber(batch.initialCount)}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Inicio:{" "}
                <span className="font-semibold text-foreground">
                  {formatDate(batch.startDate)}
                </span>
              </span>
              <span>
                Día:{" "}
                <span className="font-semibold text-foreground">
                  {metrics.daysOld}
                </span>
              </span>
            </div>
            {batch.notes && (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                {batch.notes}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              disabled={busy}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStatus(batch)}
              disabled={busy}
            >
              {isActive ? "Cerrar lote" : "Reabrir lote"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="mt-4">
        <KpiCards batch={batch} metrics={metrics} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="expenses">
            Gastos
            <CountBadge n={expenses.length} />
          </TabsTrigger>
          <TabsTrigger value="mortality">
            Mortalidad
            <CountBadge n={mortality.length} />
          </TabsTrigger>
          <TabsTrigger value="weighings">
            Pesajes
            <CountBadge n={weighings.length} />
          </TabsTrigger>
          <TabsTrigger value="sales">
            Ventas
            <CountBadge n={sales.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab batchId={batchId} expenses={expenses} />
        </TabsContent>
        <TabsContent value="mortality" className="mt-4">
          <MortalityTab batchId={batchId} mortality={mortality} />
        </TabsContent>
        <TabsContent value="weighings" className="mt-4">
          <WeighingsTab batchId={batchId} weighings={weighings} />
        </TabsContent>
        <TabsContent value="sales" className="mt-4">
          <SalesTab batchId={batchId} sales={sales} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BatchFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        batch={batch}
      />

      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{batch.name}</strong> junto con todos sus
              gastos, registros de mortalidad, pesajes y ventas. Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {n}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
