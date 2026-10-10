"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ErrorState, LoadingRows } from "@/components/state-views"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/get-error-message"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

export interface CatalogEntry {
  id: number
  name: string
  price: string
  /** Остаток (только для товаров) */
  stock?: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  entries: CatalogEntry[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
  currency: string
  /** Сколько уже добавлено в чек (по id) — только для подсказки */
  addedCounts: Map<number, number>
  /** Итог чека от backend, чтобы кассир видел результат каждого тапа */
  total: string
  add: (id: number, quantity: number) => Promise<unknown>
}

/**
 * Выбор товара/услуги с точным количеством; окно остаётся открытым после добавления.
 * Цену, остаток и итог считает backend.
 */
export function CatalogDialog(props: Props) {
  const { open, onOpenChange, title } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-t-4 border-t-primary sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Выберите позицию и укажите точное количество.
          </DialogDescription>
        </DialogHeader>
        {open && <CatalogBody {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function CatalogBody({
  entries,
  isPending,
  isError,
  onRetry,
  currency,
  addedCounts,
  total,
  add,
}: Props) {
  const [query, setQuery] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const entry = entries?.find((item) => item.id === selectedId)
    if (!entry) return
    const value = Number(quantity)
    if (!Number.isInteger(value) || value < 1)
      return setError("Количество должно быть целым числом не меньше 1")
    if (entry.stock !== undefined && value > entry.stock)
      return setError(`На складе доступно только ${entry.stock} шт.`)
    setError("")
    setBusyId(entry.id)
    try {
      await add(entry.id, value)
      setQuantity("1")
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось добавить"))
    } finally {
      setBusyId(null)
    }
  }

  if (isPending) return <LoadingRows rows={3} />
  if (isError) return <ErrorState onRetry={onRetry} />
  if (!entries?.length)
    return (
      <p className="text-muted-foreground py-8 text-center">
        Каталог пуст. Владелец добавляет позиции в настройках.
      </p>
    )

  const shown = entries.filter((e) =>
    e.name.toLowerCase().includes(query.trim().toLowerCase())
  )
  const selected = entries.find((entry) => entry.id === selectedId)
  return (
    <div className="space-y-3">
      {entries.length > 8 && (
        <Input
          placeholder="Поиск"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Поиск"
        />
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {shown.map((e) => {
          const out = e.stock !== undefined && e.stock <= 0
          const added = addedCounts.get(e.id) ?? 0
          return (
            <button
              key={e.id}
              type="button"
              disabled={out || busyId !== null}
              onClick={() => {
                setSelectedId(e.id)
                setQuantity("1")
                setError("")
              }}
              className={cn(
                "relative flex min-h-24 flex-col items-start justify-between rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-[border-color,background-color,transform]",
                "hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary-subtle/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                (busyId === e.id || selectedId === e.id) &&
                  "border-primary bg-primary-subtle"
              )}
              aria-label={`Выбрать ${e.name}`}
            >
              <span className="font-medium">{e.name}</span>
              <span className="text-sm tabular-nums">
                {formatMoney(e.price, currency)}
                {e.stock !== undefined && (
                  <span
                    className={cn(
                      "ml-1",
                      out ? "text-danger" : "text-muted-foreground"
                    )}
                  >
                    · {out ? "нет в наличии" : `${e.stock} шт.`}
                  </span>
                )}
              </span>
              {added > 0 && (
                <span className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                  ×{added}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selected && (
        <form
          onSubmit={submit}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-secondary/60 p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{selected.name}</p>
            <label
              htmlFor="catalog-quantity"
              className="text-muted-foreground text-xs"
            >
              Количество
            </label>
          </div>
          <Input
            id="catalog-quantity"
            className="w-28"
            type="number"
            min={1}
            max={selected.stock ?? 1000}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-label={`Количество: ${selected.name}`}
          />
          <Button type="submit" disabled={busyId !== null}>
            {busyId === selected.id ? "Добавление…" : "Добавить"}
          </Button>
          {error && (
            <p role="alert" className="text-danger basis-full text-sm">
              {error}
            </p>
          )}
        </form>
      )}
      <p className="text-muted-foreground text-right text-sm">
        Итог чека:{" "}
        <span className="text-foreground font-semibold tabular-nums">
          {formatMoney(total, currency)}
        </span>
      </p>
    </div>
  )
}
