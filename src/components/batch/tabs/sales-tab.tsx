"use client"

import * as React from "react"
import { Pencil, Plus, ShoppingBasket, Trash2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import { saleIncome } from "@/lib/sale"
import type { Sale } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useDeleteSale } from "@/hooks/use-batches"
import { Badge } from "@/components/ui/badge"
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
import { SaleFormDialog } from "@/components/batch/forms/sale-form-dialog"

export interface SalesTabProps {
  batchId: string
  sales: Sale[]
}

export function SalesTab({ batchId, sales }: SalesTabProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Sale | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<Sale | null>(null)

  const { toast } = useToast()
  const del = useDeleteSale(batchId)
  const [busy, setBusy] = React.useState(false)

  async function onDelete() {
    if (!deleteItem) return
    setBusy(true)
    try {
      await del.mutateAsync(deleteItem.id)
      toast({ title: "Venta eliminada" })
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
            <ShoppingBasket className="size-5 text-primary" />
            Ventas
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {sales.length}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Aves vendidas e ingresos generados por el lote.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-9">
          <Plus className="size-4" />
          Añadir venta
        </Button>
      </div>

      <Card className="py-0">
        {sales.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ShoppingBasket className="size-6" />
            </span>
            <p className="text-sm font-medium">Sin ventas registradas</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Registra las ventas para calcular los ingresos y la utilidad del
              lote.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              Añadir venta
            </Button>
          </CardContent>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Aves</TableHead>
                  <TableHead className="text-center">Modo</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Ingreso</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => {
                  const isKilo = s.unit === "kilo"
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(s.date)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(s.count)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={
                            isKilo
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {isKilo ? "Kilo" : "Unidad"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                        {isKilo ? `${formatNumber(s.weight ?? 0)} kg` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(s.unitPrice)}
                        <span className="block text-[10px] text-muted-foreground">
                          {isKilo ? "por kg" : "por ave"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatMoney(saleIncome(s))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Editar"
                            onClick={() => setEditItem(s)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            aria-label="Eliminar"
                            onClick={() => setDeleteItem(s)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <SaleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        batchId={batchId}
      />
      <SaleFormDialog
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
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la venta del{" "}
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
