"use client"

import { useState } from "react"
import { IconMinus, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/get-error-message"
import { GUEST_LABEL } from "@/lib/labels"
import type { GuestCategory, GuestInput } from "@/lib/api/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel: string
  pending: boolean
  onSubmit: (guests: GuestInput[]) => Promise<unknown>
}

/** Счётчики «Взрослые / Дети» для группы. Вместимость и цену проверяет backend. */
export function GuestsDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  pending,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <GuestsForm
            title={title}
            description={description}
            submitLabel={submitLabel}
            pending={pending}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <span className="text-lg font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-12"
          aria-label={`${label}: меньше`}
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
        >
          <IconMinus />
        </Button>
        <span
          className="w-8 text-center text-2xl font-semibold tabular-nums"
          aria-label={`${label}: количество`}
        >
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-12"
          aria-label={`${label}: больше`}
          disabled={value >= 50}
          onClick={() => onChange(value + 1)}
        >
          <IconPlus />
        </Button>
      </div>
    </div>
  )
}

function GuestsForm({
  title,
  description,
  submitLabel,
  pending,
  onSubmit,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [counts, setCounts] = useState<Record<GuestCategory, number>>({
    ADULT: 1,
    CHILD: 0,
  })
  const [error, setError] = useState("")
  const total = counts.ADULT + counts.CHILD

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const guests = (Object.keys(counts) as GuestCategory[])
      .filter((c) => counts[c] > 0)
      .map((category) => ({ category, quantity: counts[category] }))
    try {
      await onSubmit(guests)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось добавить гостей"))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <Counter
        label={GUEST_LABEL.ADULT}
        value={counts.ADULT}
        onChange={(v) => setCounts((c) => ({ ...c, ADULT: v }))}
      />
      <Counter
        label={GUEST_LABEL.CHILD}
        value={counts.CHILD}
        onChange={(v) => setCounts((c) => ({ ...c, CHILD: v }))}
      />
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
          disabled={total < 1 || pending}
        >
          {pending ? "Сохраняем…" : `${submitLabel} (${total})`}
        </Button>
      </DialogFooter>
    </form>
  )
}
