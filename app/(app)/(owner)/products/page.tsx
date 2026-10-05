"use client"

import { useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { ActiveBadge } from "@/components/active-badge"
import { ProductFormDialog } from "@/components/catalog/product-form-dialog"
import { StockHistoryDialog } from "@/components/catalog/stock-history-dialog"
import { StockMovementDialog } from "@/components/catalog/stock-movement-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
import { getErrorMessage } from "@/lib/get-error-message"
import { formatMoney } from "@/lib/money"
import { useOrganization } from "@/lib/queries/organization"
import { useProducts, useUpdateProduct } from "@/lib/queries/products"
import type { Product } from "@/lib/api/types"

export default function ProductsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [moving, setMoving] = useState<Product | null>(null)
  const [history, setHistory] = useState<Product | null>(null)
  const [archiving, setArchiving] = useState<Product | null>(null)
  const products = useProducts(showArchived)
  const update = useUpdateProduct()
  const org = useOrganization()
  const currency = org.data?.currency ?? "KZT"
  const visibleProducts =
    products.data?.filter((product) =>
      showArchived ? !product.active : product.active
    ) ?? []
  async function setActive(product: Product, active: boolean) {
    try {
      await update.mutateAsync({ id: product.id, active })
      toast.success(
        active ? "Товар возвращён из архива" : "Товар отправлен в архив"
      )
      setArchiving(null)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось изменить статус"))
    }
  }

  return (
    <>
      <PageHeader
        title="Товары"
        description="Товары, которые продаются во время посещения. Остаток меняется движениями и ведётся в журнале."
        action={
          <Button onClick={() => setCreating(true)}>
            <IconPlus /> Добавить товар
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

      {products.isPending ? (
        <LoadingRows />
      ) : products.isError ? (
        <ErrorState onRetry={() => products.refetch()} />
      ) : visibleProducts.length === 0 ? (
        <EmptyState
          title={showArchived ? "Архивных товаров нет" : "Товаров пока нет"}
          description={
            showArchived
              ? "Товары, отправленные в архив, появятся здесь."
              : "Добавьте веники, шапки, воду, чай — всё, что продаёте клиентам."
          }
          action={
            showArchived ? undefined : (
              <Button onClick={() => setCreating(true)}>Добавить товар</Button>
            )
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead className="text-right">Остаток</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleProducts.map((p) => (
                <TableRow
                  key={p.id}
                  className={p.active ? undefined : "text-muted-foreground"}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(p.price, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.stock === 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-warning-subtle text-warning rounded-full"
                      >
                        ⚠ Нет в наличии
                      </Badge>
                    ) : (
                      p.stock
                    )}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={p.active} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMoving(p)}
                      >
                        Движение остатка
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistory(p)}
                      >
                        История
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(p)}
                      >
                        Изменить
                      </Button>
                      {p.active ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setArchiving(p)}
                        >
                          В архив
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActive(p, true)}
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

      {creating && <ProductFormDialog open onOpenChange={setCreating} />}
      {editing && (
        <ProductFormDialog
          key={editing.id}
          product={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      <StockMovementDialog
        product={moving}
        onOpenChange={(o) => !o && setMoving(null)}
      />
      <StockHistoryDialog
        product={history}
        timeZone={org.data?.timezone ?? "Asia/Almaty"}
        onOpenChange={(o) => !o && setHistory(null)}
      />
      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={`Отправить «${archiving?.name}» в архив?`}
        description="Товар перестанет продаваться, но история продаж и остатков сохранится. Вернуть его можно в любой момент."
        confirmLabel="В архив"
        pending={update.isPending}
        onConfirm={() => archiving && setActive(archiving, false)}
      />
    </>
  )
}
