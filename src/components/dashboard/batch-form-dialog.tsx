"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { toInputDate, todayInputDate } from "@/lib/format"
import type { Batch } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateBatch,
  useUpdateBatch,
} from "@/hooks/use-batches"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// ---------------------------------------------------------------------------
// Esquema zod del formulario de lote
// ---------------------------------------------------------------------------

const batchSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  initialCount: z.coerce
    .number({ message: "Ingresa un número" })
    .int("Debe ser entero")
    .min(1, "Mínimo 1 ave"),
  startDate: z.string().min(1, "Fecha requerida"),
  status: z.enum(["active", "closed"]),
  notes: z.string().optional().nullable(),
})

type BatchFormValues = z.infer<typeof batchSchema>

export interface BatchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch?: Batch // si se pasa, modo edición
}

export function BatchFormDialog({
  open,
  onOpenChange,
  batch,
}: BatchFormDialogProps) {
  const isEdit = !!batch
  const { toast } = useToast()
  const createBatch = useCreateBatch()
  const updateBatch = useUpdateBatch(batch?.id ?? "")

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: "",
      initialCount: 100,
      startDate: todayInputDate(),
      status: "active",
      notes: "",
    },
  })

  // Reset cuando se abre/cambia el batch
  React.useEffect(() => {
    if (!open) return
    if (batch) {
      form.reset({
        name: batch.name,
        initialCount: batch.initialCount,
        startDate: toInputDate(batch.startDate),
        status: batch.status,
        notes: batch.notes ?? "",
      })
    } else {
      form.reset({
        name: "",
        initialCount: 100,
        startDate: todayInputDate(),
        status: "active",
        notes: "",
      })
    }
  }, [open, batch, form])

  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(values: BatchFormValues) {
    setSubmitting(true)
    try {
      const payload = {
        name: values.name.trim(),
        initialCount: values.initialCount,
        startDate: values.startDate,
        status: values.status,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      }
      if (isEdit && batch) {
        await updateBatch.mutateAsync(payload)
        toast({ title: "Lote actualizado", description: payload.name })
      } else {
        await createBatch.mutateAsync(payload)
        toast({ title: "Lote creado", description: payload.name })
      }
      onOpenChange(false)
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof ApiError ? err.message : "No se pudo guardar.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const statusValue = watch("status")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lote" : "Nuevo lote"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del lote."
              : "Registra un nuevo lote de pollos de engorde."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="batch-name">Nombre del lote</Label>
            <Input
              id="batch-name"
              placeholder="Ej. Lote 12 — Galpón A"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="batch-count">Aves iniciales</Label>
              <Input
                id="batch-count"
                type="number"
                min={1}
                step={1}
                aria-invalid={!!errors.initialCount}
                {...register("initialCount")}
              />
              {errors.initialCount && (
                <p className="text-xs font-medium text-destructive">
                  {errors.initialCount.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="batch-start">Fecha de inicio</Label>
              <Input
                id="batch-start"
                type="date"
                aria-invalid={!!errors.startDate}
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-xs font-medium text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="batch-status">Estado</Label>
            <Select
              value={statusValue}
              onValueChange={(v) =>
                setValue("status", v as "active" | "closed", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="batch-status" className="w-full">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="batch-notes">Notas (opcional)</Label>
            <Textarea
              id="batch-notes"
              placeholder="Raza, proveedor de pollitos, dieta, observaciones…"
              rows={3}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear lote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
