"use client"

import * as React from "react"
import { Pencil, Plus, Skull, Trash2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/format"
import type { Mortality } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useDeleteMortality } from "@/hooks/use-batches"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { MortalityFormDialog } from "@/components/batch/forms/mortality-form-dialog"

export interface MortalityTabProps {
  batchId: string
  mortality: Mortality[]
}

export function MortalityTab({ batchId, mortality }: MortalityTabProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Mortality | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<Mortality | null>(null)

  const { toast } = useToast()
  const del = useDeleteMortality(batchId)
  const [busy, setBusy] = React.useState(false)

  async function onDelete() {
    if (!deleteItem) return
    setBusy(true)
    try {
      await del.mutateAsync(deleteItem.id)
      toast({ title: "Registro eliminado" })
      setDeleteItem(null)
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof ApiError ? err.message : "No se pudo eliminar.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Skull className="size-5 text-primary" />
            Mortalidad
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {mortality.length}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Registro de aves muertas y su causa.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-9">
          <Plus className="size-4" />
          Añadir registro
        </Button>
      </div>

      <Card className="py-0">
        {mortality.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Skull className="size-6" />
            </span>
            <p className="text-sm font-medium">Sin registros de mortalidad</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Lleva el control de las bajas para calcular la población actual.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              Añadir registro
            </Button>
          </CardContent>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Causa</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mortality.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(m.date)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatNumber(m.count)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.cause || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Editar"
                          onClick={() => setEditItem(m)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          aria-label="Eliminar"
                          onClick={() => setDeleteItem(m)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <MortalityFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        batchId={batchId}
      />
      <MortalityFormDialog
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
        batchId={batchId}
        item={editItem ?? undefined}
      />

      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el registro de mortalidad del{" "}
              {deleteItem ? formatDate(deleteItem.date) : ""}. Esta acción no se
              puede deshacer.
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
    </div>
  )
}
