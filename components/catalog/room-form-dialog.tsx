"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/get-error-message"
import { ROOM_TYPE_LABEL } from "@/lib/labels"
import { useCreateRoom } from "@/lib/queries/rooms"
import type { RoomType } from "@/lib/api/types"

export function RoomCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const create = useCreateRoom()
  const [name, setName] = useState("")
  const [type, setType] = useState<RoomType>("PRIVATE")
  const [capacity, setCapacity] = useState("6")
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const cap = Number(capacity)
    if (!name.trim()) return setError("Укажите название")
    if (!Number.isInteger(cap) || cap < 1 || cap > 1000)
      return setError("Вместимость — целое число от 1 до 1000")
    try {
      const room = await create.mutateAsync({
        name: name.trim(),
        type,
        capacity: cap,
      })
      toast.success("Помещение создано. Теперь задайте тариф.")
      onOpenChange(false)
      setName("")
      router.push(`/rooms/${room.id}`)
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось создать помещение"))
    }
  }

  return (
    // modal=false: без этого вложенный Select конфликтует с фокус-скоупом Dialog
    // (два focus trap'а одновременно приводят к зацикливанию фокуса в jsdom-тестах)
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Новое помещение</DialogTitle>
            <DialogDescription>
              Тип помещения нельзя изменить после создания — от него зависят
              тарифы.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="room-name">Название</FieldLabel>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VIP №1"
                maxLength={255}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="room-type">Тип</FieldLabel>
              <Select
                value={type}
                onValueChange={(v) => setType(v as RoomType)}
              >
                <SelectTrigger id="room-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">
                    {ROOM_TYPE_LABEL.PRIVATE} — арендует клиент или группа
                  </SelectItem>
                  <SelectItem value="PUBLIC">
                    {ROOM_TYPE_LABEL.PUBLIC} — общий зал, вход по билетам
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                {type === "PRIVATE"
                  ? "Тариф: почасовой."
                  : "Тариф: цена входа для взрослого и ребёнка."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="room-capacity">Вместимость</FieldLabel>
              <Input
                id="room-capacity"
                type="number"
                min={1}
                max={1000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Создание…" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
