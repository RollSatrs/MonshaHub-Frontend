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
import { getErrorMessage } from "@/lib/get-error-message"
import { useCreateCashier } from "@/lib/queries/staff"

export function CashierFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateCashier()
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!fullname.trim()) return setError("Укажите имя")
    if (password.length < 8)
      return setError("Пароль должен содержать не менее 8 символов")
    try {
      await create.mutateAsync({
        fullname: fullname.trim(),
        email: email.trim(),
        password,
      })
      toast.success("Кассир добавлен")
      setFullname("")
      setEmail("")
      setPassword("")
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось добавить кассира"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Новый кассир</DialogTitle>
            <DialogDescription>
              Кассир войдёт по этому email и паролю.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cashier-name">Имя</FieldLabel>
              <Input
                id="cashier-name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                maxLength={255}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cashier-email">Email</FieldLabel>
              <Input
                id="cashier-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cashier-password">Пароль</FieldLabel>
              <Input
                id="cashier-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FieldDescription>Не менее 8 символов.</FieldDescription>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Добавление…" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
