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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/get-error-message"
import { isValidMoney } from "@/lib/money"
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/lib/queries/products"
import type { Product } from "@/lib/api/types"

const trimZeros = (v: string) => v.replace(/\.00$/, "")

/** Создание (product = undefined) и редактирование товара. Остаток редактируется только через движения. */
export function ProductFormDialog({
  product,
  open,
  onOpenChange,
}: {
  product?: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const remove = useDeleteProduct()
  const [name, setName] = useState(product?.name ?? "")
  const [price, setPrice] = useState(product ? trimZeros(product.price) : "")
  const [stock, setStock] = useState("0")
  const [error, setError] = useState("")
  const pending = create.isPending || update.isPending

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!name.trim()) return setError("Укажите название")
    if (!isValidMoney(price))
      return setError("Цена — число вида 1500 или 1500.50")
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, name: name.trim(), price })
        toast.success("Товар сохранён")
      } else {
        const initial = Number(stock)
        if (!Number.isInteger(initial) || initial < 0)
          return setError("Начальный остаток — целое число не меньше 0")
        await create.mutateAsync({ name: name.trim(), price, stock: initial })
        toast.success("Товар добавлен")
      }
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить товар"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {product ? "Редактировать товар" : "Новый товар"}
            </DialogTitle>
            <DialogDescription>
              {product
                ? "Остаток меняется через «Движение остатка» — так сохраняется история."
                : "Начальный остаток попадёт в журнал движений."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="product-name">Название</FieldLabel>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                placeholder="Веник"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="product-price">Цена</FieldLabel>
              <MoneyInput
                id="product-price"
                value={price}
                onValueChange={setPrice}
                suffix="₸"
              />
            </Field>
            {!product && (
              <Field>
                <FieldLabel htmlFor="product-stock">
                  Начальный остаток
                </FieldLabel>
                <Input
                  id="product-stock"
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                <FieldDescription>Штук на складе сейчас.</FieldDescription>
              </Field>
            )}
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
            {product ? (
              <PermanentDelete
                entity="Товар"
                onDelete={() => remove.mutateAsync(product.id)}
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
