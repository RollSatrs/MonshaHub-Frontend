"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"
import { toast } from "sonner"
import { ActiveBadge } from "@/components/active-badge"
import { TariffEditor } from "@/components/catalog/tariff-editor"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { PermanentDelete } from "@/components/permanent-delete"
import { ErrorState, LoadingRows } from "@/components/state-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage, parseApiError } from "@/lib/get-error-message"
import { ROOM_TYPE_LABEL } from "@/lib/labels"
import { useDeleteRoom, useRoom, useUpdateRoom } from "@/lib/queries/rooms"
import type { Room } from "@/lib/api/types"

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const roomId = Number(id)
  const room = useRoom(roomId)

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/rooms">
          <IconArrowLeft /> Все помещения
        </Link>
      </Button>
      {room.isPending ? (
        <LoadingRows rows={3} />
      ) : room.isError ? (
        parseApiError(room.error).code === "NOT_FOUND" ? (
          <ErrorState message="Помещение не найдено" />
        ) : (
          <ErrorState onRetry={() => room.refetch()} />
        )
      ) : (
        <RoomDetails room={room.data} />
      )}
    </>
  )
}

function RoomDetails({ room }: { room: Room }) {
  const router = useRouter()
  const update = useUpdateRoom(room.id)
  const remove = useDeleteRoom()
  const [name, setName] = useState(room.name)
  const [capacity, setCapacity] = useState(String(room.capacity))
  const [sortOrder, setSortOrder] = useState(String(room.sortOrder))
  const [confirmArchive, setConfirmArchive] = useState(false)

  const cap = Number(capacity)
  const order = Number(sortOrder)
  const valid =
    name.trim().length > 0 &&
    Number.isInteger(cap) &&
    cap >= 1 &&
    cap <= 1000 &&
    Number.isInteger(order) &&
    order >= 0 &&
    order <= 9999
  const dirty =
    name.trim() !== room.name ||
    cap !== room.capacity ||
    order !== room.sortOrder

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      await update.mutateAsync({
        name: name.trim(),
        capacity: cap,
        sortOrder: order,
      })
      toast.success("Сохранено")
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить"))
    }
  }

  async function setActive(active: boolean) {
    try {
      await update.mutateAsync({ active })
      toast.success(
        active
          ? "Помещение возвращено из архива"
          : "Помещение отправлено в архив"
      )
      setConfirmArchive(false)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось изменить статус"))
    }
  }

  return (
    <>
      <PageHeader
        title={room.name}
        description={undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {ROOM_TYPE_LABEL[room.type]}
            </Badge>
            <ActiveBadge active={room.active} />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Тарифы</CardTitle>
          <CardDescription>
            {room.type === "PRIVATE"
              ? "Стоимость одного часа аренды помещения."
              : "Стоимость входа в общий зал."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TariffEditor room={room} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Основное</CardTitle>
          <CardDescription>Тип помещения изменить нельзя.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <FieldGroup className="max-w-md">
              <Field>
                <FieldLabel htmlFor="name">Название</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  maxLength={255}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="capacity">Вместимость</FieldLabel>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    max={1000}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sort">Порядок на экране</FieldLabel>
                  <Input
                    id="sort"
                    type="number"
                    min={0}
                    max={9999}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </Field>
              </div>
            </FieldGroup>
            <Button
              type="submit"
              disabled={!valid || !dirty || update.isPending}
            >
              {update.isPending ? "Сохранение…" : "Сохранить"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Архив</CardTitle>
          <CardDescription>
            Архивное помещение не показывается на кассе, но вся история
            посещений сохраняется.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          {room.active ? (
            <Button variant="outline" onClick={() => setConfirmArchive(true)}>
              Отправить в архив
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setActive(true)}
              disabled={update.isPending}
            >
              Вернуть из архива
            </Button>
          )}
          <PermanentDelete
            entity="Помещение"
            onDelete={() => remove.mutateAsync(room.id)}
            onDeleted={() => router.replace("/rooms")}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Отправить «${room.name}» в архив?`}
        description="Помещение исчезнет с кассы. Вернуть его можно в любой момент."
        confirmLabel="В архив"
        pending={update.isPending}
        onConfirm={() => setActive(false)}
      />
    </>
  )
}
