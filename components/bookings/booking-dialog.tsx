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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage, parseApiError } from "@/lib/get-error-message"
import { useCreateBooking, useUpdateBooking } from "@/lib/queries/bookings"
import { useRooms } from "@/lib/queries/rooms"
import {
  durationOptions,
  formatDuration,
  formatTime,
  isoToZonedInputs,
  zonedTimeToIso,
} from "@/lib/time"
import type { Booking } from "@/lib/api/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking?: Booking
  timezone: string
  timeStepMinutes: number
}

/** Создание и перенос брони. Время вводится в часовом поясе бани; пересечения проверяет backend. */
export function BookingDialog({
  open,
  onOpenChange,
  booking,
  timezone,
  timeStepMinutes,
}: Props) {
  return (
    // modal=false: без этого вложенный Select конфликтует с фокус-скоупом Dialog
    // (два focus trap'а одновременно приводят к зацикливанию фокуса в jsdom-тестах)
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent>
        {open && (
          <BookingForm
            key={booking?.id ?? "new"}
            booking={booking}
            timezone={timezone}
            step={timeStepMinutes}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function BookingForm({
  booking,
  timezone,
  step,
  onClose,
}: {
  booking?: Booking
  timezone: string
  step: number
  onClose: () => void
}) {
  const rooms = useRooms(false)
  const create = useCreateBooking()
  const update = useUpdateBooking()
  const privateRooms = (rooms.data ?? []).filter((r) => r.type === "PRIVATE")

  // начальные дата/время считаются один раз (ближайший час), а не при каждом рендере
  const [initial] = useState(() =>
    booking
      ? isoToZonedInputs(booking.startsAt, timezone)
      : isoToZonedInputs(
          new Date(Math.ceil(Date.now() / 3_600_000) * 3_600_000).toISOString(),
          timezone
        )
  )

  const [roomId, setRoomId] = useState<string>(
    booking ? String(booking.roomId) : ""
  )
  const [name, setName] = useState(booking?.customerName ?? "")
  const [phone, setPhone] = useState(booking?.customerPhone ?? "")
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [minutes, setMinutes] = useState(
    booking?.durationMinutes ?? Math.max(step, 60)
  )
  const [notes, setNotes] = useState(booking?.notes ?? "")
  const [error, setError] = useState("")
  const pending = create.isPending || update.isPending
  const options = [...new Set([...durationOptions(step, 360), minutes])].sort(
    (a, b) => a - b
  )

  function onError(err: unknown) {
    const { code, meta } = parseApiError(err)
    const from =
      typeof meta?.conflictStartsAt === "string" ? meta.conflictStartsAt : null
    const to =
      typeof meta?.conflictEndsAt === "string" ? meta.conflictEndsAt : null
    setError(
      code === "BOOKING_CONFLICT" && from && to
        ? `Помещение занято ${formatTime(from, timezone)}–${formatTime(to, timezone)}. Выберите другое время.`
        : getErrorMessage(err, "Не удалось сохранить бронь")
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!booking && !roomId) return setError("Выберите помещение")
    if (!name.trim()) return setError("Укажите имя клиента")
    if (!phone.trim()) return setError("Укажите телефон")
    if (!date || !time) return setError("Укажите дату и время")
    const startsAt = zonedTimeToIso(date, time, timezone)

    if (booking) {
      update.mutate(
        {
          id: booking.id,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          startsAt,
          durationMinutes: minutes,
          notes: notes.trim(),
        },
        {
          onSuccess: () => {
            toast.success("Бронь изменена")
            onClose()
          },
          onError,
        }
      )
    } else {
      create.mutate(
        {
          roomId: Number(roomId),
          customerName: name.trim(),
          customerPhone: phone.trim(),
          startsAt,
          durationMinutes: minutes,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        {
          onSuccess: () => {
            toast.success("Бронь создана")
            onClose()
          },
          onError,
        }
      )
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{booking ? "Изменить бронь" : "Новая бронь"}</DialogTitle>
        <DialogDescription>
          Время указывается по часовому поясу бани ({timezone}). Брони не должны
          пересекаться.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="booking-room">Помещение</FieldLabel>
          <Select
            value={roomId || undefined}
            onValueChange={setRoomId}
            disabled={!!booking}
          >
            <SelectTrigger id="booking-room" className="w-full">
              <SelectValue
                placeholder={
                  rooms.isPending ? "Загрузка…" : "Выберите помещение"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {privateRooms.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
              {booking &&
                !privateRooms.some((r) => r.id === booking.roomId) && (
                  <SelectItem value={String(booking.roomId)}>
                    {booking.roomName}
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="booking-name">Клиент</FieldLabel>
            <Input
              id="booking-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="booking-phone">Телефон</FieldLabel>
            <Input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 701 000 00 00"
              required
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="booking-date">Дата</FieldLabel>
            <Input
              id="booking-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="booking-time">Время</FieldLabel>
            <Input
              id="booking-time"
              type="time"
              step={60}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Длительность</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Длительность"
          >
            {options.map((m) => (
              <Button
                key={m}
                type="button"
                variant={minutes === m ? "default" : "outline"}
                className="h-11 min-w-20"
                aria-pressed={minutes === m}
                onClick={() => setMinutes(m)}
              >
                {formatDuration(m)}
              </Button>
            ))}
          </div>
        </div>
        <Field>
          <FieldLabel htmlFor="booking-notes">
            Заметка (необязательно)
          </FieldLabel>
          <Input
            id="booking-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
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
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Сохраняем…" : booking ? "Сохранить" : "Создать бронь"}
        </Button>
      </DialogFooter>
    </form>
  )
}
