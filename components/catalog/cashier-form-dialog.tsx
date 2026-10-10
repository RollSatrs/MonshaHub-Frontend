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
import { useBranches } from "@/lib/queries/branches"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CashierFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateCashier()
  const branches = useBranches()
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [branchId, setBranchId] = useState("")
  const [error, setError] = useState("")

  const selectedBranchId =
    branchId || String(branches.data?.find((branch) => branch.active)?.id ?? "")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!fullname.trim()) return setError("Укажите имя")
    if (!selectedBranchId) return setError("Выберите филиал")
    if (!/^\d{4}$/.test(pin)) return setError("PIN должен состоять из 4 цифр")
    try {
      await create.mutateAsync({
        fullname: fullname.trim(),
        email: email.trim(),
        pin,
        branchId: Number(selectedBranchId),
      })
      toast.success("Кассир добавлен")
      setFullname("")
      setEmail("")
      setPin("")
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
              Назначьте филиал и PIN для входа кассира на рабочем месте.
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
              <FieldLabel htmlFor="cashier-branch">Филиал</FieldLabel>
              <Select value={selectedBranchId} onValueChange={setBranchId}>
                <SelectTrigger id="cashier-branch" className="min-h-12 w-full">
                  <SelectValue placeholder="Выберите филиал" />
                </SelectTrigger>
                <SelectContent>
                  {branches.data
                    ?.filter((branch) => branch.active)
                    .map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="cashier-pin">PIN-код</FieldLabel>
              <Input
                id="cashier-pin"
                inputMode="numeric"
                autoComplete="new-password"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                maxLength={4}
                required
              />
              <FieldDescription>Ровно 4 цифры.</FieldDescription>
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
