"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { GuestsDialog } from "@/components/live/guests-dialog"
import { PrivateRoomCard } from "@/components/live/private-room-card"
import { PublicInsideDialog } from "@/components/live/public-inside-dialog"
import { PublicRoomCard } from "@/components/live/public-room-card"
import { StartVisitDialog } from "@/components/live/start-visit-dialog"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState, LoadingRows } from "@/components/state-views"
import { useServerNow } from "@/hooks/use-server-now"
import { useRouter } from "next/navigation"
import { getErrorMessage } from "@/lib/get-error-message"
import { formatMoney } from "@/lib/money"
import { useBoard, useFinishCleaning } from "@/lib/queries/live"
import { useStartPublicVisit } from "@/lib/queries/visits"
import { cn } from "@/lib/utils"
import type { LiveRoom } from "@/lib/api/types"

/**
 * «Баня сейчас» — главный экран. Состояния приходят с backend (опрос раз в 10 с);
 * между опросами идёт только локальный обратный отсчёт от серверного endsAt.
 * Когда локальный отсчёт пересекает порог, состояние запрашивается заново.
 */
export function LiveBoard() {
  const router = useRouter()
  const board = useBoard()
  const nowMs = useServerNow(board.data?.serverTime, board.dataUpdatedAt)
  const finishCleaning = useFinishCleaning()
  const startPublic = useStartPublicVisit()

  const [starting, setStarting] = useState<LiveRoom | null>(null)
  const [grouping, setGrouping] = useState<LiveRoom | null>(null)
  const [insideOf, setInsideOf] = useState<LiveRoom | null>(null)

  // пересечение порога локальным отсчётом → один внеочередной запрос (не чаще одного раза на состояние)
  const refetched = useRef(new Set<string>())
  const { data, refetch } = board
  useEffect(() => {
    if (!data) return
    for (const room of data.rooms) {
      if (!room.visit?.endsAt) continue
      const remainingMs = Date.parse(room.visit.endsAt) - nowMs
      const crossed =
        (room.state === "OCCUPIED" &&
          remainingMs <= data.endingSoonMinutes * 60_000) ||
        (room.state === "ENDING_SOON" && remainingMs < 0)
      const key = `${room.visit.id}:${room.state}`
      if (crossed && !refetched.current.has(key)) {
        refetched.current.add(key)
        void refetch()
      }
    }
  }, [data, nowMs, refetch])

  function onFinishCleaning(room: LiveRoom) {
    finishCleaning.mutate(room.id, {
      onSuccess: () => toast.success(`${room.name}: уборка завершена`),
      onError: (err) =>
        toast.error(getErrorMessage(err, "Не удалось завершить уборку")),
    })
  }

  const summary = data
    ? [
        ["Свободно", data.rooms.filter((r) => r.state === "AVAILABLE").length],
        [
          "Занято",
          data.rooms.filter((r) =>
            ["OCCUPIED", "ENDING_SOON", "OVERTIME"].includes(r.state)
          ).length,
        ],
        ["Уборка", data.rooms.filter((r) => r.state === "CLEANING").length],
      ]
    : []

  return (
    <>
      <PageHeader
        title="Баня сейчас"
        description="Состояние помещений и активных посещений в реальном времени"
      />

      {summary.length > 0 && (
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:w-fit sm:min-w-[420px]">
          <span className="sr-only">
            {summary.map(([label, n]) => `${label}: ${n}`).join(" · ")}
          </span>
          {summary.map(([label, n], index) => (
            <div
              key={label}
              className="flex min-h-14 items-center justify-between gap-4 border-r border-border px-3 last:border-r-0"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
              <strong
                className={cn(
                  "text-xl tabular-nums",
                  index === 0 && "text-success",
                  index === 1 && "text-primary",
                  index === 2 && "text-muted-foreground"
                )}
              >
                {n}
              </strong>
            </div>
          ))}
        </div>
      )}

      {board.isPending ? (
        <LoadingRows rows={4} />
      ) : board.isError && !board.data ? (
        <ErrorState onRetry={() => board.refetch()} />
      ) : data && data.rooms.length === 0 ? (
        <EmptyState
          title="Помещений пока нет"
          description="Владелец добавляет помещения и тарифы в разделе «Настройки бани → Помещения»."
        />
      ) : data ? (
        <>
          {board.isError && (
            <p
              role="alert"
              className="bg-warning-subtle text-warning rounded-md px-3 py-2 text-sm"
            >
              ⚠ Нет связи с сервером — показаны последние полученные данные.
              Пробуем снова…
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.rooms.map((room) =>
              room.type === "PRIVATE" ? (
                <PrivateRoomCard
                  key={room.id}
                  room={room}
                  nowMs={nowMs}
                  currency={data.currency}
                  timezone={data.timezone}
                  onStart={setStarting}
                  onFinishCleaning={onFinishCleaning}
                  cleaningPending={
                    finishCleaning.isPending &&
                    finishCleaning.variables === room.id
                  }
                />
              ) : (
                <PublicRoomCard
                  key={room.id}
                  room={room}
                  currency={data.currency}
                  onGroup={setGrouping}
                  onInside={setInsideOf}
                />
              )
            )}
          </div>

          <StartVisitDialog
            room={starting}
            board={data}
            onOpenChange={(o) => !o && setStarting(null)}
          />
          <GuestsDialog
            open={grouping !== null}
            onOpenChange={(o) => !o && setGrouping(null)}
            title={`${grouping?.name ?? ""}: группа`}
            description="Один чек на всю группу: вход, товары и оплата в одном счёте."
            submitLabel="Создать чек"
            pending={startPublic.isPending}
            onSubmit={async (guests) => {
              if (!grouping) return
              const visit = await startPublic.mutateAsync({
                roomId: grouping.id,
                guests,
              })
              toast.success(
                `Чек №${visit.id} · ${formatMoney(visit.total, data.currency)}`
              )
              router.push(`/visits/${visit.id}`)
            }}
          />
          <PublicInsideDialog
            room={insideOf}
            currency={data.currency}
            timezone={data.timezone}
            nowMs={nowMs}
            onOpenChange={(o) => !o && setInsideOf(null)}
          />
        </>
      ) : null}
    </>
  )
}
