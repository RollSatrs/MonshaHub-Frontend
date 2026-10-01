"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconPhone, IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { BookingDialog } from "@/components/bookings/booking-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState, LoadingRows } from "@/components/state-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getErrorMessage } from "@/lib/get-error-message"
import {
  useBookings,
  useCloseBooking,
  useStartBookingVisit,
} from "@/lib/queries/bookings"
import { useOrganization } from "@/lib/queries/organization"
import { dayKey, formatDay, formatDuration, formatTime } from "@/lib/time"
import type { Booking } from "@/lib/api/types"

const HORIZON_DAYS = 14

export default function BookingsPage() {
  const router = useRouter()
  const org = useOrganization()
  const timezone = org.data?.timezone ?? "Asia/Almaty"
  const [range] = useState(() => ({
    to: new Date(Date.now() + HORIZON_DAYS * 24 * 3_600_000).toISOString(),
  }))
  const bookings = useBookings({ to: range.to })
  const close = useCloseBooking()
  const startVisit = useStartBookingVisit()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Booking | null>(null)
  const [closing, setClosing] = useState<{
    booking: Booking
    kind: "cancel" | "no-show"
  } | null>(null)

  const groups = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings.data ?? []) {
      const key = dayKey(b.startsAt, timezone)
      map.set(key, [...(map.get(key) ?? []), b])
    }
    return [...map.entries()]
  }, [bookings.data, timezone])

  function start(b: Booking) {
    startVisit.mutate(
      { id: b.id },
      {
        onSuccess: (v) => {
          toast.success("Посещение начато по брони")
          router.push(`/visits/${v.id}`)
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, "Не удалось начать посещение")),
      }
    )
  }

  function confirmClose() {
    if (!closing) return
    close.mutate(
      { id: closing.booking.id, kind: closing.kind },
      {
        onSuccess: () => {
          toast.success(
            closing.kind === "cancel" ? "Бронь отменена" : "Отмечено: не пришли"
          )
          setClosing(null)
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Не удалось выполнить действие"))
          setClosing(null)
        },
      }
    )
  }

  return (
    <>
      <PageHeader
        title="Брони"
        description={`Предстоящие брони на ${HORIZON_DAYS} дней. Клиент может прийти и без брони — тогда начните посещение на экране «Баня сейчас».`}
        action={
          <Button
            size="lg"
            onClick={() => setCreating(true)}
            disabled={!org.data}
          >
            <IconPlus /> Новая бронь
          </Button>
        }
      />

      {bookings.isPending ? (
        <LoadingRows />
      ) : bookings.isError ? (
        <ErrorState onRetry={() => bookings.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Предстоящих броней нет"
          description="Создайте бронь, чтобы помещение было зарезервировано на нужное время."
          action={
            <Button onClick={() => setCreating(true)}>Новая бронь</Button>
          }
        />
      ) : (
        groups.map(([key, list]) => (
          <section key={key} className="space-y-2">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {formatDay(list[0].startsAt, timezone)}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((b) => (
                <Card
                  key={b.id}
                  className="gap-3 p-4"
                  data-testid={`booking-${b.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xl font-semibold tabular-nums">
                        {formatTime(b.startsAt, timezone)}–
                        {formatTime(b.endsAt, timezone)}
                        <span className="text-muted-foreground ml-2 text-sm font-normal">
                          {formatDuration(b.durationMinutes)}
                        </span>
                      </p>
                      <p className="font-medium">{b.roomName}</p>
                    </div>
                    {b.isLate && (
                      <Badge
                        variant="secondary"
                        className="bg-warning-subtle text-warning rounded-full"
                      >
                        ⚠ Время наступило
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    <p>{b.customerName}</p>
                    <a
                      href={`tel:${b.customerPhone.replace(/[^+\d]/g, "")}`}
                      className="text-muted-foreground inline-flex items-center gap-1 hover:underline"
                    >
                      <IconPhone className="size-3.5" aria-hidden />{" "}
                      {b.customerPhone}
                    </a>
                    {b.notes && (
                      <p className="text-muted-foreground mt-1">{b.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="h-11"
                      onClick={() => start(b)}
                      disabled={startVisit.isPending}
                    >
                      Начать
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11"
                      onClick={() => setEditing(b)}
                    >
                      Изменить
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-11"
                      onClick={() =>
                        setClosing({ booking: b, kind: "no-show" })
                      }
                    >
                      Не пришли
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-danger h-11"
                      onClick={() => setClosing({ booking: b, kind: "cancel" })}
                    >
                      Отменить
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}

      {org.data && (
        <>
          <BookingDialog
            open={creating}
            onOpenChange={setCreating}
            timezone={timezone}
            timeStepMinutes={org.data.timeStepMinutes}
          />
          {editing && (
            <BookingDialog
              open
              booking={editing}
              onOpenChange={(o) => !o && setEditing(null)}
              timezone={timezone}
              timeStepMinutes={org.data.timeStepMinutes}
            />
          )}
        </>
      )}
      <ConfirmDialog
        open={closing !== null}
        onOpenChange={(o) => !o && setClosing(null)}
        title={
          closing?.kind === "cancel"
            ? "Отменить бронь?"
            : "Отметить, что клиент не пришёл?"
        }
        description={
          closing
            ? `${closing.booking.customerName}, ${closing.booking.roomName}, ${formatTime(closing.booking.startsAt, timezone)}. Время освободится для других.`
            : undefined
        }
        confirmLabel={
          closing?.kind === "cancel" ? "Отменить бронь" : "Не пришли"
        }
        destructive
        pending={close.isPending}
        onConfirm={confirmClose}
      />
    </>
  )
}
