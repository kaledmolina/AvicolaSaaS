"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, MoreVertical, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/format"
import type { Batch } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useDeleteBatch, useUpdateBatch } from "@/hooks/use-batches"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function daysSince(iso: string): number {
  const start = new Date(iso)
  if (isNaN(start.getTime())) return 0
  const now = new Date()
  const diff = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  )
  return Math.max(0, diff)
}

export interface BatchCardProps {
  batch: Batch
  onEdit?: (batch: Batch) => void
}

export function BatchCard({ batch, onEdit }: BatchCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const deleteBatch = useDeleteBatch(batch.id)
  const updateBatch = useUpdateBatch(batch.id)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const isActive = batch.status === "active"
  const daysOld = daysSince(batch.startDate)

  function openDetail() {
    router.push(`/?batch=${batch.id}`)
  }

  async function toggleStatus() {
    setBusy(true)
    try {
      await updateBatch.mutateAsync({
        status: isActive ? "closed" : "active",
      })
      toast({
        title: isActive ? "Lote cerrado" : "Lote reabierto",
        description: batch.name,
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
      toast({ title: "Lote eliminado", description: batch.name })
      setConfirmOpen(false)
    } catch (err) {
      toast({
        title: "Error al eliminar",
        description:
          err instanceof ApiError ? err.message : "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Abrir lote ${batch.name}`}
        onClick={openDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openDetail()
          }
        }}
        className={cn(
          "group relative cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "py-0"
        )}
      >
        <CardHeader className="flex-row items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{batch.name}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {formatDate(batch.startDate)}
            </div>
          </div>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="shrink-0"
          >
            {isActive ? "Activo" : "Cerrado"}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 px-4 pb-4 pt-2 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Ingresados
            </p>
            <p className="font-semibold">{formatNumber(batch.initialCount)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Día
            </p>
            <p className="font-semibold">{daysOld}</p>
          </div>
        </CardContent>

        {/* Botón de acciones — evitar propagación al abrir el card */}
        <div
          className="absolute right-2 top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label={`Acciones para ${batch.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  onEdit?.(batch)
                }}
              >
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busy}
                onSelect={(e) => {
                  e.preventDefault()
                  toggleStatus()
                }}
              >
                {isActive ? "Cerrar lote" : "Reabrir lote"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  setConfirmOpen(true)
                }}
              >
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
