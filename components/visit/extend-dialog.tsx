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
import { getErrorMessage, parseApiError } from "@/lib/get-error-message"
import { formatMoney } from "@/lib/money"
import { useExtendVisit } from "@/lib/queries/visits"
import { durationOptions, formatDuration } from "@/lib/time"
import type { VisitDetail } from "@/lib/api/types"

interface Props {
  visit: VisitDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Продление на целое число шагов. Стоимость и доступность (следующая бронь) определяет backend. */
export function ExtendDialog({ visit, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ExtendForm visit={visit} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ExtendForm({
  visit,
  onClose,
}: {
  visit: VisitDetail
  onClose: () => void
}) {
  const step = visit.timeStepMinutes ?? 60
  const options = durationOptions(step, 240)
  const extend = useExtendVisit(visit.id)
  const [minutes, setMinutes] = useState(options.includes(60) ? 60 : step)
  const [error, setError] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    extend.mutate(
      { minutes },
      {
        onSuccess: onClose,
        onError: (err) => {
          const { code, meta } = parseApiError(err)
          const available =
            typeof meta?.availableMinutes === "number"
              ? meta.availableMinutes
              : null
          setError(
            code === "BOOKING_CONFLICT"
              ? `Дальше бронь${available !== null ? `: можно продлить не более чем на ${formatDuration(available)}` : ""}. Продление невозможно.`
              : getErrorMessage(err, "Не удалось продлить")
          )
        },
      }
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Продлить время</DialogTitle>
        <DialogDescription>
          {visit.hourlyRate
            ? `Ставка ${formatMoney(visit.hourlyRate, visit.currency)} за час. `
            : ""}
          Продление считается от текущего конца времени.
        </DialogDescription>
      </DialogHeader>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="На сколько продлить"
      >
        {options.map((m) => (
          <Button
            key={m}
            type="button"
            variant={minutes === m ? "default" : "outline"}
            className="h-12 min-w-20 text-base"
            aria-pressed={minutes === m}
            onClick={() => setMinutes(m)}
          >
            +{formatDuration(m)}
          </Button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm"
        >
          ⚠️ {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button
          type="submit"
          size="lg"
          className="h-12 text-base"
          disabled={extend.isPending}
        >
          {extend.isPending
            ? "Продлеваем…"
            : `Продлить на ${formatDuration(minutes)}`}
        </Button>
      </DialogFooter>
    </form>
  )
}
