"use client"

import { ErrorState, LoadingRows } from "@/components/state-views"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime, MOVEMENT_LABEL } from "@/lib/labels"
import { useStockMovements } from "@/lib/queries/products"
import type { Product } from "@/lib/api/types"

export function StockHistoryDialog({
  product,
  timeZone,
  onOpenChange,
}: {
  product: Product | null
  timeZone: string
  onOpenChange: (open: boolean) => void
}) {
  const movements = useStockMovements(product?.id ?? null)

  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>История остатка</DialogTitle>
          <DialogDescription>
            {product?.name}. Последние операции, новые сверху.
          </DialogDescription>
        </DialogHeader>
        {movements.isPending ? (
          <LoadingRows rows={3} />
        ) : movements.isError ? (
          <ErrorState onRetry={() => movements.refetch()} />
        ) : movements.data.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Движений пока нет.
          </p>
        ) : (
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Когда</TableHead>
                  <TableHead>Операция</TableHead>
                  <TableHead className="text-right">Изменение</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead>Причина / кто</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(m.createdAt, timeZone)}
                    </TableCell>
                    <TableCell>{MOVEMENT_LABEL[m.type]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.quantityDelta > 0
                        ? `+${m.quantityDelta}`
                        : m.quantityDelta}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.balanceAfter}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.reason ?? "—"}
                      <span className="text-muted-foreground block text-xs">
                        {m.createdByName}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
