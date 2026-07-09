"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { toInputDate, todayInputDate } from "@/lib/format"
import type { Weighing } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateWeighing,
  useUpdateWeighing,
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
  avgWeight: z.coerce
    .number({ message: "Ingresa un número" })
    .min(0.1, "Debe ser > 0"),
})

type Values = z.infer<typeof schema>

export interface WeighingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  item?: Weighing
}

export function WeighingFormDialog({
  open,
  onOpenChange,
  batchId,
  item,
}: WeighingFormDialogProps) {
  const isEdit = !!item
  const { toast } = useToast()
  const create = useCreateWeighing(batchId)
  const update = useUpdateWeighing(batchId)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { date: todayInputDate(), avgWeight: 0 },
  })

  React.useEffect(() => {
    if (!open) return
    if (item) {
      form.reset({
        date: toInputDate(item.date),
        avgWeight: item.avgWeight,
      })
    } else {
      form.reset({ date: todayInputDate(), avgWeight: 0 })
    }
  }, [open, item, form])

  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(values: Values) {
    setSubmitting(true)
    try {
      const payload = {
        date: values.date,
        avgWeight: values.avgWeight,
      }
      if (isEdit && item) {
        await update.mutateAsync({ id: item.id, input: payload })
        toast({ title: "Pesaje actualizado" })
      } else {
        await create.mutateAsync(payload)
        toast({ title: "Pesaje registrado" })
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar pesaje" : "Registrar pesaje"}
          </DialogTitle>
          <DialogDescription>
            Peso promedio de las aves en gramos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="w-date">Fecha</Label>
              <Input
                id="w-date"
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
              <Label htmlFor="w-avg">Peso promedio (g)</Label>
              <Input
                id="w-avg"
                type="number"
                min={0}
                step="any"
                aria-invalid={!!errors.avgWeight}
                {...register("avgWeight")}
              />
              {errors.avgWeight && (
                <p className="text-xs font-medium text-destructive">
                  {errors.avgWeight.message}
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
