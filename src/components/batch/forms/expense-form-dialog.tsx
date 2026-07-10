"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { toInputDate, todayInputDate } from "@/lib/format"
import type { Expense } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateExpense,
  useUpdateExpense,
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
  description: z.string().min(2, "Describe el gasto"),
  quantity: z.coerce
    .number({ message: "Ingresa un número" })
    .min(0, "Debe ser ≥ 0"),
  unitPrice: z.coerce
    .number({ message: "Ingresa un número" })
    .min(0, "Debe ser ≥ 0"),
  date: z.string().min(1, "Fecha requerida"),
})

type Values = z.infer<typeof schema>

export interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  item?: Expense
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  batchId,
  item,
}: ExpenseFormDialogProps) {
  const isEdit = !!item
  const { toast } = useToast()
  const create = useCreateExpense(batchId)
  const update = useUpdateExpense(batchId)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      quantity: 1,
      unitPrice: 0,
      date: todayInputDate(),
    },
  })

  React.useEffect(() => {
    if (!open) return
    if (item) {
      form.reset({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        date: toInputDate(item.date),
      })
    } else {
      form.reset({
        description: "",
        quantity: 1,
        unitPrice: 0,
        date: todayInputDate(),
      })
    }
  }, [open, item, form])

  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(values: Values) {
    setSubmitting(true)
    try {
      const payload = {
        description: values.description.trim(),
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        date: values.date,
      }
      if (isEdit && item) {
        await update.mutateAsync({ id: item.id, input: payload })
        toast({ title: "Gasto actualizado" })
      } else {
        await create.mutateAsync(payload)
        toast({ title: "Gasto registrado" })
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
            {isEdit ? "Editar gasto" : "Registrar gasto"}
          </DialogTitle>
          <DialogDescription>
            Alimento, medicinas, servicios, mano de obra, etc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="exp-desc">Descripción</Label>
            <Input
              id="exp-desc"
              placeholder="Ej. Alimento balanceado 40 kg"
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="exp-qty">Cantidad</Label>
              <Input
                id="exp-qty"
                type="number"
                min={0}
                step="any"
                aria-invalid={!!errors.quantity}
                {...register("quantity")}
              />
              {errors.quantity && (
                <p className="text-xs font-medium text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="exp-price">V. Unitario (COP)</Label>
              <Input
                id="exp-price"
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
            <div className="grid gap-1.5">
              <Label htmlFor="exp-date">Fecha</Label>
              <Input
                id="exp-date"
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
