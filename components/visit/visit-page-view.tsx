"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"
import { toast } from "sonner"
import { GuestsDialog } from "@/components/live/guests-dialog"
import { ErrorState, LoadingRows } from "@/components/state-views"
import { CatalogDialog } from "@/components/visit/catalog-dialog"
import { ExtendDialog } from "@/components/visit/extend-dialog"
import { PaymentDialog } from "@/components/visit/payment-dialog"
import { ItemQuantityDialog } from "@/components/visit/item-quantity-dialog"
import { ReasonDialog } from "@/components/visit/reason-dialog"
import { VisitBill } from "@/components/visit/visit-bill"
import { VisitHeader } from "@/components/visit/visit-header"
import { Button } from "@/components/ui/button"
import { useServerNow } from "@/hooks/use-server-now"
import { parseApiError } from "@/lib/get-error-message"
import { useOrganization } from "@/lib/queries/organization"
import { useProducts } from "@/lib/queries/products"
import { useServices } from "@/lib/queries/services"
import {
  useAddGuests,
  useAddProduct,
  useAddService,
  useCancelVisit,
  useVisit,
  useReduceItem,
  useVoidItem,
} from "@/lib/queries/visits"
import type { VisitDetail, VisitItem } from "@/lib/api/types"

/** Экран посещения: чек, время, действия кассира. Данные и суммы приходят с backend. */
export function VisitPageView({ visitId }: { visitId: number }) {
  const visit = useVisit(visitId)

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/">
          <IconArrowLeft /> Баня сейчас
        </Link>
      </Button>
      {visit.isPending ? (
        <LoadingRows rows={4} />
      ) : visit.isError ? (
        parseApiError(visit.error).code === "NOT_FOUND" ? (
          <ErrorState message="Посещение не найдено" />
        ) : (
          <ErrorState onRetry={() => visit.refetch()} />
        )
      ) : (
        <VisitScreen visit={visit.data} receivedAt={visit.dataUpdatedAt} />
      )}
    </>
  )
}

type Dialog =
  "product" | "service" | "extend" | "payment" | "guests" | "cancel" | null

