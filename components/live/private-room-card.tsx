"use client"

import Link from "next/link"
import { IconSparkles, IconClockHour4 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { STATE_STYLES, StatePill } from "@/components/live/state-pill"
import { formatCountdown, formatDuration, formatTime } from "@/lib/time"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import type { LiveRoom } from "@/lib/api/types"

interface Props {
  room: LiveRoom
  /** «Сейчас» по серверным часам, мс */
  nowMs: number
  currency: string
  timezone: string
  onStart: (room: LiveRoom) => void
  onFinishCleaning: (room: LiveRoom) => void
  cleaningPending: boolean
}

const cardBase =
  "flex min-h-[156px] w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"

/** Карточка PRIVATE-помещения. Состояние приходит с backend; здесь только показ и локальный отсчёт. */
export function PrivateRoomCard({
  room,
  nowMs,
  currency,
  timezone,
  onStart,
  onFinishCleaning,
  cleaningPending,
}: Props) {
  const styles = STATE_STYLES[room.state]

  if (room.state === "CLEANING") {
    return (
      <div
        className={cn(cardBase, styles.card)}
        data-testid={`room-${room.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">{room.name}</h2>
          <StatePill state="CLEANING" />
        </div>
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <IconSparkles className="size-4" aria-hidden />
          {room.cleaningStartedAt
            ? `Убираем с ${formatTime(room.cleaningStartedAt, timezone)}`
            : "Идёт уборка"}
        </p>
        <Button
          size="lg"
          className="mt-auto h-12 text-base"
          onClick={() => onFinishCleaning(room)}
          disabled={cleaningPending}
        >
          {cleaningPending ? "Сохраняем…" : "Уборка завершена"}
        </Button>
      </div>
    )
  }

  if (room.visit) {
    const remaining = room.visit.endsAt
      ? Math.floor((Date.parse(room.visit.endsAt) - nowMs) / 1000)
      : null
    const balance = room.visit.balance
    const unpaid = Number(balance) > 0
    return (
      <Link
        href={`/visits/${room.visit.id}`}
        className={cn(cardBase, styles.card)}
        data-testid={`room-${room.id}`}
        aria-label={`${room.name}: ${room.state}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">{room.name}</h2>
          <StatePill state={room.state} />
        </div>
        {remaining !== null && (
          <p
            className={cn(
              "font-mono text-4xl leading-none font-semibold tabular-nums",
              room.state === "OVERTIME" && "text-danger",
              room.state === "ENDING_SOON" && "text-warning"
            )}
            aria-label="Оставшееся время"
          >
            {formatCountdown(remaining)}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {room.visit.customerName ?? "Без имени"}
            </p>
            <p className="text-muted-foreground text-xs">
              {unpaid
                ? `Осталось оплатить ${formatMoney(balance, currency)}`
                : "Оплачено"}
            </p>
          </div>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(room.visit.total, currency)}
          </p>
        </div>
      </Link>
    )
  }

  // свободно
  return (
    <button
      type="button"
      className={cn(cardBase, styles.card, !room.hasTariff && "opacity-70")}
      onClick={() => onStart(room)}
      data-testid={`room-${room.id}`}
      aria-label={`${room.name}: свободно, начать посещение`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{room.name}</h2>
        <StatePill state="AVAILABLE" />
      </div>
      {!room.hasTariff ? (
        <p className="text-warning bg-warning-subtle rounded-md px-2 py-1 text-sm">
          ⚠ Не задан тариф — настройте в «Помещениях»
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Нажмите, чтобы начать посещение
        </p>
      )}
      <div className="mt-auto text-sm">
        {room.nextBooking ? (
          <p className="flex items-center gap-1.5 font-medium">
            <IconClockHour4 className="size-4" aria-hidden />
            Бронь в {formatTime(room.nextBooking.startsAt, timezone)} ·{" "}
            {room.nextBooking.customerName}
            {room.availableMinutes !== null && (
              <span className="text-muted-foreground font-normal">
                {" "}
                (свободно {formatDuration(room.availableMinutes)})
              </span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">Ближайших броней нет</p>
        )}
      </div>
    </button>
  )
}
