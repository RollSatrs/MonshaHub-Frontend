"use client"

import { useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { ActiveBadge } from "@/components/active-badge"
import { ServiceFormDialog } from "@/components/catalog/service-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState, LoadingRows } from "@/components/state-views"
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
import { getErrorMessage } from "@/lib/get-error-message"
import { formatMoney } from "@/lib/money"
import { useOrganization } from "@/lib/queries/organization"
import { useServices, useUpdateService } from "@/lib/queries/services"
import type { BathService } from "@/lib/api/types"

export default function ServicesPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<BathService | null>(null)
  const [archiving, setArchiving] = useState<BathService | null>(null)
  const services = useServices(showArchived)
  const update = useUpdateService()
  const org = useOrganization()
  const currency = org.data?.currency ?? "KZT"

  async function setActive(service: BathService, active: boolean) {
    try {
      await update.mutateAsync({ id: service.id, active })
      toast.success(
        active ? "Услуга возвращена из архива" : "Услуга отправлена в архив"
      )
      setArchiving(null)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось изменить статус"))
    }
  }

  return (
    <>
      <PageHeader
        title="Услуги"
        description="Услуги, которые заказывают во время посещения. В отличие от товаров, у услуг нет остатка."
        action={
          <Button onClick={() => setCreating(true)}>
            <IconPlus /> Добавить услугу
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

      {services.isPending ? (
        <LoadingRows />
      ) : services.isError ? (
        <ErrorState onRetry={() => services.refetch()} />
      ) : services.data.length === 0 ? (
        <EmptyState
          title="Услуг пока нет"
          description="Добавьте массаж, парение и другие услуги."
          action={
            <Button onClick={() => setCreating(true)}>Добавить услугу</Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.data.map((s) => (
                <TableRow
                  key={s.id}
                  className={s.active ? undefined : "text-muted-foreground"}
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(s.price, currency)}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={s.active} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(s)}
                      >
                        Изменить
                      </Button>
                      {s.active ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setArchiving(s)}
                        >
                          В архив
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActive(s, true)}
                        >
                          Вернуть
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {creating && <ServiceFormDialog open onOpenChange={setCreating} />}
      {editing && (
        <ServiceFormDialog
          key={editing.id}
          service={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={`Отправить «${archiving?.name}» в архив?`}
        description="Услуга перестанет предлагаться, история сохранится. Вернуть её можно в любой момент."
        confirmLabel="В архив"
        pending={update.isPending}
        onConfirm={() => archiving && setActive(archiving, false)}
      />
    </>
  )
}
