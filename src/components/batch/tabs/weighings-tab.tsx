"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, Pencil, Plus, Scale, Trash2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { formatDate, formatDateShort, formatNumber } from "@/lib/format"
import type { Weighing } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useDeleteWeighing } from "@/hooks/use-batches"
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
import { WeighingFormDialog } from "@/components/batch/forms/weighing-form-dialog"

export interface WeighingsTabProps {
  batchId: string
  weighings: Weighing[]
}

export function WeighingsTab({ batchId, weighings }: WeighingsTabProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Weighing | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<Weighing | null>(null)

  const { toast } = useToast()
  const del = useDeleteWeighing(batchId)
  const [busy, setBusy] = React.useState(false)

  // Datos del gráfico: ordenar por fecha ascendente
  const chartData = React.useMemo(() => {
    return [...weighings]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((w) => ({
        date: formatDateShort(w.date),
        raw: w.date,
        avgWeight: w.avgWeight,
      }))
  }, [weighings])

  async function onDelete() {
    if (!deleteItem) return
    setBusy(true)
    try {
      await del.mutateAsync(deleteItem.id)
      toast({ title: "Pesaje eliminado" })
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
            <Scale className="size-5 text-primary" />
            Pesajes
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {weighings.length}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Seguimiento del peso promedio (g) del lote a lo largo del tiempo.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-9">
          <Plus className="size-4" />
          Añadir pesaje
        </Button>
      </div>

      {/* Gráfico de crecimiento */}
      <Card className="py-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-primary" />
            Curva de crecimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {chartData.length < 2 ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-1 text-center">
              <Activity className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Registra al menos 2 pesajes para ver la curva de crecimiento.
              </p>
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--border)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                    labelFormatter={(label) => `Fecha: ${label}`}
                    formatter={(value) => [
                      `${formatNumber(Number(value))} g`,
                      "Peso prom.",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgWeight"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--primary)" }}
                    activeDot={{ r: 5 }}
                    name="Peso promedio (g)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="py-0">
        {weighings.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Scale className="size-6" />
            </span>
            <p className="text-sm font-medium">Sin pesajes registrados</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Registra el peso promedio de las aves para hacer seguimiento del
              engorde.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              Añadir pesaje
            </Button>
          </CardContent>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Peso promedio (g)</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weighings.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(w.date)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatNumber(w.avgWeight)} g
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Editar"
                          onClick={() => setEditItem(w)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          aria-label="Eliminar"
                          onClick={() => setDeleteItem(w)}
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

      <WeighingFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        batchId={batchId}
      />
      <WeighingFormDialog
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
            <AlertDialogTitle>¿Eliminar pesaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el pesaje del{" "}
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
