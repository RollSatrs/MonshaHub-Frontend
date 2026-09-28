"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { MoneyInput } from "@/components/money-input"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/get-error-message"
import { GUEST_LABEL } from "@/lib/labels"
import { isValidMoney } from "@/lib/money"
import { useCreateTariff, useUpdateTariff } from "@/lib/queries/rooms"
import type { GuestCategory, Room, Tariff } from "@/lib/api/types"

interface RowSpec {
  key: string
  label: string
  /** Название тарифа, сохраняемое в backend */
  name: string
  suffix: string
  guestCategory?: GuestCategory
}

function rowsFor(room: Room): RowSpec[] {
  if (room.type === "PRIVATE") {
    return [
      {
        key: "HOURLY",
        label: "Почасовой тариф",
        name: "Почасовой",
        suffix: "за час",
      },
    ]
  }
  return [
    {
      key: "ADULT",
      label: GUEST_LABEL.ADULT,
      name: GUEST_LABEL.ADULT,
      suffix: "за вход",
      guestCategory: "ADULT",
    },
    {
      key: "CHILD",
      label: GUEST_LABEL.CHILD,
      name: GUEST_LABEL.CHILD,
      suffix: "за вход",
      guestCategory: "CHILD",
    },
  ]
}

/** Тарифы помещения: PRIVATE — одна цена часа, PUBLIC — цена входа для взрослого и ребёнка. */
export function TariffEditor({ room }: { room: Room }) {
  return (
    <div className="space-y-4">
      {rowsFor(room).map((spec) => {
        const tariff = room.activeTariffs.find((t) =>
          spec.guestCategory
            ? t.guestCategory === spec.guestCategory
            : t.kind === "HOURLY"
        )
        return (
          <TariffRow
            key={`${spec.key}:${tariff?.id ?? "new"}:${tariff?.price ?? ""}`}
            room={room}
            spec={spec}
            tariff={tariff}
          />
        )
      })}
      <p className="text-muted-foreground text-xs">
        Смена цены не влияет на уже начатые посещения — в них сохраняется цена
        на момент начала.
      </p>
    </div>
  )
}

function TariffRow({
  room,
  spec,
  tariff,
}: {
  room: Room
  spec: RowSpec
  tariff?: Tariff
}) {
  const create = useCreateTariff()
  const update = useUpdateTariff()
  const [price, setPrice] = useState(
    tariff ? tariff.price.replace(/\.00$/, "") : ""
  )
  const [archiving, setArchiving] = useState(false)

  const valid = isValidMoney(price)
  const dirty = tariff
    ? price !== tariff.price.replace(/\.00$/, "")
    : price !== ""
  const pending = create.isPending || update.isPending

  async function save() {
    try {
      if (tariff) {
        await update.mutateAsync({ id: tariff.id, price })
        toast.success("Тариф сохранён")
      } else {
        await create.mutateAsync({
          roomId: room.id,
          name: spec.name,
          price,
          ...(spec.guestCategory ? { guestCategory: spec.guestCategory } : {}),
        })
        toast.success("Тариф задан")
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить тариф"))
    }
  }

  async function archive() {
    if (!tariff) return
    try {
      await update.mutateAsync({ id: tariff.id, active: false })
      toast.success("Тариф отправлен в архив")
      setArchiving(false)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось архивировать тариф"))
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <label
          htmlFor={`tariff-${spec.key}`}
          className="mb-1.5 block text-sm font-medium"
        >
          {spec.label}
        </label>
        <MoneyInput
          id={`tariff-${spec.key}`}
          value={price}
          onValueChange={setPrice}
          suffix={`₸ ${spec.suffix}`}
          placeholder={tariff ? undefined : "Не задан"}
          aria-invalid={price !== "" && !valid}
        />
      </div>
      <Button onClick={save} disabled={pending || !valid || !dirty}>
        {pending ? "Сохранение…" : tariff ? "Сохранить" : "Задать тариф"}
      </Button>
      {tariff && (
        <Button
          variant="ghost"
          onClick={() => setArchiving(true)}
          disabled={pending}
        >
          В архив
        </Button>
      )}
      <ConfirmDialog
        open={archiving}
        onOpenChange={setArchiving}
        title={`Архивировать тариф «${spec.label}»?`}
        description="Помещение останется без тарифа этого вида, пока вы не зададите новый. Начатые посещения не изменятся."
        confirmLabel="В архив"
        pending={update.isPending}
        onConfirm={archive}
      />
    </div>
  )
}
