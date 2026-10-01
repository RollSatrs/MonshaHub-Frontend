"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MoneyInput } from "@/components/money-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { getErrorMessage, parseApiError } from "@/lib/get-error-message"
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from "@/lib/labels"
import { formatMoney, isValidMoney, sameMoney, trimMoney } from "@/lib/money"
import { useAddPayment, useCompleteVisit } from "@/lib/queries/visits"
import type { PaymentMethod, VisitDetail } from "@/lib/api/types"

interface Props {
  visit: VisitDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  /** После завершения посещения (например, вернуться на «Баню сейчас») */
  onCompleted?: () => void
}

/**
 * Оплата и завершение. Остаток к оплате приходит с backend. «Оплатить и завершить» — платёж и выход
 * одной операцией; частичная оплата и несколько методов — через «Принять платёж».
 */
export function PaymentDialog({
  visit,
  open,
  onOpenChange,
  onCompleted,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <PaymentForm
            key={visit.balance}
            visit={visit}
            onClose={() => onOpenChange(false)}
            onCompleted={onCompleted}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PaymentForm({
  visit,
  onClose,
  onCompleted,
}: {
  visit: VisitDetail
  onClose: () => void
  onCompleted?: () => void
}) {
  const pay = useAddPayment(visit.id)
  const complete = useCompleteVisit(visit.id)
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [amount, setAmount] = useState(trimMoney(visit.balance))
  const [error, setError] = useState("")

  const settled = Number(visit.balance) === 0
  const valid = isValidMoney(amount) && Number(amount) > 0
  const full = valid && sameMoney(amount, visit.balance)
  const pending = pay.isPending || complete.isPending
  const active = visit.status === "ACTIVE"

  function onError(err: unknown) {
    const { code } = parseApiError(err)
    setError(
      code === "PAYMENT_EXCEEDS_BALANCE"
        ? "Сумма больше остатка к оплате — данные обновлены."
        : getErrorMessage(err, "Не удалось выполнить операцию")
    )
  }

  function finish(payments?: { method: PaymentMethod; amount: string }[]) {
    setError("")
    complete.mutate(payments ? { payments } : {}, {
      onSuccess: () => {
        toast.success("Посещение завершено")
        onClose()
        onCompleted?.()
      },
      onError,
    })
  }

  function takePayment() {
    setError("")
    pay.mutate(
      { method, amount },
      {
        onSuccess: (v) => {
          toast.success(
            `Принято ${formatMoney(amount, visit.currency)}. Осталось ${formatMoney(v.balance, visit.currency)}`
          )
          if (Number(v.balance) === 0) onClose()
        },
        onError,
      }
    )
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{settled ? "Завершить посещение" : "Оплата"}</DialogTitle>
        <DialogDescription>
          Итог {formatMoney(visit.total, visit.currency)} · оплачено{" "}
          {formatMoney(visit.paid, visit.currency)}
        </DialogDescription>
      </DialogHeader>

      <div className="bg-secondary rounded-xl p-4 text-center">
        <p className="text-muted-foreground text-sm">Осталось оплатить</p>
        <p
          className="text-4xl font-semibold tabular-nums"
          aria-label="Осталось оплатить"
        >
          {formatMoney(visit.balance, visit.currency)}
        </p>
      </div>

      {!settled && (
        <>
          <div>
            <p className="mb-2 text-sm font-medium">Способ оплаты</p>
            <div
              className="grid grid-cols-2 gap-2"
              role="group"
              aria-label="Способ оплаты"
            >
              {PAYMENT_METHODS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={method === m ? "default" : "outline"}
                  className="h-12 text-base"
                  aria-pressed={method === m}
                  onClick={() => setMethod(m)}
                >
                  {PAYMENT_METHOD_LABEL[m]}
                </Button>
              ))}
            </div>
          </div>
          <Field>
            <FieldLabel htmlFor="pay-amount">Сумма</FieldLabel>
            <div className="flex gap-2">
              <div className="flex-1">
                <MoneyInput
                  id="pay-amount"
                  value={amount}
                  onValueChange={setAmount}
                  suffix="₸"
                  aria-invalid={amount !== "" && !valid}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmount(trimMoney(visit.balance))}
              >
                Весь остаток
              </Button>
            </div>
          </Field>
        </>
      )}

      {error && (
        <p
          role="alert"
          className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm"
        >
          ⚠️ {error}
        </p>
      )}

      <DialogFooter className="flex-col gap-2 sm:flex-col">
        {settled ? (
          <Button
            size="lg"
            className="h-12 text-base"
            disabled={pending || !active}
            onClick={() => finish()}
          >
            {complete.isPending ? "Завершаем…" : "Завершить"}
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              className="h-12 text-base"
              disabled={pending || !active || !full}
              onClick={() => finish([{ method, amount }])}
            >
              {complete.isPending
                ? "Завершаем…"
                : `Оплатить ${formatMoney(visit.balance, visit.currency)} и завершить`}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 text-base"
              disabled={pending || !active || !valid}
              onClick={takePayment}
            >
              {pay.isPending ? "Принимаем…" : "Принять платёж (без завершения)"}
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" onClick={onClose}>
          Закрыть
        </Button>
      </DialogFooter>
    </div>
  )
}
