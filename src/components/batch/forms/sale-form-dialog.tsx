"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { toInputDate, todayInputDate, formatMoney, formatNumber } from "@/lib/format"
import { saleIncome } from "@/lib/sale"
import type { Sale, SaleUnit } from "@/lib/types"
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

// Esquema dinámico: si unit === "kilo", weight es obligatorio y > 0.
const baseSchema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  unit: z.enum(["unit", "kilo"]),
  count: z.coerce
    .number({ message: "Ingresa un número" })
    .int("Debe ser entero")
    .min(1, "Mínimo 1"),
  weight: z.coerce
    .number({ message: "Ingresa un número" })
    .min(0, "Debe ser ≥ 0")
    .optional()
    .nullable(),
  unitPrice: z.coerce
    .number({ message: "Ingresa un número" })
    .min(0, "Debe ser ≥ 0"),
})

const schema = baseSchema.refine(
  (d) => d.unit !== "kilo" || (typeof d.weight === "number" && d.weight > 0),
  { message: "Para venta por kilo, ingresa el peso total (kg) mayor a 0", path: ["weight"] }
)

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
    defaultValues: { date: todayInputDate(), unit: "unit", count: 1, weight: null, unitPrice: 0 },
  })

  React.useEffect(() => {
    if (!open) return
    if (item) {
      form.reset({
        date: toInputDate(item.date),
        unit: (item.unit as SaleUnit) ?? "unit",
        count: item.count,
        weight: item.weight ?? null,
        unitPrice: item.unitPrice,
      })
    } else {
      form.reset({ date: todayInputDate(), unit: "unit", count: 1, weight: null, unitPrice: 0 })
    }
  }, [open, item, form])

  const [submitting, setSubmitting] = React.useState(false)

  // Observamos el modo y los valores para el preview del ingreso.
  const unit = form.watch("unit") as SaleUnit
  const count = form.watch("count")
  const weight = form.watch("weight")
  const unitPrice = form.watch("unitPrice")

  const isKilo = unit === "kilo"

  const toNum = React.useCallback(
    (v: unknown) =>
      typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : 0,
    []
  )

  const preview = React.useMemo(() => {
    return saleIncome({
      unit,
      count: toNum(count),
      weight: toNum(weight),
      unitPrice: toNum(unitPrice),
    })
  }, [unit, count, weight, unitPrice, toNum])

  const weightNum = toNum(weight)
  const priceNum = toNum(unitPrice)

  async function onSubmit(values: Values) {
    setSubmitting(true)
    try {
      const payload = {
        date: values.date,
        count: values.count,
        unit: values.unit,
        weight: values.unit === "kilo" ? values.weight : null,
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
    setValue,
  } = form

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar venta" : "Registrar venta"}
          </DialogTitle>
          <DialogDescription>
            Vende por unidad (pollo) o por kilo. El ingreso se calcula
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          {/* Modo de venta */}
          <div className="grid gap-1.5">
            <Label>Modo de venta</Label>
            <ToggleGroup
              type="single"
              value={unit}
              onValueChange={(v) => {
                if (v === "unit" || v === "kilo") {
                  setValue("unit", v, { shouldValidate: true })
                  if (v === "unit") setValue("weight", null)
                }
              }}
              className="grid w-full grid-cols-2"
            >
              <ToggleGroupItem value="unit" className="h-9">
                Por unidad (pollo)
              </ToggleGroupItem>
              <ToggleGroupItem value="kilo" className="h-9">
                Por kilo
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="sale-count">
                Cantidad de aves
              </Label>
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
          </div>

          {isKilo && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sale-weight">Peso total (kg)</Label>
                <Input
                  id="sale-weight"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ej: 300"
                  aria-invalid={!!errors.weight}
                  {...register("weight")}
                />
                {errors.weight && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.weight.message}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sale-price">Precio por kilo (COP)</Label>
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
          )}

          {!isKilo && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sale-price-u">Precio por unidad (COP)</Label>
                <Input
                  id="sale-price-u"
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
              <div className="flex items-end">
                <div className="w-full rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Ingreso: </span>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(preview)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isKilo && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {weightNum > 0
                  ? `${formatNumber(weightNum)} kg × ${formatMoney(priceNum)}`
                  : "Ingresa el peso y el precio por kilo"}
              </span>
              <span className="float-right font-semibold tabular-nums">
                {formatMoney(preview)}
              </span>
            </div>
          )}

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
