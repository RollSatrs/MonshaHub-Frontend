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
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/get-error-message"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  quickReasons: string[]
  pending: boolean
  onConfirm: (reason: string) => Promise<unknown>
}

/** Действие с обязательной причиной (убрать позицию, отменить посещение): кто, когда и почему сохраняется. */
export function ReasonDialog(props: Props) {
  const { open, onOpenChange } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <ReasonForm {...props} />}</DialogContent>
    </Dialog>
  )
}

function ReasonForm({
  onOpenChange,
  title,
  description,
  confirmLabel,
  quickReasons,
  pending,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return setError("Укажите причину")
    setError("")
    try {
      await onConfirm(reason.trim())
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось выполнить действие"))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap gap-2">
        {quickReasons.map((r) => (
          <Button
            key={r}
            type="button"
            size="sm"
            variant={reason === r ? "default" : "outline"}
            onClick={() => setReason(r)}
          >
            {r}
          </Button>
        ))}
      </div>
      <Field>
        <FieldLabel htmlFor="reason">Причина</FieldLabel>
        <Input
          id="reason"
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      {error && (
        <p
          role="alert"
          className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm"
        >
          ⚠️ {error}
        </p>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Назад
        </Button>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Выполняется…" : confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
