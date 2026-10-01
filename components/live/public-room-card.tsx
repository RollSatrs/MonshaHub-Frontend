"use client"

import { IconUsers, IconUsersGroup } from "@tabler/icons-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { STATE_STYLES, StatePill } from "@/components/live/state-pill"
import { getErrorMessage } from "@/lib/get-error-message"
import { formatMoney } from "@/lib/money"
import { useStartPublicVisit } from "@/lib/queries/visits"
import { cn } from "@/lib/utils"
import type { GuestCategory, LiveRoom } from "@/lib/api/types"

interface Props {
  room: LiveRoom
  currency: string
  onGroup: (room: LiveRoom) => void
  onInside: (room: LiveRoom) => void
}

/**
 * Общественный зал: «37 / 60» и быстрые кнопки. Один тап «+ Взрослый» создаёт чек человека;
 * дальше к нему можно добавить товары и принять оплату. Цена — от backend (snapshot тарифа).
 */
export function PublicRoomCard({ room, currency, onGroup, onInside }: Props) {
  const router = useRouter()
  const start = useStartPublicVisit()
  const inside = room.inside ?? 0
  const full = room.state === "FULL"
  const percent = Math.min(100, Math.round((inside / room.capacity) * 100))
  const disabled = full || !room.hasTariff || start.isPending

  function quickAdd(category: GuestCategory) {
    start.mutate(
      { roomId: room.id, guests: [{ category, quantity: 1 }] },
      {
        onSuccess: (visit) => {
          toast.success(
            `Чек №${visit.id} · ${formatMoney(visit.total, currency)}`,
            {
              action: {
                label: "Открыть",
                onClick: () => router.push(`/visits/${visit.id}`),
              },
            }
          )
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, "Не удалось добавить гостя")),
      }
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-[156px] w-full flex-col gap-3 rounded-xl border p-4",
        STATE_STYLES[room.state].card
      )}
      data-testid={`room-${room.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{room.name}</h2>
        <StatePill state={room.state} />
      </div>

      <div>
        <p
          className="font-mono text-4xl leading-none font-semibold tabular-nums"
          aria-label="Гостей внутри"
        >
          {inside}{" "}
          <span className="text-muted-foreground text-2xl">
            / {room.capacity}
          </span>
        </p>
        <div
          className="bg-secondary mt-2 h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={inside}
          aria-valuemin={0}
          aria-valuemax={room.capacity}
          aria-label="Заполненность зала"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              full ? "bg-danger" : "bg-primary"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {!room.hasTariff && (
        <p className="text-warning bg-warning-subtle rounded-md px-2 py-1 text-sm">
          ⚠ Не задан тариф входа — настройте в «Помещениях»
        </p>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button
          size="lg"
          className="h-12 text-base"
          disabled={disabled}
          onClick={() => quickAdd("ADULT")}
        >
          + Взрослый
        </Button>
        <Button
          size="lg"
          className="h-12 text-base"
          variant="outline"
          disabled={disabled}
          onClick={() => quickAdd("CHILD")}
        >
          + Ребёнок
        </Button>
        <Button
          variant="outline"
          className="h-11"
          disabled={disabled}
          onClick={() => onGroup(room)}
        >
          <IconUsersGroup aria-hidden /> Группа
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => onInside(room)}
        >
          <IconUsers aria-hidden /> Внутри ({room.activeVisits ?? 0})
        </Button>
      </div>
    </div>
  )
}
