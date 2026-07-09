"use client"

import * as React from "react"
import { Pencil, Plus, ReceiptText, Trash2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import type { Expense } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useDeleteExpense } from "@/hooks/use-batches"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { ExpenseFormDialog } from "@/components/batch/forms/expense-form-dialog"

export interface ExpensesTabProps {
  batchId: string
  expenses: Expense[]
}

export function ExpensesTab({ batchId, expenses }: ExpensesTabProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Expense | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<Expense | null>(null)

  const { toast } = useToast()
  const del = useDeleteExpense(batchId)
  const [busy, setBusy] = React.useState(false)

  async function onDelete() {
    if (!deleteItem) return
    setBusy(true)
    try {
      await del.mutateAsync(deleteItem.id)
      toast({ title: "Gasto eliminado" })
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
            <ReceiptText className="size-5 text-primary" />
            Gastos
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {expenses.length}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Alimento, medicinas, servicios y otros costos del lote.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-9">
          <Plus className="size-4" />
          Añadir gasto
        </Button>
      </div>

      <Card className="py-0">
        {expenses.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ReceiptText className="size-6" />
            </span>
            <p className="text-sm font-medium">Sin registros de gastos</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Empieza a registrar los costos del lote para conocer su
              rentabilidad.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              Añadir gasto
            </Button>
          </CardContent>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">V. Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(e.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {e.description}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(e.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(e.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMoney(e.quantity * e.unitPrice)}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        onEdit={() => setEditItem(e)}
                        onDelete={() => setDeleteItem(e)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <ExpenseFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        batchId={batchId}
      />
      <ExpenseFormDialog
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
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteItem?.description}</strong>. Esta
              acción no se puede deshacer.
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

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Editar"
        onClick={onEdit}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        aria-label="Eliminar"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
