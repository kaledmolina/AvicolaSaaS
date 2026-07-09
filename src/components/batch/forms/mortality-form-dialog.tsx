"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { toInputDate, todayInputDate } from "@/lib/format"
import type { Mortality } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateMortality,
  useUpdateMortality,
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
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  count: z.coerce
    .number({ message: "Ingresa un número" })
    .int("Debe ser entero")
    .min(1, "Mínimo 1"),
  cause: z.string().optional().nullable(),
})

type Values = z.infer<typeof schema>

export interface MortalityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  item?: Mortality
}

export function MortalityFormDialog({
  open,
  onOpenChange,
  batchId,
  item,
}: MortalityFormDialogProps) {
  const isEdit = !!item
  const { toast } = useToast()
  const create = useCreateMortality(batchId)
  const update = useUpdateMortality(batchId)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { date: todayInputDate(), count: 1, cause: "" },
  })

  React.useEffect(() => {
    if (!open) return
    if (item) {
      form.reset({
        date: toInputDate(item.date),
        count: item.count,
        cause: item.cause ?? "",
      })
    } else {
      form.reset({ date: todayInputDate(), count: 1, cause: "" })
    }
  }, [open, item, form])

  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(values: Values) {
    setSubmitting(true)
    try {
      const payload = {
        date: values.date,
        count: values.count,
        cause: values.cause?.trim() ? values.cause.trim() : null,
      }
      if (isEdit && item) {
        await update.mutateAsync({ id: item.id, input: payload })
        toast({ title: "Registro actualizado" })
      } else {
        await create.mutateAsync(payload)
        toast({ title: "Mortalidad registrada" })
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
            {isEdit ? "Editar mortalidad" : "Registrar mortalidad"}
          </DialogTitle>
          <DialogDescription>
            Cantidad de aves muertas y su causa probable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="mort-date">Fecha</Label>
              <Input
                id="mort-date"
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
              <Label htmlFor="mort-count">Cantidad de aves</Label>
              <Input
                id="mort-count"
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
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="mort-cause">Causa (opcional)</Label>
            <Textarea
              id="mort-cause"
              placeholder="Ej. Calor extremo, enfermedad respiratoria…"
              rows={3}
              {...register("cause")}
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
              {isEdit ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
