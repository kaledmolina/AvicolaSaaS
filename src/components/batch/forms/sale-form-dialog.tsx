"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { toInputDate, todayInputDate } from "@/lib/format"
import type { Sale } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateSale,
  useUpdateSale,
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

const schema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  count: z.coerce
    .number({ message: "Ingresa un número" })
    .int("Debe ser entero")
    .min(1, "Mínimo 1"),
  unitPrice: z.coerce
    .number({ message: "Ingresa un número" })
    .min(0, "Debe ser ≥ 0"),
})

type Values = z.infer<typeof schema>

export interface SaleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  item?: Sale
}

export function SaleFormDialog({
  open,
  onOpenChange,
  batchId,
  item,
}: SaleFormDialogProps) {
  const isEdit = !!item
  const { toast } = useToast()
  const create = useCreateSale(batchId)
  const update = useUpdateSale(batchId)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { date: todayInputDate(), count: 1, unitPrice: 0 },
  })

  React.useEffect(() => {
    if (!open) return
    if (item) {
      form.reset({
        date: toInputDate(item.date),
        count: item.count,
        unitPrice: item.unitPrice,
      })
    } else {
      form.reset({ date: todayInputDate(), count: 1, unitPrice: 0 })
    }
  }, [open, item, form])

  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(values: Values) {
    setSubmitting(true)
    try {
      const payload = {
        date: values.date,
        count: values.count,
        unitPrice: values.unitPrice,
      }
      if (isEdit && item) {
        await update.mutateAsync({ id: item.id, input: payload })
        toast({ title: "Venta actualizada" })
      } else {
        await create.mutateAsync(payload)
        toast({ title: "Venta registrada" })
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
    formState: { errors },
  } = form

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar venta" : "Registrar venta"}
          </DialogTitle>
          <DialogDescription>
            Cantidad de aves vendidas y precio unitario en COP.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="sale-date">Fecha</Label>
              <Input
                id="sale-date"
                type="date"
                aria-invalid={!!errors.date}
                {...register("date")}
              />
              {errors.date && (
                <p className="text-xs font-medium text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sale-count">Cantidad</Label>
              <Input
                id="sale-count"
                type="number"
                min={1}
                step={1}
                aria-invalid={!!errors.count}
                {...register("count")}
              />
              {errors.count && (
                <p className="text-xs font-medium text-destructive">
                  {errors.count.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sale-price">P. Unitario (COP)</Label>
              <Input
                id="sale-price"
                type="number"
                min={0}
                step="any"
                aria-invalid={!!errors.unitPrice}
                {...register("unitPrice")}
              />
              {errors.unitPrice && (
                <p className="text-xs font-medium text-destructive">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
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
              {isEdit ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
