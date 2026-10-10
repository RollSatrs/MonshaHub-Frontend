"use client"

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
import {
  GUEST_LABEL,
  ITEM_KIND_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/labels"
import { formatMoney } from "@/lib/money"
import { formatDayTime, formatDuration } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { VisitDetail, VisitItem } from "@/lib/api/types"

interface Props {
  visit: VisitDetail
  timezone: string
  onVoid: (item: VisitItem) => void
  onEditQuantity: (item: VisitItem) => void
}

function itemTitle(item: VisitItem) {
  if (item.kind === "ENTRY" && item.guestCategory)
    return `Вход: ${GUEST_LABEL[item.guestCategory].toLowerCase()}`
  if (item.kind === "ROOM_TIME" && item.minutes)
    return `${item.name} · ${formatDuration(item.minutes)}`
  return item.name
}

/** Позиции чека, платежи и итоги — всё значения от backend. Убранные позиции остаются видны (аудит). */
export function VisitBill({ visit, timezone, onVoid, onEditQuantity }: Props) {
  const active = visit.status === "ACTIVE"
  const money = (v: string) => formatMoney(v, visit.currency)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="gap-0 overflow-x-auto border-t-[3px] border-t-primary p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Позиция</TableHead>
              <TableHead className="text-right">Кол-во</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visit.items.map((item) => (
              <TableRow
                key={item.id}
                className={cn(item.voided && "text-muted-foreground")}
                data-testid={`item-${item.id}`}
              >
                <TableCell>
                  {active &&
                  !item.voided &&
                  (item.kind === "PRODUCT" || item.kind === "SERVICE") ? (
                    <button
                      type="button"
                      className="hover:text-primary font-medium underline-offset-4 hover:underline"
                      onClick={() => onEditQuantity(item)}
                      aria-label={`Изменить количество: ${itemTitle(item)}`}
                    >
                      {itemTitle(item)} × {item.quantity}
                    </button>
                  ) : (
                    <p
                      className={cn(
                        "font-medium",
                        item.voided && "line-through"
                      )}
                    >
                      {itemTitle(item)}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {ITEM_KIND_LABEL[item.kind]} ·{" "}
                    {formatDayTime(item.createdAt, timezone)}
                    {item.createdByName ? ` · ${item.createdByName}` : ""}
                  </p>
                  {item.voided && (
                    <p className="text-danger text-xs">
                      ✕ Убрано
                      {item.voidedByName ? ` (${item.voidedByName})` : ""}:{" "}
                      {item.voidReason}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.kind === "ROOM_TIME" ? "—" : item.quantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(item.unitPrice)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums",
                    item.voided && "line-through"
                  )}
                >
                  {money(item.lineTotal)}
                </TableCell>
                <TableCell className="text-right">
                  {active && !item.voided && item.kind !== "ROOM_TIME" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onVoid(item)}
                      aria-label={`Убрать: ${itemTitle(item)}`}
                    >
                      Убрать
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="h-fit gap-3 border-t-[3px] border-t-primary p-5">
        <p className="-mx-5 -mt-5 rounded-t-lg bg-primary-subtle px-4 py-2 text-sm font-semibold text-primary">
          Счёт
        </p>
        <dl className="space-y-2">
          <div className="flex justify-between text-lg">
            <dt>Итого</dt>
            <dd className="font-semibold tabular-nums" aria-label="Итого">
              {money(visit.total)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Оплачено</dt>
            <dd className="tabular-nums" aria-label="Оплачено">
              {money(visit.paid)}
            </dd>
          </div>
          <div className="flex justify-between text-xl">
            <dt>Осталось оплатить</dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                Number(visit.balance) > 0 ? "text-warning" : "text-success"
              )}
              aria-label="Осталось оплатить"
            >
              {money(visit.balance)}
            </dd>
          </div>
        </dl>
        <p className="text-sm font-medium">
          {visit.paymentStatus === "PAID"
            ? "✓ "
            : visit.paymentStatus === "PARTIAL"
              ? "◐ "
              : "○ "}
          {PAYMENT_STATUS_LABEL[visit.paymentStatus]}
        </p>
        {visit.payments.length > 0 && (
          <ul className="border-t pt-2 text-sm">
            {visit.payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 py-0.5">
                <span className="text-muted-foreground">
                  {PAYMENT_METHOD_LABEL[p.method]} ·{" "}
                  {formatDayTime(p.createdAt, timezone)}
                </span>
                <span className="tabular-nums">{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
