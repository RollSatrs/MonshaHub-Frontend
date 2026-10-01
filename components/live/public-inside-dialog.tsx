"use client"

import Link from "next/link"
import { toast } from "sonner"
import { ErrorState, LoadingRows } from "@/components/state-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/get-error-message"
import { PAYMENT_STATUS_LABEL } from "@/lib/labels"
import { formatMoney } from "@/lib/money"
import { useCompletePaid, useInside } from "@/lib/queries/live"
import { formatDuration, formatTime } from "@/lib/time"
import type { LiveRoom } from "@/lib/api/types"

interface Props {
  room: LiveRoom | null
  currency: string
  timezone: string
  nowMs: number
  onOpenChange: (open: boolean) => void
}

/** «Внутри сейчас»: активные чеки зала. Выход = завершение чека (после полной оплаты). */
export function PublicInsideDialog({
  room,
  currency,
  timezone,
  nowMs,
  onOpenChange,
}: Props) {
  const inside = useInside(room?.id ?? null)
  const completePaid = useCompletePaid()
  const paidCount =
    inside.data?.visits.filter((v) => v.paymentStatus === "PAID").length ?? 0

  function finishPaid() {
    if (!room) return
    completePaid.mutate(room.id, {
      onSuccess: (r) =>
        toast.success(
          r.completed
            ? `Завершено чеков: ${r.completed}`
            : "Нет оплаченных чеков"
        ),
      onError: (err) =>
        toast.error(getErrorMessage(err, "Не удалось завершить")),
    })
  }

  return (
    <Dialog open={room !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{room?.name}: внутри сейчас</DialogTitle>
          <DialogDescription>
            {inside.data
              ? `${inside.data.inside} из ${inside.data.capacity} человек · ${inside.data.visits.length} чеков`
              : "Загрузка…"}
          </DialogDescription>
        </DialogHeader>

        {inside.isPending ? (
          <LoadingRows rows={3} />
        ) : inside.isError ? (
          <ErrorState onRetry={() => inside.refetch()} />
        ) : inside.data.visits.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            В зале никого нет.
          </p>
        ) : (
          <>
            <ul className="max-h-96 divide-y overflow-auto rounded-lg border">
              {inside.data.visits.map((v) => {
                const minutesInside = Math.max(
                  0,
                  Math.floor((nowMs - Date.parse(v.startedAt)) / 60_000)
                )
                return (
                  <li key={v.visitId}>
                    <Link
                      href={`/visits/${v.visitId}`}
                      className="hover:bg-muted flex items-center justify-between gap-3 p-3"
                    >
                      <div>
                        <p className="font-medium">
                          Чек №{v.visitId} · {v.guests} чел.
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            ({v.adults} взр.
                            {v.children ? `, ${v.children} дет.` : ""})
                          </span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          вошли в {formatTime(v.startedAt, timezone)} · внутри{" "}
                          {formatDuration(minutesInside)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">
                          {formatMoney(v.total, currency)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={
                            v.paymentStatus === "PAID"
                              ? "text-success rounded-full"
                              : "text-warning bg-warning-subtle rounded-full"
                          }
                        >
                          {v.paymentStatus === "PAID" ? "● " : "○ "}
                          {PAYMENT_STATUS_LABEL[v.paymentStatus]}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <Button
              variant="outline"
              size="lg"
              className="h-12"
              onClick={finishPaid}
              disabled={completePaid.isPending || paidCount === 0}
            >
              Завершить оплаченные ({paidCount})
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
