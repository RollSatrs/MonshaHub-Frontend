"use client"

import { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState, LoadingRows } from "@/components/state-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCurrentUser } from "@/hooks/use-current-user"
import { formatMoney } from "@/lib/money"
import { useOrganization } from "@/lib/queries/organization"
import { useRooms } from "@/lib/queries/rooms"
import { useHistory } from "@/lib/queries/visits"
import { formatDayTime } from "@/lib/time"
import { cn } from "@/lib/utils"

const PAGE = 50
const MAX = 200
const ALL = "all"

export default function HistoryPage() {
  const user = useCurrentUser()
  const isOwner = user.role === "OWNER"
  const org = useOrganization()
  const timezone = org.data?.timezone ?? "Asia/Almaty"
  const currency = org.data?.currency ?? "KZT"
  const rooms = useRooms(isOwner)

  const [status, setStatus] = useState<string>(ALL)
  const [roomId, setRoomId] = useState<string>(ALL)
  const [limit, setLimit] = useState(PAGE)

  const history = useHistory({
    ...(status !== ALL ? { status: status as "COMPLETED" | "CANCELLED" } : {}),
    ...(roomId !== ALL ? { roomId: Number(roomId) } : {}),
    limit,
  })

  return (
    <>
      <PageHeader
        title="История"
        description={
          isOwner
            ? "Завершённые и отменённые посещения вашей бани."
            : "Завершённые и отменённые посещения за последние 24 часа."
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setLimit(PAGE)
          }}
        >
          <SelectTrigger className="w-48" aria-label="Статус">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все статусы</SelectItem>
            <SelectItem value="COMPLETED">Завершённые</SelectItem>
            <SelectItem value="CANCELLED">Отменённые</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={roomId}
          onValueChange={(v) => {
            setRoomId(v)
            setLimit(PAGE)
          }}
        >
          <SelectTrigger className="w-56" aria-label="Помещение">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все помещения</SelectItem>
            {(rooms.data ?? []).map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.name}
                {!r.active ? " (архив)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {history.isPending ? (
        <LoadingRows />
      ) : history.isError ? (
        <ErrorState onRetry={() => history.refetch()} />
      ) : history.data.items.length === 0 ? (
        <EmptyState
          title="Посещений пока нет"
          description={
            isOwner
              ? "Здесь появятся завершённые посещения."
              : "За последние 24 часа завершённых посещений нет."
          }
        />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Посещение</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Начало</TableHead>
                  <TableHead>Конец</TableHead>
                  <TableHead className="text-right">Итог</TableHead>
                  <TableHead className="text-right">Оплачено</TableHead>
                  <TableHead>Пометки</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.items.map((v) => {
                  const cancelled = v.status === "CANCELLED"
                  const end = v.endedAt ?? v.cancelledAt
                  return (
                    <TableRow
                      key={v.id}
                      className={cn(cancelled && "text-muted-foreground")}
                      data-testid={`history-${v.id}`}
                    >
                      <TableCell>
                        <Link
                          href={`/visits/${v.id}`}
                          className="font-medium hover:underline"
                        >
                          №{v.id} · {v.roomName}
                        </Link>
                        {v.guests !== null && (
                          <p className="text-muted-foreground text-xs">
                            гостей: {v.guests}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{v.customerName ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDayTime(v.startedAt, timezone)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {end ? formatDayTime(end, timezone) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          cancelled && "line-through"
                        )}
                      >
                        {formatMoney(v.total, currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(v.paid, currency)}
                      </TableCell>
                      <TableCell className="space-y-1">
                        {cancelled && (
                          <Badge
                            variant="secondary"
                            className="text-danger bg-danger-subtle rounded-full"
                          >
                            ✕ Отменено
                          </Badge>
                        )}
                        {cancelled && v.cancelReason && (
                          <p className="text-xs">{v.cancelReason}</p>
                        )}
                        {v.voidedItemsCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-warning-subtle text-warning rounded-full"
                          >
                            ⚠ Убрано позиций: {v.voidedItemsCount}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
          {history.data.hasMore && limit < MAX && (
            <Button
              variant="outline"
              size="lg"
              className="self-center"
              onClick={() => setLimit((l) => Math.min(MAX, l + PAGE))}
            >
              Показать ещё
            </Button>
          )}
          {history.data.hasMore && limit >= MAX && (
            <p className="text-muted-foreground text-center text-sm">
              Показаны последние {MAX} записей — уточните фильтры.
            </p>
          )}
        </>
      )}
    </>
  )
}
