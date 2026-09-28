"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getErrorMessage } from "@/lib/get-error-message"
import { MANUAL_MOVEMENTS } from "@/lib/labels"
import { useAddStockMovement } from "@/lib/queries/products"
import type { ManualMovementType, Product } from "@/lib/api/types"

/**
 * Ручное движение остатка. Знак дельты формируется по выбранному действию;
 * итоговый остаток считает и возвращает backend (он же не даст уйти в минус).
 */
export function StockMovementDialog({
  product,
  onOpenChange,
}: {
  product: Product | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {product && (
          <MovementForm
            key={product.id}
            product={product}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function MovementForm({
  product,
  onDone,
}: {
  product: Product
  onDone: () => void
}) {
  const add = useAddStockMovement()
  const [type, setType] = useState<ManualMovementType>("RESTOCK")
  const [direction, setDirection] = useState<"plus" | "minus">("plus")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const reasonRequired = type !== "RESTOCK"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const q = Number(quantity)
    if (!Number.isInteger(q) || q < 1)
      return setError("Количество — целое число не меньше 1")
    if (reasonRequired && !reason.trim()) return setError("Укажите причину")

    const sign =
      type === "RESTOCK"
        ? 1
        : type === "WRITE_OFF"
          ? -1
          : direction === "plus"
            ? 1
            : -1
    try {
      const res = await add.mutateAsync({
        id: product.id,
        type,
        quantityDelta: sign * q,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      })
      toast.success(`Готово. Остаток «${product.name}»: ${res.product.stock}`)
      onDone()
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось выполнить операцию"))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Движение остатка</DialogTitle>
        <DialogDescription>
          {product.name} · сейчас на складе:{" "}
          <span className="tabular-nums">{product.stock}</span>
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel>Действие</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={type}
            onValueChange={(v) => v && setType(v as ManualMovementType)}
            className="w-full"
          >
            {MANUAL_MOVEMENTS.map((m) => (
              <ToggleGroupItem key={m.value} value={m.value} className="flex-1">
                {m.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        {type === "ADJUSTMENT" && (
          <Field>
            <FieldLabel>Остаток должен стать</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              value={direction}
              onValueChange={(v) => v && setDirection(v as "plus" | "minus")}
              className="w-full"
            >
              <ToggleGroupItem value="plus" className="flex-1">
                Больше (+)
              </ToggleGroupItem>
              <ToggleGroupItem value="minus" className="flex-1">
                Меньше (−)
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="movement-qty">Количество</FieldLabel>
          <Input
            id="movement-qty"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="movement-reason">
            Причина{reasonRequired ? "" : " (необязательно)"}
          </FieldLabel>
          <Input
            id="movement-reason"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              type === "RESTOCK"
                ? "Закупка"
                : type === "WRITE_OFF"
                  ? "Порча, просрочка…"
                  : "Инвентаризация"
            }
          />
          <FieldDescription>
            Причина сохраняется в журнале движений.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {error && (
        <p
          role="alert"
          className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm"
        >
          ⚠️ {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" disabled={add.isPending}>
          {add.isPending ? "Выполняется…" : "Применить"}
        </Button>
      </DialogFooter>
    </form>
  )
}
