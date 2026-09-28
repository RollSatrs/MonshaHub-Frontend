"use client"

import { useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { ActiveBadge } from "@/components/active-badge"
import { CashierFormDialog } from "@/components/catalog/cashier-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingRows } from "@/components/state-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getErrorMessage } from "@/lib/get-error-message"
import { useSetStaffActive, useStaff } from "@/lib/queries/staff"
import type { StaffMember } from "@/lib/api/types"

const ROLE_LABEL = { OWNER: "Владелец", CASHIER: "Кассир" } as const

export default function StaffPage() {
  const me = useCurrentUser()
  const staff = useStaff()
  const setActive = useSetStaffActive()
  const [creating, setCreating] = useState(false)
  const [deactivating, setDeactivating] = useState<StaffMember | null>(null)

  async function change(member: StaffMember, active: boolean) {
    try {
      await setActive.mutateAsync({ id: member.id, active })
      toast.success(active ? "Доступ возвращён" : "Доступ закрыт")
      setDeactivating(null)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось изменить статус"))
    }
  }

  return (
    <>
      <PageHeader
        title="Сотрудники"
        description="Кассиры вашей бани. Сотрудников не удаляют — при необходимости закройте доступ."
        action={
          <Button onClick={() => setCreating(true)}>
            <IconPlus /> Добавить кассира
          </Button>
        }
      />

      {staff.isPending ? (
        <LoadingRows />
      ) : staff.isError ? (
        <ErrorState onRetry={() => staff.refetch()} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.data.map((m) => (
                <TableRow
                  key={m.id}
                  className={m.active ? undefined : "text-muted-foreground"}
                >
                  <TableCell className="font-medium">
                    {m.fullname}
                    {m.id === me.id && (
                      <Badge variant="secondary" className="ml-2 rounded-full">
                        Вы
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{ROLE_LABEL[m.role]}</TableCell>
                  <TableCell>
                    <ActiveBadge active={m.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    {m.role === "CASHIER" &&
                      (m.active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeactivating(m)}
                        >
                          Закрыть доступ
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => change(m, true)}
                          disabled={setActive.isPending}
                        >
                          Вернуть доступ
                        </Button>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CashierFormDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(o) => !o && setDeactivating(null)}
        title={`Закрыть доступ для ${deactivating?.fullname}?`}
        description="Кассир сразу потеряет доступ, даже если он сейчас в системе. Доступ можно вернуть в любой момент."
        confirmLabel="Закрыть доступ"
        destructive
        pending={setActive.isPending}
        onConfirm={() => deactivating && change(deactivating, false)}
      />
    </>
  )
}
