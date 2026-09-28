"use client"

import { useState } from "react"
import Link from "next/link"
import { IconPlus } from "@tabler/icons-react"
import { ActiveBadge } from "@/components/active-badge"
import { RoomCreateDialog } from "@/components/catalog/room-form-dialog"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState, LoadingRows } from "@/components/state-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROOM_TYPE_LABEL, tariffSummary } from "@/lib/labels"
import { useOrganization } from "@/lib/queries/organization"
import { useRooms } from "@/lib/queries/rooms"

export default function RoomsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const rooms = useRooms(showArchived)
  const org = useOrganization()
  const currency = org.data?.currency ?? "KZT"

  return (
    <>
      <PageHeader
        title="Помещения"
        description="Помещения бани и их тарифы. Цены рассчитывает и хранит backend."
        action={
          <Button onClick={() => setCreating(true)}>
            <IconPlus /> Добавить помещение
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Switch
          id="show-archived"
          checked={showArchived}
          onCheckedChange={setShowArchived}
        />
        <Label htmlFor="show-archived">Показать архивные</Label>
      </div>

      {rooms.isPending ? (
        <LoadingRows />
      ) : rooms.isError ? (
        <ErrorState onRetry={() => rooms.refetch()} />
      ) : rooms.data.length === 0 ? (
        <EmptyState
          title="Помещений пока нет"
          description="Добавьте первое помещение — например, VIP №1 или общий зал — и задайте ему тариф."
          action={
            <Button onClick={() => setCreating(true)}>
              Добавить помещение
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Вместимость</TableHead>
                <TableHead>Тариф</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.data.map((room) => {
                const summary = tariffSummary(room, currency)
                return (
                  <TableRow
                    key={room.id}
                    className={
                      room.active ? undefined : "text-muted-foreground"
                    }
                  >
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{ROOM_TYPE_LABEL[room.type]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {room.capacity}
                    </TableCell>
                    <TableCell>
                      {summary ?? (
                        <Badge
                          variant="secondary"
                          className="bg-warning-subtle text-warning rounded-full"
                        >
                          ⚠ Тариф не задан
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={room.active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/rooms/${room.id}`}>Настроить</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <RoomCreateDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}
