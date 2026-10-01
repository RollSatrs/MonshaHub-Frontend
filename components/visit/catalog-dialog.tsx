"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ErrorState, LoadingRows } from "@/components/state-views"
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
  add: (id: number) => Promise<unknown>
}

/**
 * Быстрый выбор товара/услуги: один тап = одна единица в чек, окно остаётся открытым.
 * Цену, остаток и итог считает backend.
 */
export function CatalogDialog(props: Props) {
  const { open, onOpenChange, title } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Нажмите на позицию, чтобы добавить одну единицу в чек.
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

  async function tap(entry: CatalogEntry) {
    setBusyId(entry.id)
    try {
      await add(entry.id)
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
              onClick={() => tap(e)}
              className={cn(
                "relative flex min-h-24 flex-col items-start justify-between rounded-xl border p-3 text-left transition-colors",
                "hover:border-primary hover:bg-primary-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                busyId === e.id && "border-primary bg-primary-subtle"
              )}
              aria-label={`Добавить ${e.name}`}
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
      <p className="text-muted-foreground text-right text-sm">
        Итог чека:{" "}
        <span className="text-foreground font-semibold tabular-nums">
          {formatMoney(total, currency)}
        </span>
      </p>
    </div>
  )
}
