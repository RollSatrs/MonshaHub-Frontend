"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { getErrorMessage, parseApiError } from "@/lib/get-error-message"

/**
 * Второстепенная техническая операция: физическое удаление записи, которая никогда не использовалась.
 * Основной сценарий — архивация. Если запись уже использовалась, backend ответит ENTITY_IN_USE.
 */
export function PermanentDelete({
  entity,
  onDelete,
  onDeleted,
}: {
  entity: string
  onDelete: () => Promise<unknown>
  onDeleted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function confirm() {
    setPending(true)
    try {
      await onDelete()
      toast.success("Удалено")
      setOpen(false)
      onDeleted?.()
    } catch (err) {
      const { code } = parseApiError(err)
      toast.error(
        code === "ENTITY_IN_USE"
          ? `${entity} уже использовался(-ась) — его нельзя удалить. Отправьте в архив.`
          : getErrorMessage(err, "Не удалось удалить")
      )
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="text-muted-foreground hover:text-destructive h-auto p-0 text-xs"
        onClick={() => setOpen(true)}
      >
        Удалить навсегда…
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Удалить навсегда?"
        description={`Это возможно только для записи, которая ещё ни разу не использовалась. Обычно достаточно отправить её в архив. Удаление нельзя отменить.`}
        confirmLabel="Удалить навсегда"
        destructive
        pending={pending}
        onConfirm={confirm}
      />
    </>
  )
}
