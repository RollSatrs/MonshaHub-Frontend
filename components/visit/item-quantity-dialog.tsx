"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/get-error-message"
import type { VisitItem } from "@/lib/api/types"

export function ItemQuantityDialog({
  item,
  pending,
  onOpenChange,
  onSubmit,
}: {
  item: VisitItem | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { quantity: number; reason: string }) => Promise<void>
}) {
  const [quantity, setQuantity] = useState("1")
  const [reason, setReason] = useState("Лишнее количество")
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    const value = Number(quantity)
    if (!Number.isInteger(value) || value < 1 || value > item.quantity) {
      setError(`Укажите целое количество от 1 до ${item.quantity}`)
      return
    }
    if (!reason.trim()) return setError("Укажите причину")
    setError("")
    try {
      await onSubmit({ quantity: value, reason: reason.trim() })
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось изменить количество"))
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Изменить количество</DialogTitle>
            <DialogDescription>
              {item?.name} · сейчас в чеке: {item?.quantity} шт. Убранные товары
              вернутся на склад.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="remove-item-quantity">
                Сколько убрать
              </FieldLabel>
              <Input
                id="remove-item-quantity"
                type="number"
                min={1}
                max={item?.quantity ?? 1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="remove-item-reason">Причина</FieldLabel>
              <Input
                id="remove-item-reason"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          </FieldGroup>
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохранение…" : "Убрать указанное"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
