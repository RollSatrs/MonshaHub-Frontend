"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { StatePill } from "@/components/live/state-pill"
import { ROOM_TYPE_LABEL, VISIT_STATUS_LABEL } from "@/lib/labels"
import { formatCountdown, formatDayTime, formatDuration } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { VisitDetail } from "@/lib/api/types"

interface Props {
  visit: VisitDetail
  timezone: string
  /** «Сейчас» по серверным часам, мс */
  nowMs: number
}

/** Помещение, клиент, начало, конец и оставшееся время (отсчёт от серверного endsAt). */
export function VisitHeader({ visit, timezone, nowMs }: Props) {
  const active = visit.status === "ACTIVE"
  const remaining =
    active && visit.endsAt
      ? Math.floor((Date.parse(visit.endsAt) - nowMs) / 1000)
      : null
  const overtime = remaining !== null && remaining < 0

  return (
    <Card
      className={cn(
        "gap-3 p-5",
        overtime && "border-danger/40 bg-danger-subtle"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            Посещение №{visit.id} · {ROOM_TYPE_LABEL[visit.kind]}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {visit.roomName}
          </h1>
          <p className="mt-1 text-sm">
            {visit.customerName ?? "Клиент не указан"}
            {visit.customerPhone && (
              <span className="text-muted-foreground">
                {" "}
                · {visit.customerPhone}
              </span>
            )}
            {visit.guestsCount ? (
              <span className="text-muted-foreground">
                {" "}
                · {visit.guestsCount} чел.
              </span>
            ) : null}
            {visit.guests !== null && (
              <span className="text-muted-foreground">
                {" "}
                · гостей: {visit.guests}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {visit.timeState ? (
            <StatePill state={visit.timeState} />
          ) : (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full",
                visit.status === "COMPLETED" && "text-success",
                visit.status === "CANCELLED" && "text-danger bg-danger-subtle"
              )}
            >
              <span aria-hidden>
                {visit.status === "ACTIVE"
                  ? "●"
                  : visit.status === "COMPLETED"
                    ? "✓"
                    : "✕"}
              </span>
              {VISIT_STATUS_LABEL[visit.status]}
            </Badge>
          )}
          {remaining !== null && (
            <p
              className={cn(
                "font-mono text-4xl leading-none font-semibold tabular-nums",
                visit.timeState === "ENDING_SOON" && "text-warning",
                overtime && "text-danger"
              )}
              aria-label="Оставшееся время"
            >
              {formatCountdown(remaining)}
            </p>
          )}
          {overtime && (
            <p className="text-danger text-sm font-medium">
              Время вышло — продлите или завершите
            </p>
          )}
        </div>
      </div>

      <dl className="text-muted-foreground grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt>Начало</dt>
          <dd className="text-foreground font-medium">
            {formatDayTime(visit.startedAt, timezone)}
          </dd>
        </div>
        {visit.endsAt && (
          <div>
            <dt>Оплачено до</dt>
            <dd className="text-foreground font-medium">
              {formatDayTime(visit.endsAt, timezone)}
            </dd>
          </div>
        )}
        {visit.endedAt && (
          <div>
            <dt>Завершено</dt>
            <dd className="text-foreground font-medium">
              {formatDayTime(visit.endedAt, timezone)}
              {visit.completedByName && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {visit.completedByName}
                </span>
              )}
            </dd>
          </div>
        )}
        {visit.kind === "PRIVATE" && visit.timeStepMinutes && (
          <div>
            <dt>Шаг времени</dt>
            <dd className="text-foreground font-medium">
              {formatDuration(visit.timeStepMinutes)}
            </dd>
          </div>
        )}
      </dl>

      {visit.status === "CANCELLED" && (
        <p className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          ✕ Посещение отменено
          {visit.cancelledByName ? ` (${visit.cancelledByName})` : ""}
          {visit.cancelledAt
            ? `, ${formatDayTime(visit.cancelledAt, timezone)}`
            : ""}
          : {visit.cancelReason}
        </p>
      )}
    </Card>
  )
}
