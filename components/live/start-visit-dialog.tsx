"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconMinus, IconPlus } from "@tabler/icons-react"
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
import { getErrorMessage, parseApiError } from "@/lib/get-error-message"
import { useStartBookingVisit } from "@/lib/queries/bookings"
import { useStartPrivateVisit } from "@/lib/queries/visits"
import { durationOptions, formatDuration, formatTime } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { LiveBoard, LiveRoom } from "@/lib/api/types"

interface Props {
  room: LiveRoom | null
  board: LiveBoard
  onOpenChange: (open: boolean) => void
}

/** Начать посещение PRIVATE-помещения: walk-in или по ближайшей брони. Длительность выбирает кассир. */
export function StartVisitDialog({ room, board, onOpenChange }: Props) {
  return (
    <Dialog open={room !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {room && (
          <StartForm
            key={room.id}
            room={room}
            board={board}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function StartForm({
  room,
  board,
  onClose,
}: {
  room: LiveRoom
  board: LiveBoard
  onClose: () => void
}) {
  const router = useRouter()
  const step = board.timeStepMinutes
  const start = useStartPrivateVisit()
  const startBooking = useStartBookingVisit()
  const options = durationOptions(step)
  const [minutes, setMinutes] = useState(options.find((m) => m >= 60) ?? step)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")

  const limit = room.availableMinutes // сколько свободно до ближайшей брони (null — без ограничения)
  const tooLong = (m: number) => limit !== null && m > limit
  const pending = start.isPending || startBooking.isPending

  function onError(err: unknown) {
    const { code, meta } = parseApiError(err)
    const available =
      typeof meta?.availableMinutes === "number" ? meta.availableMinutes : null
    setError(
      code === "BOOKING_CONFLICT" && available !== null
        ? `Пересечение с бронью: свободно ещё ${formatDuration(available)}. Выберите время короче.`
        : getErrorMessage(err, "Не удалось начать посещение")
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    start.mutate(
      {
        roomId: room.id,
        durationMinutes: minutes,
        ...(name.trim() ? { customerName: name.trim() } : {}),
        ...(phone.trim() ? { customerPhone: phone.trim() } : {}),
      },
      {
        onSuccess: (visit) => {
          onClose()
          router.push(`/visits/${visit.id}`)
        },
        onError,
      }
    )
  }

  function startFromBooking() {
    if (!room.nextBooking) return
    setError("")
    startBooking.mutate(
      { id: room.nextBooking.id },
      {
        onSuccess: (visit) => {
          toast.success("Посещение начато по брони")
          onClose()
          router.push(`/visits/${visit.id}`)
        },
        onError,
      }
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{room.name}: начать посещение</DialogTitle>
        <DialogDescription>
          Выберите оплачиваемое время. Продлить можно в любой момент.
        </DialogDescription>
      </DialogHeader>

      {room.nextBooking && (
        <div className="bg-primary-subtle rounded-lg border border-primary/20 p-3 text-sm">
          <p className="font-medium">
            Ближайшая бронь: {room.nextBooking.customerName},{" "}
            {formatTime(room.nextBooking.startsAt, board.timezone)}–
            {formatTime(room.nextBooking.endsAt, board.timezone)}
          </p>
          {limit !== null && (
            <p className="text-muted-foreground mt-0.5">
              До брони свободно {formatDuration(limit)}.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={startFromBooking}
            disabled={pending}
          >
            Начать по брони
          </Button>
        </div>
      )}

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
              className={cn("h-12 min-w-20 text-base")}
              disabled={tooLong(m)}
              onClick={() => setMinutes(m)}
              aria-pressed={minutes === m}
            >
              {formatDuration(m)}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={`Меньше на ${step} мин`}
            disabled={minutes <= step}
            onClick={() => setMinutes((m) => Math.max(step, m - step))}
          >
            <IconMinus />
          </Button>
          <span
            className="min-w-28 text-center text-xl font-semibold tabular-nums"
            aria-live="polite"
          >
            {formatDuration(minutes)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={`Больше на ${step} мин`}
            disabled={tooLong(minutes + step) || minutes + step > 24 * 60}
            onClick={() => setMinutes((m) => m + step)}
          >
            <IconPlus />
          </Button>
        </div>
        <p className="text-muted-foreground mt-1 text-center text-xs">
          шаг {step} мин
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="visit-customer">
            Клиент (необязательно)
          </FieldLabel>
          <Input
            id="visit-customer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            placeholder="Имя"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="visit-phone">Телефон (необязательно)</FieldLabel>
          <Input
            id="visit-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 701 000 00 00"
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
        <Button
          type="submit"
          size="lg"
          className="h-12 text-base"
          disabled={pending || !room.hasTariff || tooLong(minutes)}
        >
          {pending ? "Запускаем…" : "Начать посещение"}
        </Button>
      </DialogFooter>
    </form>
  )
}
