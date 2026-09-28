"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MoneyInput } from "@/components/money-input"
import { PermanentDelete } from "@/components/permanent-delete"
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
import { isValidMoney } from "@/lib/money"
import {
  useCreateService,
  useDeleteService,
  useUpdateService,
} from "@/lib/queries/services"
import type { BathService } from "@/lib/api/types"

/** Создание (service = undefined) и редактирование услуги. У услуги нет складского остатка. */
export function ServiceFormDialog({
  service,
  open,
  onOpenChange,
}: {
  service?: BathService
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateService()
  const update = useUpdateService()
  const remove = useDeleteService()
  const [name, setName] = useState(service?.name ?? "")
  const [price, setPrice] = useState(
    service ? service.price.replace(/\.00$/, "") : ""
  )
  const [error, setError] = useState("")
  const pending = create.isPending || update.isPending

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!name.trim()) return setError("Укажите название")
    if (!isValidMoney(price))
      return setError("Цена — число вида 5000 или 5000.50")
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, name: name.trim(), price })
        toast.success("Услуга сохранена")
      } else {
        await create.mutateAsync({ name: name.trim(), price })
        toast.success("Услуга добавлена")
      }
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить услугу"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {service ? "Редактировать услугу" : "Новая услуга"}
            </DialogTitle>
            <DialogDescription>Например: массаж, парение.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="service-name">Название</FieldLabel>
              <Input
                id="service-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                placeholder="Массаж"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="service-price">Цена</FieldLabel>
              <MoneyInput
                id="service-price"
                value={price}
                onValueChange={setPrice}
                suffix="₸"
              />
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
          <DialogFooter className="items-center sm:justify-between">
            {service ? (
              <PermanentDelete
                entity="Услуга"
                onDelete={() => remove.mutateAsync(service.id)}
                onDeleted={() => onOpenChange(false)}
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Сохранение…" : "Сохранить"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