function VisitScreen({
  visit,
  receivedAt,
}: {
  visit: VisitDetail
  receivedAt: number
}) {
  const router = useRouter()
  const org = useOrganization()
  const timezone = org.data?.timezone ?? "Asia/Almaty"
  const nowMs = useServerNow(visit.serverTime, receivedAt)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [voiding, setVoiding] = useState<VisitItem | null>(null)
  const [editingQuantity, setEditingQuantity] = useState<VisitItem | null>(null)

  const active = visit.status === "ACTIVE"
  const products = useProducts(false)
  const services = useServices(false)
  const addProduct = useAddProduct(visit.id)
  const addService = useAddService(visit.id)
  const addGuests = useAddGuests(visit.id)
  const voidItem = useVoidItem(visit.id)
  const reduceItem = useReduceItem(visit.id)
  const cancel = useCancelVisit(visit.id)

  /** Сколько уже добавлено в чек (по названию из snapshot) — только подсказка на плитках. */
  const counts = (kind: VisitItem["kind"]) => {
    const map = new Map<string, number>()
    for (const it of visit.items) {
      if (it.kind === kind && !it.voided)
        map.set(it.name, (map.get(it.name) ?? 0) + it.quantity)
    }
    return map
  }
  const addedProducts = counts("PRODUCT")
  const addedServices = counts("SERVICE")
  const byName = <T extends { id: number; name: string }>(
    list: T[] | undefined,
    m: Map<string, number>
  ) => new Map((list ?? []).map((e) => [e.id, m.get(e.name) ?? 0]))

  const hasPayments = visit.payments.length > 0

  return (
    <>
      <VisitHeader visit={visit} timezone={timezone} nowMs={nowMs} />
      <VisitBill
        visit={visit}
        timezone={timezone}
        onVoid={setVoiding}
        onEditQuantity={setEditingQuantity}
      />

      {active ? (
        <div className="bg-background/95 sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <Button
            size="lg"
            variant="outline"
            className="h-12 text-base"
            onClick={() => setDialog("product")}
          >
            + Товар
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 text-base"
            onClick={() => setDialog("service")}
          >
            + Услуга
          </Button>
          {visit.kind === "PRIVATE" ? (
            <Button
              size="lg"
              variant="outline"
              className="h-12 text-base"
              onClick={() => setDialog("extend")}
            >
              Продлить
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="h-12 text-base"
              onClick={() => setDialog("guests")}
            >
              + Гости
            </Button>
          )}
          <Button
            size="lg"
            className="ml-auto h-12 text-base"
            onClick={() => setDialog("payment")}
          >
            {Number(visit.balance) > 0 ? "Оплатить / Завершить" : "Завершить"}
          </Button>
          {!hasPayments && (
            <Button
              variant="ghost"
              className="text-danger"
              onClick={() => setDialog("cancel")}
            >
              Отменить посещение
            </Button>
          )}
        </div>
      ) : (
        <p className="bg-secondary text-muted-foreground rounded-lg px-4 py-3 text-sm">
          {visit.status === "COMPLETED"
            ? "Посещение завершено — изменять его нельзя."
            : "Посещение отменено — изменять его нельзя."}
        </p>
      )}

      <CatalogDialog
        open={dialog === "product"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Добавить товар"
        entries={products.data?.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
        }))}
        isPending={products.isPending}
        isError={products.isError}
        onRetry={() => products.refetch()}
        currency={visit.currency}
        addedCounts={byName(products.data, addedProducts)}
        total={visit.total}
        add={(productId, quantity) =>
          addProduct.mutateAsync({ productId, quantity })
        }
      />
      <CatalogDialog
        open={dialog === "service"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Добавить услугу"
        entries={services.data?.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
        }))}
        isPending={services.isPending}
        isError={services.isError}
        onRetry={() => services.refetch()}
        currency={visit.currency}
        addedCounts={byName(services.data, addedServices)}
        total={visit.total}
        add={(serviceId, quantity) =>
          addService.mutateAsync({ serviceId, quantity })
        }
      />
      <ExtendDialog
        visit={visit}
        open={dialog === "extend"}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <PaymentDialog
        visit={visit}
        open={dialog === "payment"}
        onOpenChange={(o) => !o && setDialog(null)}
        onCompleted={() => router.push("/")}
      />
      <GuestsDialog
        open={dialog === "guests"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Добавить гостей в чек"
        description="Вместимость зала проверяется автоматически."
        submitLabel="Добавить"
        pending={addGuests.isPending}
        onSubmit={(guests) => addGuests.mutateAsync({ guests })}
      />
      <ReasonDialog
        open={voiding !== null}
        onOpenChange={(o) => !o && setVoiding(null)}
        title={`Убрать «${voiding?.name}»?`}
        description="Позиция не удаляется: сохранятся кто, когда и почему её убрал. Товар вернётся на склад."
        confirmLabel="Убрать позицию"
        quickReasons={["Добавили по ошибке", "Клиент отказался"]}
        pending={voidItem.isPending}
        onConfirm={async (reason) => {
          if (!voiding) return
          await voidItem.mutateAsync({ itemId: voiding.id, reason })
          toast.success("Позиция убрана")
        }}
      />
      <ItemQuantityDialog
        key={editingQuantity?.id ?? "closed"}
        item={editingQuantity}
        pending={reduceItem.isPending}
        onOpenChange={(open) => !open && setEditingQuantity(null)}
        onSubmit={async ({ quantity, reason }) => {
          if (!editingQuantity) return
          await reduceItem.mutateAsync({
            itemId: editingQuantity.id,
            quantity,
            reason,
          })
          setEditingQuantity(null)
        }}
      />
      <ReasonDialog
        open={dialog === "cancel"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Отменить посещение?"
        description="Только для посещений, начатых по ошибке и без оплаты. Товары вернутся на склад, действие сохранится в истории."
        confirmLabel="Отменить посещение"
        quickReasons={[
          "Начали по ошибке",
          "Клиент передумал",
          "Не то помещение",
        ]}
        pending={cancel.isPending}
        onConfirm={async (reason) => {
          await cancel.mutateAsync({ reason })
          toast.success("Посещение отменено")
          router.push("/")
        }}
      />
    </>
  )
}
